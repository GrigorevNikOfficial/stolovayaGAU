export interface Order {
  id: number;
  user_id: number;
  order_number: string;
  total_amount: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'cooking'
    | 'ready'
    | 'delivering'
    | 'delivered'
    | 'cancelled'
    | 'completed'; // Добавляем новый статус для самовывоза
  delivery_method: 'pickup' | 'delivery'; // Добавляем поле способа доставки
  tracking_number?: string;
  delivery_status?: string;
  address?: string;
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  item_id: number;
  quantity: number;
  price_at_time: number;
  name?: string;
  image_url?: string;
  description?: string;
}

export interface OrderWithDetails extends Order {
  items: OrderItem[];
  history: OrderHistory[];
}

export interface OrderHistory {
  id: number;
  order_id: number;
  status: string;
  notes: string;
  changed_at: string;
}

export interface CreateOrderRequest {
  items: Array<{
    id: number;
    quantity: number;
  }>;
  deliveryMethod: 'pickup' | 'delivery'; // Заменяем address на deliveryMethod
}

export interface UpdateOrderRequest {
  id: number;
  status: Order['status'];
}
