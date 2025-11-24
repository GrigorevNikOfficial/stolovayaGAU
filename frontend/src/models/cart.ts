// models/cart.ts
import { createEvent, createStore, sample } from 'effector';
import type { Item } from '../types/item.ts';
import { createOrder } from './orders.ts';

// Тип элемента корзины теперь включает информацию о stock
export interface CartItem {
  item: Item;
  quantity: number;
  availablePoints?: string[]; // Точки где товар доступен
}

// Events
export const addToCart = createEvent<{ item: Item; pointId?: string }>();
export const removeFromCart = createEvent<string>();
export const updateCartItemQuantity = createEvent<{
  id: string;
  quantity: number;
}>();
export const clearCart = createEvent();
export const createOrderFromCart = createEvent<{
  delivery_method: 'dine_in' | 'pickup' | 'delivery';
  point_id?: string;
  table_number?: number;
  delivery_address?: string;
  items: Array<{ stock_id: string; quantity: number }>;
}>();

// Store
export const $cart = createStore<CartItem[]>([])
  .on(addToCart, (state, { item }) => {
    const existingItem = state.find(cartItem => cartItem.item._id === item._id);
    if (existingItem) {
      return state.map(cartItem =>
        cartItem.item._id === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    }
    return [...state, { item, quantity: 1 }];
  })
  .on(removeFromCart, (state, itemId) =>
    state.filter(cartItem => cartItem.item._id !== itemId)
  )
  .on(updateCartItemQuantity, (state, { id, quantity }) =>
    state.map(cartItem =>
      cartItem.item._id === id ? { ...cartItem, quantity } : cartItem
    )
  )
  .on(clearCart, () => []);

// Total calculation
export const $cartTotal = $cart.map(cart =>
  cart.reduce((total, { item, quantity }) => total + item.price * quantity, 0)
);

// Sample для создания заказа из корзины
sample({
  clock: createOrderFromCart,
  fn: orderData => ({
    ...orderData,
    // items уже подготовлены с stock_id в CartBlock
  }),
  target: createOrder,
});
