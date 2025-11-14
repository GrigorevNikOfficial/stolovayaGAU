import { createEffect, createEvent, createStore, sample } from 'effector';
import { itemsApi } from '../api/items';
import type {
  Item,
  CreateItemPayload,
  UpdateItemPayload,
} from '../types/item';
// Убираем импорт categoriesApi и Category

// Events (оставляем только для товаров)
export const loadItems = createEvent<{
  category_slug?: string;
  available?: string;
}>();
export const loadItem = createEvent<string>();
export const loadItemsByCategory = createEvent<string>();
export const createItem = createEvent<CreateItemPayload>();
export const updateItem = createEvent<UpdateItemPayload>();
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
  async ({ data, imageFile }: CreateItemPayload) => {
    const response = await itemsApi.createItem(data);
    let createdItem = response.item;

    if (imageFile) {
      const uploadResponse = await itemsApi.uploadItemImage(
        createdItem._id,
        imageFile
      );
      createdItem = uploadResponse.item;
    }

    return {
      ...response,
      item: createdItem,
    };
  }
);

export const updateItemFx = createEffect(
  async ({ id, data, imageFile }: UpdateItemPayload) => {
    const response = await itemsApi.updateItem(id, data);
    let updatedItem = response.item;

    if (imageFile) {
      const uploadResponse = await itemsApi.uploadItemImage(id, imageFile);
      updatedItem = uploadResponse.item;
    }

    return {
      ...response,
      item: updatedItem,
    };
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

// Автоматическая перезагрузка после создания/обновления/удаления
sample({
  clock: createItemFx.done,
  fn: () => ({}),
  target: loadItems,
});

sample({
  clock: updateItemFx.done,
  fn: () => ({}),
  target: loadItems,
});

sample({
  clock: deleteItemFx.done,
  fn: () => ({}),
  target: loadItems,
});