import { createEffect, createEvent, createStore, sample } from 'effector';
import { itemsApi } from '../api/items';
import type { Item, CreateItemRequest, UpdateItemRequest } from '../types/item';
// Убираем импорт categoriesApi и Category

// Events (оставляем только для товаров)
export const loadItems = createEvent<{
  category_slug?: string;
  available?: string;
}>();
export const loadItem = createEvent<string>();
export const loadItemsByCategory = createEvent<string>();
export const createItem = createEvent<CreateItemRequest>();
export const updateItem = createEvent<{
  id: string;
  data: UpdateItemRequest;
}>();
export const deleteItem = createEvent<string>();

// Effects (только для товаров)
export const loadItemsFx = createEffect(
  async (params: { category_slug?: string; available?: string }) => {
    const response = await itemsApi.getItems(params);
    return response;
  }
);

export const loadItemFx = createEffect(async (id: string): Promise<Item> => {
  return await itemsApi.getItem(id);
});

export const loadItemsByCategoryFx = createEffect(
  async (category_slug: string) => {
    const response = await itemsApi.getItemsByCategory(category_slug);
    return response;
  }
);

export const createItemFx = createEffect(
  async (itemData: CreateItemRequest) => {
    const response = await itemsApi.createItem(itemData);
    return response;
  }
);

export const updateItemFx = createEffect(
  async ({ id, data }: { id: string; data: UpdateItemRequest }) => {
    const response = await itemsApi.updateItem(id, data);
    return response;
  }
);

export const deleteItemFx = createEffect(async (id: string) => {
  const response = await itemsApi.deleteItem(id);
  return { id, response };
});

// Stores (только для товаров)
export const $items = createStore<Item[]>([])
  .on(loadItemsFx.doneData, (_, { items }) => items)
  .on(loadItemsByCategoryFx.doneData, (_, { items }) => items)
  .on(createItemFx.doneData, (state, { item }) => [...state, item])
  .on(updateItemFx.doneData, (state, { item }) =>
    state.map(i => (i._id === item._id ? item : i))
  )
  .on(deleteItemFx.doneData, (state, { id }) =>
    state.filter(item => item._id !== id)
  );

export const $currentItem = createStore<Item | null>(null)
  .on(loadItemFx.doneData, (_, item) => item)
  .reset([loadItems, loadItemsByCategory]);

export const $itemsError = createStore<string | null>(null)
  .on(loadItemsFx.fail, (_, { error }) => error.message)
  .on(createItemFx.fail, (_, { error }) => error.message)
  .on(updateItemFx.fail, (_, { error }) => error.message)
  .on(deleteItemFx.fail, (_, { error }) => error.message)
  .reset([loadItems, createItem, updateItem, deleteItem]);

// Samples (только для товаров)
sample({
  clock: loadItems,
  target: loadItemsFx,
});

sample({
  clock: loadItem,
  target: loadItemFx,
});

sample({
  clock: loadItemsByCategory,
  target: loadItemsByCategoryFx,
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
