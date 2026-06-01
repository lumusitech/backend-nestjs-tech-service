import { Injectable } from '@nestjs/common';
import {
  PaymentProvider,
  ProviderResult,
  WebhookResult,
} from './payment-provider.interface';
import { PaymentStatus } from '../enums/payment-status.enum';

@Injectable()
export class TransferProvider implements PaymentProvider {
  createPayment(amount: number, description: string): Promise<ProviderResult> {
    return Promise.resolve({
      providerPaymentId: `transfer-${Date.now()}`,
      status: PaymentStatus.PENDING,
      metadata: {
        amount,
        description,
        created_at: new Date().toISOString(),
      },
    });
  }

  getPaymentStatus(): Promise<PaymentStatus> {
    return Promise.resolve(PaymentStatus.PENDING);
  }

  handleWebhook(): Promise<WebhookResult | null> {
    return Promise.resolve(null);
  }
}
