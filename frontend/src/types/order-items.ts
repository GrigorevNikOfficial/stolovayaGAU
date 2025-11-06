export interface OrderItem {
  id: number;
  orderId: number;
  itemId: number;
  quantity: number;
}

export interface CreateOrderItemRequest {
  orderId: number;
  itemId: number;
  quantity: number;
}

export interface UpdateOrderItemRequest {
  id: number;
  orderId: number;
  itemId: number;
  quantity: number;
}
