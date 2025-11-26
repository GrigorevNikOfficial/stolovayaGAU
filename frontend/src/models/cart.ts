// models/cart.ts
import { createEvent, createStore, sample } from 'effector';
import type { Item } from '../types/item.ts';
import { createOrder } from './orders.ts';

export interface CartItem {
  item: Item;
  quantity: number;
  availablePoints?: string[];
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

// Store с проверками на undefined
export const $cart = createStore<CartItem[]>([])
  .on(addToCart, (state, { item }) => {
    // Проверяем что товар валидный
    if (!item || !item._id || typeof item.price !== 'number') {
      console.error('Invalid item added to cart:', item);
      return state;
    }

    const existingItem = state.find(
      cartItem => cartItem.item && cartItem.item._id === item._id
    );

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
    state.filter(cartItem => cartItem.item && cartItem.item._id !== itemId)
  )
  .on(updateCartItemQuantity, (state, { id, quantity }) =>
    state.map(cartItem =>
      cartItem.item && cartItem.item._id === id
        ? { ...cartItem, quantity: Math.max(0, quantity) }
        : cartItem
    )
  )
  .on(clearCart, () => []);

// Total calculation с защитой от ошибок
export const $cartTotal = $cart.map(cart =>
  cart.reduce((total, { item, quantity }) => {
    if (!item || typeof item.price !== 'number') {
      console.warn('Invalid item in cart calculation:', item);
      return total;
    }
    return total + item.price * quantity;
  }, 0)
);

sample({
  clock: createOrderFromCart,
  fn: orderData => ({
    ...orderData,
  }),
  target: createOrder,
});
