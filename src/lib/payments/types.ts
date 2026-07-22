export type ChargeInput = {
  amount: number;
  currency: string;
  orderNumber: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
};

export type ChargeResult =
  | { status: "succeeded"; providerReference: string }
  | { status: "pending"; providerReference: string; redirectUrl: string }
  | { status: "failed"; reason: string };

export interface PaymentGateway {
  name: string;
  charge(input: ChargeInput): Promise<ChargeResult>;
}
