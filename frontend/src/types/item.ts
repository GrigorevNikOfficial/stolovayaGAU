export interface Item {
  id: number;
  uniq_nom: string;
  name: string;
  description?: string;
  price: number;
  category?: string | number;
  cal?: number;
  number_pribors?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateItemRequest {
  uniq_nom: string;
  name: string;
  description?: string;
  price: number;
  category?: string | number;
  cal?: number;
  number_pribors?: number;
}

export interface UpdateItemRequest {
  id: number;
  uniq_nom: string;
  name: string;
  description?: string;
  price: number;
  category?: string | number;
  cal?: number;
  number_pribors?: number;
}
