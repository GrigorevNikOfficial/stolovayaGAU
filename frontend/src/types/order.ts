// types/order.ts
export interface Order {
  _id: string;
  user_id: string;
  order_number: string;
  items_total?: number;
  service_fee?: number;
  service_fee_type?: 'percent' | 'fixed' | 'none';
  service_fee_value?: number;
  total_amount: number;
  status:
    | 'created'
    | 'cooking'
    | 'waiting_delivery'
    | 'in_transit'
    | 'ready_for_pickup'
    | 'completed'
    | 'cancelled';
  delivery_method: 'dine_in' | 'pickup' | 'delivery';
  table_number?: number;
  delivery_address?: string;
  point_id?: string; // НОВОЕ: ID точки для заказа
  created_at: string;
  updated_at?: string;
  user_info?: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  status_history?: OrderHistory[];
  point_info?: {
    // НОВОЕ: информация о точке
    _id: string;
    name: string;
    type: 'canteen' | 'store';
    location: string;
  };
}

export interface OrderItem {
  _id: string;
  order_id: string;
  item_id: string;
  uniq_nom: string;
  name: string;
  quantity: number;
  price_at_time: number;
  stock_id?: string; // НОВОЕ: ID записи stock для отслеживания
}

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  history: OrderHistory[];
  point?: {
    // НОВОЕ: детальная информация о точке
    _id: string;
    name: string;
    type: 'canteen' | 'store';
    location: string;
    phone: string;
  };
}

export interface OrderHistory {
  _id: string;
  order_id: string;
  status: string;
  notes: string;
  changed_at: string;
}

export interface CreateOrderRequest {
  delivery_method: 'dine_in' | 'pickup' | 'delivery';
  table_number?: number;
  delivery_address?: string;
  point_id?: string; // НОВОЕ: ID точки для заказа
  items: Array<{
    stock_id: string; // ИЗМЕНЕНО: теперь используем stock_id вместо item_id
    quantity: number;
  }>;
}

export interface UpdateOrderRequest {
  id: string;
  status?: Order['status'];
  delivery_method?: 'dine_in' | 'pickup' | 'delivery';
  table_number?: number;
  delivery_address?: string;
  point_id?: string; // НОВОЕ: можно обновить точку
}
