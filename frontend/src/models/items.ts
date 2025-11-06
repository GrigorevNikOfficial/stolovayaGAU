import { createEffect, createEvent, createStore, sample } from 'effector';
import { itemsApi } from '../api/items/items';
import type { Item } from '../types/item';

// Events
export const loadItems = createEvent();
export const createItem = createEvent<Item>();
export const updateItem = createEvent<Item>();
export const deleteItem = createEvent<number>();
export const clearItems = createEvent();

// Effects
export const loadItemsFx = createEffect(async (): Promise<Item[]> => {
  return await itemsApi.getItems();
});

export const createItemFx = createEffect(async (item: Item): Promise<Item> => {
  return await itemsApi.createItem(item);
});

export const updateItemFx = createEffect(async (item: Item): Promise<Item> => {
  return await itemsApi.updateItem(item);
});

export const deleteItemFx = createEffect(
  async (itemId: number): Promise<void> => {
    await itemsApi.deleteItem(itemId);
  }
);

// Stores
export const $items = createStore<Item[]>([])
  .on(loadItemsFx.doneData, (_, items) => items)
  .on(createItemFx.doneData, (state, newItem) => [...state, newItem])
  .on(updateItemFx.doneData, (state, updatedItem) =>
    state.map(item => (item.id === updatedItem.id ? updatedItem : item))
  )
  .on(deleteItemFx.done, (state, { params: itemId }) =>
    state.filter(item => item.id !== itemId)
  )
  .reset(clearItems);

export const $isLoading = createStore(false)
  .on(loadItemsFx.pending, (_, pending) => pending)
  .on(createItemFx.pending, (_, pending) => pending)
  .on(updateItemFx.pending, (_, pending) => pending)
  .on(deleteItemFx.pending, (_, pending) => pending);

export const $itemsError = createStore<string | null>(null)
  .on(loadItemsFx.fail, (_, { error }) => error.message)
  .on(createItemFx.fail, (_, { error }) => error.message)
  .on(updateItemFx.fail, (_, { error }) => error.message)
  .on(deleteItemFx.fail, (_, { error }) => error.message)
  .reset([loadItems, createItem, updateItem, deleteItem]);

// Samples
sample({
  clock: loadItems,
  target: loadItemsFx,
});

sample({
  clock: createItem,
  target: createItemFx,
});

sample({
  clock: updateItem,
  target: updateItemFx,
});

sample({
  clock: deleteItem,
  target: deleteItemFx,
});
