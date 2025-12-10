export interface Order {
  _id: string; // Из number в string (ObjectId)
  user_id: string; // Из number в string
  order_number: string;
  items_total?: number; // Сумма без сервисного сбора
  service_fee?: number; // Размер сервисного сбора
  service_fee_type?: 'percent' | 'fixed' | 'none'; // Тип сбора
  service_fee_value?: number; // Значение настройки, % или баллы
  total_amount: number; // Итоговая сумма с учетом сбора
  ready_time?: string; // Время, к которому заказ должен быть готов
  status:
    | 'created'
    | 'cooking'
    | 'waiting_delivery'
    | 'in_transit'
    | 'ready_for_pickup'
    | 'completed'
    | 'cancelled';
  delivery_method: 'dine_in' | 'pickup' | 'delivery'; // Добавили dine_in
  table_number?: number; // Новое поле для dine_in
  delivery_address?: 'эк' | 'гл';
  created_at: string;
  updated_at?: string;
  // Новые поля из MongoDB
  user_info?: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  status_history?: OrderHistory[]; // Встроенная история
}

export interface OrderItem {
  _id: string; // Из number в string
  order_id: string; // Из number в string
  item_id: string; // Из number в string
  uniq_nom: string; // Новое поле
  name: string;
  quantity: number;
  price_at_time: number;
  // image_url и description теперь не нужны, т.к. есть в items
}

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  history: OrderHistory[];
}

export interface OrderHistory {
  _id: string; // Из number в string
  order_id: string; // Из number в string
  status: string;
  notes: string;
  changed_at: string;
}

export interface CreateOrderRequest {
  items: Array<{
    id: string; // Из number в string
    quantity: number;
  }>;
  delivery_method: 'dine_in' | 'pickup' | 'delivery';
  table_number?: number; // Для dine_in
  delivery_address?: string; // Для delivery
  ready_time?: string; // ISO string or HH:MM - время, к которому заказ должен быть готов
}

export interface UpdateOrderRequest {
  id: string; // Из number в string
  status?: Order['status'];
  delivery_method?: 'dine_in' | 'pickup' | 'delivery';
  table_number?: number;
  delivery_address?: string;
}
