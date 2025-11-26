// types/stock.ts
import type { Item } from './item';
import type { Point } from './points';

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

// Добавьте эти недостающие типы:
export interface StockResponse {
  message: string;
  stock: Stock;
}

export interface StockListResponse {
  stock: Stock[];
  total: number;
}

export interface StockWithDetailsListResponse {
  stock: StockWithDetails[];
  total: number;
}

export interface ReserveStockRequest {
  pointId: string;
  productId: string;
  quantity: number;
}

export interface ReleaseStockRequest {
  pointId: string;
  productId: string;
  quantity: number;
}

// Дополнительные типы для ошибок
export interface StockError {
  error: string;
  message?: string;
  status?: number;
}
