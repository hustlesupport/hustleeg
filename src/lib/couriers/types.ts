export type ShipmentInput = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  governorate: string;
  city: string;
  area: string;
  street: string;
  codAmount: number;
};

export type ShipmentResult = {
  trackingNumber: string;
  trackingUrl?: string;
};

export interface CourierProvider {
  name: string;
  createShipment(input: ShipmentInput): Promise<ShipmentResult>;
}
