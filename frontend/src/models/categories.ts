import { createEffect, createEvent, createStore, sample } from 'effector';
import { categoriesApi } from '../api/categories';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types/category';

// Events
export const loadCategories = createEvent();
export const createCategory = createEvent<CreateCategoryRequest>();
export const updateCategory = createEvent<{
  id: string;
  data: UpdateCategoryRequest;
}>();
export const setActiveCategory = createEvent<string | null>(); // Для фильтрации
export const refreshCategories = createEvent();

// Effects
export const loadCategoriesFx = createEffect(async (): Promise<Category[]> => {
  return await categoriesApi.getCategories();
});

export const createCategoryFx = createEffect(
  async (categoryData: CreateCategoryRequest) => {
    const response = await categoriesApi.createCategory(categoryData);
    return response;
  }
);

export const updateCategoryFx = createEffect(
  async ({ id, data }: { id: string; data: UpdateCategoryRequest }) => {
    const response = await categoriesApi.updateCategory(id, data);
    return response;
  }
);

// Stores
export const $categories = createStore<Category[]>([])
  .on(loadCategoriesFx.doneData, (_, categories) => categories)
  .on(createCategoryFx.doneData, (state, { category }) => [...state, category])
  .on(updateCategoryFx.doneData, (state, { category }) =>
    state.map(cat => (cat._id === category._id ? category : cat))
  );

// Активная категория для фильтрации
export const $activeCategory = createStore<string | null>(null)
  .on(setActiveCategory, (_, categorySlug) => categorySlug)
  .reset(loadCategories);

// Отфильтрованные категории (только активные)
export const $activeCategories = $categories.map(categories =>
  categories.filter(category => category.is_active)
);

// Категории для выпадающих списков и т.д.
export const $categoriesForSelect = $activeCategories.map(categories =>
  categories.map(category => ({
    value: category.slug,
    label: category.name,
    description: category.description,
  }))
);

// Stores для UI состояния
export const $categoriesLoading = createStore(false).on(
  loadCategoriesFx.pending,
  (_, pending) => pending
);

export const $categoryCreating = createStore(false).on(
  createCategoryFx.pending,
  (_, pending) => pending
);

export const $categoryUpdating = createStore(false).on(
  updateCategoryFx.pending,
  (_, pending) => pending
);

export const $categoriesError = createStore<string | null>(null)
  .on(loadCategoriesFx.fail, (_, { error }) => error.message)
  .on(createCategoryFx.fail, (_, { error }) => error.message)
  .on(updateCategoryFx.fail, (_, { error }) => error.message)
  .reset([loadCategories, createCategory, updateCategory, refreshCategories]);

// Samples
sample({
  clock: loadCategories,
  target: loadCategoriesFx,
});

sample({
  clock: refreshCategories,
  target: loadCategoriesFx,
});

sample({
  clock: createCategory,
  target: createCategoryFx,
});

sample({
  clock: updateCategory,
  target: updateCategoryFx,
});

// Автоматическое обновление списка после создания/обновления
sample({
  clock: createCategoryFx.done,
  target: refreshCategories,
});

sample({
  clock: updateCategoryFx.done,
  target: refreshCategories,
});
