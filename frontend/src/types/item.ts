import type { Category } from './category'; // Импортируем из отдельного файла

export interface Item {
  _id: string;
  uniq_nom: string;
  name: string;
  description: string;
  price: number;
  category_slug: string;
  calories: number;
  number_pribors: number;
  image_url?: string;
  is_available: boolean;
  ingredients: string[];
  allergens: string[];
  preparation_time: number;
  nutrition: {
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

// Остальные интерфейсы остаются без Category
export interface CreateItemRequest {
  uniq_nom: string;
  name: string;
  description: string;
  price: number;
  category_slug: string;
  calories?: number;
  number_pribors?: number;
  is_available?: boolean;
  ingredients?: string[];
  allergens?: string[];
  preparation_time?: number;
  nutrition?: object;
  sort_order?: number;
}

export interface UpdateItemRequest {
  uniq_nom?: string;
  name?: string;
  description?: string;
  price?: number;
  category_slug?: string;
  calories?: number;
  number_pribors?: number;
  is_available?: boolean;
  ingredients?: string[];
  allergens?: string[];
  preparation_time?: number;
  nutrition?: object;
  sort_order?: number;
}
