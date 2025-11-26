import { createEvent, createStore, sample } from 'effector';
import { $currentUser } from './users';
import { createOrder, createOrderFx } from './orders';

// Типы для корзины
interface CartItem {
  _id: string; // Из number в string
  uniq_nom: string; // Новое поле
  name: string;
  price: number;
  description?: string;
  category_slug?: string; // Из category в category_slug
  calories?: number; // Из cal в calories
  number_pribors?: number;
  image_url?: string;
  preparation_time?: number;
}

interface CartItemWithQuantity {
  item: CartItem;
  quantity: number;
}

// Events
export const addToCart = createEvent<CartItem>();
export const removeFromCart = createEvent<string>(); // Из number в string
export const updateCartItemQuantity = createEvent<{
  id: string; // Из number в string
  quantity: number;
}>();
export const clearCart = createEvent();
export const setCartOpen = createEvent<boolean>();
export const createOrderFromCart = createEvent<{
  delivery_method: 'dine_in' | 'pickup' | 'delivery'; // Обновленный тип
  table_number?: number; // Новое поле для dine_in
  delivery_address?: string; // Для delivery
  ready_time?: string; // ISO string or time
}>();

// Stores
export const $cart = createStore<CartItemWithQuantity[]>([])
  .on(addToCart, (state, item) => {
    const existingItem = state.find(cartItem => cartItem.item._id === item._id); // _id вместо id
    if (existingItem) {
      return state.map(cartItem =>
        cartItem.item._id === item._id // _id вместо id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    }
    return [...state, { item, quantity: 1 }];
  })
  .on(
    removeFromCart,
    (state, itemId) => state.filter(cartItem => cartItem.item._id !== itemId) // _id вместо id
  )
  .on(updateCartItemQuantity, (state, { id, quantity }) =>
    state.map(cartItem =>
      cartItem.item._id === id // _id вместо id
        ? { ...cartItem, quantity: Math.max(0, quantity) }
        : cartItem
    )
  )
  .reset(clearCart);

export const $cartItemsCount = $cart.map(cart =>
  cart.reduce((total, item) => total + item.quantity, 0)
);

export const $cartTotal = $cart.map(cart =>
  cart.reduce(
    (total, cartItem) => total + cartItem.item.price * cartItem.quantity,
    0
  )
);

export const $isCartOpen = createStore(false)
  .on(setCartOpen, (_, isOpen) => isOpen)
  .reset(clearCart);

// Дополнительные computed stores для удобства
export const $cartItems = $cart.map(cart =>
  cart.map(cartItem => ({
    ...cartItem.item,
    quantity: cartItem.quantity,
    total: cartItem.item.price * cartItem.quantity,
  }))
);

export const $cartPreparationTime = $cart.map(cart =>
  cart.reduce(
    (total, cartItem) =>
      total + (cartItem.item.preparation_time || 5) * cartItem.quantity,
    0
  )
);

// Samples
sample({
  clock: createOrderFromCart,
  source: {
    cart: $cart,
    currentUser: $currentUser,
  },
  filter: ({ cart, currentUser }) => cart.length > 0 && currentUser !== null,
  fn: ({ cart }, orderData) => ({
    items: cart.map(cartItem => ({
      id: cartItem.item._id, // _id вместо id
      quantity: cartItem.quantity,
    })),
    delivery_method: orderData.delivery_method, // Обновленное поле
    table_number: orderData.table_number, // Новое поле
    delivery_address: orderData.delivery_address, // Новое поле
    ready_time: orderData.ready_time,
  }),
  target: createOrder,
});

// Автоматически очищаем корзину после успешного создания заказа
sample({
  clock: createOrderFx.done,
  target: clearCart,
});

// Дополнительные events для управления корзиной
export const incrementCartItem = createEvent<string>(); // _id товара
export const decrementCartItem = createEvent<string>(); // _id товара

// Обработчики для increment/decrement
sample({
  clock: incrementCartItem,
  source: $cart,
  fn: (cart, itemId) => {
    const existingItem = cart.find(cartItem => cartItem.item._id === itemId);
    if (existingItem) {
      return { id: itemId, quantity: existingItem.quantity + 1 };
    }
    return { id: itemId, quantity: 1 };
  },
  target: updateCartItemQuantity,
});

sample({
  clock: decrementCartItem,
  source: $cart,
  fn: (cart, itemId) => {
    const existingItem = cart.find(cartItem => cartItem.item._id === itemId);
    if (existingItem && existingItem.quantity > 1) {
      return { id: itemId, quantity: existingItem.quantity - 1 };
    }
    return { id: itemId, quantity: 0 }; // Удалить если 0
  },
  target: updateCartItemQuantity,
});
