export interface Item {
  id: number;
  name: string;
  price: number;
  description?: string;
  category: string;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemRequest {
  name: string;
  price: number;
  description?: string;
  category: string;
  inStock: boolean;
}

export interface UpdateItemRequest {
  id: number;
  name?: string;
  price?: number;
  description?: string;
  category?: string;
  inStock?: boolean;
}
