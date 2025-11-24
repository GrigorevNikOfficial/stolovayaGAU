// types/stock.ts
import type { Item } from './item';
import type { Point } from './points'; // Исправить на points.ts

export interface Stock {
  _id: string;
  pointId: string;
  productId: string;
  quantity: number;
  reserved: number;
  available: number;
  lastUpdated: string;
}

export interface StockWithDetails extends Stock {
  product?: Item;
  point?: Point;
}

export interface UpdateStockRequest {
  quantity?: number;
  reserved?: number;
  available?: number;
}

export interface CreateStockRequest {
  pointId: string;
  productId: string;
  quantity: number;
  reserved?: number;
}
