import { PaymentStatus } from '../enums/payment-status.enum';

export interface ProviderResult {
  providerPaymentId: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookResult {
  providerPaymentId: string;
  status: PaymentStatus;
  metadata?: Record<string, unknown>;
}

export interface PaymentProvider {
  createPayment(
    amount: number,
    description: string,
    metadata?: Record<string, unknown>,
  ): Promise<ProviderResult>;

  getPaymentStatus(providerPaymentId: string): Promise<PaymentStatus>;

  handleWebhook(body: unknown): Promise<WebhookResult | null>;
}
