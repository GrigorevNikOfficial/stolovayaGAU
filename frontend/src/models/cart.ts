import { createEvent, createStore, sample } from 'effector';
import { $currentUser } from './users';
import { createOrder, createOrderFx } from './orders'; // Импортируем Effect

// Типы для корзины
interface CartItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  category?: string | number;
  cal?: number;
  number_pribors?: number;
}

interface CartItemWithQuantity {
  item: CartItem;
  quantity: number;
}

// Events
export const addToCart = createEvent<CartItem>();
export const removeFromCart = createEvent<number>();
export const updateCartItemQuantity = createEvent<{
  id: number;
  quantity: number;
}>();
export const clearCart = createEvent();
export const setCartOpen = createEvent<boolean>();
export const createOrderFromCart = createEvent<string>();

// Stores
export const $cart = createStore<CartItemWithQuantity[]>([])
  .on(addToCart, (state, item) => {
    const existingItem = state.find(cartItem => cartItem.item.id === item.id);
    if (existingItem) {
      return state.map(cartItem =>
        cartItem.item.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    }
    return [...state, { item, quantity: 1 }];
  })
  .on(removeFromCart, (state, itemId) =>
    state.filter(cartItem => cartItem.item.id !== itemId)
  )
  .on(updateCartItemQuantity, (state, { id, quantity }) =>
    state.map(cartItem =>
      cartItem.item.id === id
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

// Samples
// В событии createOrderFromCart
sample({
  clock: createOrderFromCart,
  source: {
    cart: $cart,
    currentUser: $currentUser,
  },
  filter: ({ cart, currentUser }) => cart.length > 0 && currentUser !== null,
  fn: ({ cart }, deliveryMethod) => ({
    items: cart.map(cartItem => ({
      id: cartItem.item.id,
      quantity: cartItem.quantity,
    })),
    deliveryMethod: deliveryMethod, // Теперь соответствует типу
  }),
  target: createOrder,
});
