// types/settings.ts
export interface DeliverySettings {
  deliveryEnabled: boolean;
  deliveryTimeStart: string;
  deliveryTimeEnd: string;
  pickupTimeStart: string;
  pickupTimeEnd: string;
  dineInTimeStart: string;
  dineInTimeEnd: string;
  serviceFeeType: 'percent' | 'fixed';
  serviceFeeValue: number;
}
