export interface OrderItem {
  itemId: number;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  userId: number;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  userId: number;
  items: OrderItem[];
  shippingAddress: string;
}

export interface UpdateOrderRequest {
  id: number;
  status?: Order['status'];
  shippingAddress?: string;
}
