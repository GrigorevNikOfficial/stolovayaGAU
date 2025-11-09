export interface Delivery {
  id: number;
  orderId: number;
  trackingNumber: number;
  address: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  deliveryDate: number | string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDeliveryRequest {
  orderId: number;
  trackingNumber: number;
  address: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  deliveryDate: number | string;
  createdAt: string;
}

export interface UpdateDeliveryRequest {
  id: number;
  orderId: number;
  trackingNumber: number;
  address: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  deliveryDate: number | string;
  createdAt: string;
}
