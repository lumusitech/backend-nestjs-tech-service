import { Injectable } from '@nestjs/common';
import {
  PaymentProvider,
  ProviderResult,
  WebhookResult,
} from './payment-provider.interface';
import { PaymentStatus } from '../enums/payment-status.enum';

@Injectable()
export class CashProvider implements PaymentProvider {
  createPayment(amount: number, description: string): Promise<ProviderResult> {
    return Promise.resolve({
      providerPaymentId: `cash-${Date.now()}`,
      status: PaymentStatus.APPROVED,
      metadata: {
        amount,
        description,
        paid_at: new Date().toISOString(),
      },
    });
  }

  getPaymentStatus(): Promise<PaymentStatus> {
    return Promise.resolve(PaymentStatus.APPROVED);
  }

  handleWebhook(): Promise<WebhookResult | null> {
    return Promise.resolve(null);
  }
}
