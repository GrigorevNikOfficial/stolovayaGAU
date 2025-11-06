import { createEffect, createEvent, createStore, sample } from 'effector';
import { itemsApi } from '../api/items/items'; // Убедитесь, что путь правильный
import type { CreateItemRequest, Item, UpdateItemRequest } from '../types/item';

// Events
export const loadItems = createEvent();
export const createItem = createEvent<CreateItemRequest>();
export const updateItem = createEvent<UpdateItemRequest>();
export const patchItem = createEvent<{
  id: number;
  updates: Partial<UpdateItemRequest>;
}>();
export const deleteItem = createEvent<number>();
export const setEditingItem = createEvent<Item | null>();
export const resetForm = createEvent();
export const searchItems = createEvent<string>();
export const loadItemsByCategory = createEvent<string>();
export const clearSearch = createEvent();
export const clearCategory = createEvent();

// Effects
export const loadItemsFx = createEffect(async (): Promise<Item[]> => {
  return await itemsApi.getItems();
});

export const createItemFx = createEffect(
  async (item: CreateItemRequest): Promise<Item> => {
    return await itemsApi.createItem(item);
  }
);

export const updateItemFx = createEffect(
  async (item: UpdateItemRequest): Promise<Item> => {
    return await itemsApi.updateItem(item);
  }
);

export const patchItemFx = createEffect(
  async ({
    id,
    updates,
  }: {
    id: number;
    updates: Partial<UpdateItemRequest>;
  }): Promise<Item> => {
    return await itemsApi.patchItem(id, updates);
  }
);

export const deleteItemFx = createEffect(
  async (id: number): Promise<number> => {
    await itemsApi.deleteItem(id);
    return id;
  }
);

export const searchItemsFx = createEffect(
  async (query: string): Promise<Item[]> => {
    if (!query.trim()) {
      return await itemsApi.getItems();
    }
    return await itemsApi.searchItems(query);
  }
);

export const loadItemsByCategoryFx = createEffect(
  async (category: string): Promise<Item[]> => {
    if (!category.trim()) {
      return await itemsApi.getItems();
    }
    return await itemsApi.getItemsByCategory(category);
  }
);

// Stores
export const $items = createStore<Item[]>([])
  .on(loadItemsFx.doneData, (_, items) => items)
  .on(createItemFx.doneData, (state, newItem) => [newItem, ...state])
  .on(updateItemFx.doneData, (state, updatedItem) =>
    state.map(item => (item.id === updatedItem.id ? updatedItem : item))
  )
  .on(patchItemFx.doneData, (state, updatedItem) =>
    state.map(item => (item.id === updatedItem.id ? updatedItem : item))
  )
  .on(deleteItemFx.doneData, (state, deletedId) =>
    state.filter(item => item.id !== deletedId)
  );

// Store для отображаемых items (с учетом поиска и фильтрации)
export const $displayedItems = createStore<Item[]>([])
  .on(loadItemsFx.doneData, (_, items) => items)
  .on(createItemFx.doneData, (state, newItem) => [newItem, ...state])
  .on(updateItemFx.doneData, (state, updatedItem) =>
    state.map(item => (item.id === updatedItem.id ? updatedItem : item))
  )
  .on(patchItemFx.doneData, (state, updatedItem) =>
    state.map(item => (item.id === updatedItem.id ? updatedItem : item))
  )
  .on(deleteItemFx.doneData, (state, deletedId) =>
    state.filter(item => item.id !== deletedId)
  )
  .on(searchItemsFx.doneData, (_, items) => items)
  .on(loadItemsByCategoryFx.doneData, (_, items) => items);

export const $editingItem = createStore<Item | null>(null)
  .on(setEditingItem, (_, item) => item)
  .reset([createItemFx.done, updateItemFx.done, patchItemFx.done, resetForm]);

export const $isLoading = createStore(false)
  .on(loadItemsFx.pending, (_, pending) => pending)
  .on(searchItemsFx.pending, (_, pending) => pending)
  .on(loadItemsByCategoryFx.pending, (_, pending) => pending);

export const $isMutating = createStore(false)
  .on(createItemFx.pending, (_, pending) => pending)
  .on(updateItemFx.pending, (_, pending) => pending)
  .on(patchItemFx.pending, (_, pending) => pending)
  .on(deleteItemFx.pending, (_, pending) => pending);

export const $error = createStore<string | null>(null)
  .on(loadItemsFx.fail, (_, { error }) => error.message)
  .on(createItemFx.fail, (_, { error }) => error.message)
  .on(updateItemFx.fail, (_, { error }) => error.message)
  .on(patchItemFx.fail, (_, { error }) => error.message)
  .on(deleteItemFx.fail, (_, { error }) => error.message)
  .on(searchItemsFx.fail, (_, { error }) => error.message)
  .on(loadItemsByCategoryFx.fail, (_, { error }) => error.message)
  .reset([
    loadItems,
    createItem,
    updateItem,
    patchItem,
    deleteItem,
    searchItems,
    loadItemsByCategory,
    clearSearch,
    clearCategory,
  ]);

export const $searchQuery = createStore('')
  .on(searchItems, (_, query) => query)
  .reset(clearSearch);

export const $currentCategory = createStore('')
  .on(loadItemsByCategory, (_, category) => category)
  .reset(clearCategory);

// Stores для UI состояния
export const $isSearching = createStore(false).on(
  searchItemsFx.pending,
  (_, pending) => pending
);

export const $isFilteringByCategory = createStore(false).on(
  loadItemsByCategoryFx.pending,
  (_, pending) => pending
);

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
  clock: patchItem,
  target: patchItemFx,
});

sample({
  clock: deleteItem,
  target: deleteItemFx,
});

sample({
  clock: searchItems,
  target: searchItemsFx,
});

sample({
  clock: loadItemsByCategory,
  target: loadItemsByCategoryFx,
});

// Автоматическая очистка поиска/категории при загрузке всех items
sample({
  clock: loadItems,
  target: [clearSearch, clearCategory],
});
