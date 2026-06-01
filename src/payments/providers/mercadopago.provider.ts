import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment as MPPayment } from 'mercadopago';
import {
  PaymentProvider,
  ProviderResult,
  WebhookResult,
} from './payment-provider.interface';
import { PaymentStatus } from '../enums/payment-status.enum';

@Injectable()
export class MercadoPagoProvider implements PaymentProvider {
  private readonly logger = new Logger(MercadoPagoProvider.name);
  private readonly client: MercadoPagoConfig;
  private readonly paymentApi: MPPayment;

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>(
      'MERCADOPAGO_ACCESS_TOKEN',
    );

    this.client = new MercadoPagoConfig({
      accessToken: accessToken || '',
    });

    this.paymentApi = new MPPayment(this.client);
  }

  async createPayment(
    amount: number,
    description: string,
  ): Promise<ProviderResult> {
    try {
      const result = await this.paymentApi.create({
        body: {
          transaction_amount: amount,
          description,
          payment_method_id: 'visa',
          payer: {
            email: 'test@testuser.com',
          },
        },
      });

      return {
        providerPaymentId: result.id?.toString() || '',
        status: this.mapStatus(result.status),
        checkoutUrl: result.point_of_interaction?.transaction_data?.ticket_url,
        metadata: {
          mp_status: result.status,
          mp_status_detail: result.status_detail,
        },
      };
    } catch (error) {
      this.logger.error('Error creating MercadoPago payment', error);
      throw error;
    }
  }

  async getPaymentStatus(providerPaymentId: string): Promise<PaymentStatus> {
    try {
      const result = await this.paymentApi.get({
        id: providerPaymentId,
      });

      return this.mapStatus(result.status);
    } catch (error) {
      this.logger.error(
        `Error getting MercadoPago payment ${providerPaymentId}`,
        error,
      );
      throw error;
    }
  }

  async handleWebhook(body: unknown): Promise<WebhookResult | null> {
    const webhookBody = body as {
      type?: string;
      data?: { id?: string };
    };

    if (webhookBody.type !== 'payment') {
      return null;
    }

    const paymentId = webhookBody.data?.id;
    if (!paymentId) {
      return null;
    }

    try {
      const result = await this.paymentApi.get({
        id: paymentId,
      });

      return {
        providerPaymentId: paymentId,
        status: this.mapStatus(result.status),
        metadata: {
          mp_status: result.status,
          mp_status_detail: result.status_detail,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error processing MercadoPago webhook for payment ${paymentId}`,
        error,
      );
      throw error;
    }
  }

  private mapStatus(mpStatus: string | undefined): PaymentStatus {
    switch (mpStatus) {
      case 'approved':
        return PaymentStatus.APPROVED;
      case 'rejected':
        return PaymentStatus.REJECTED;
      case 'refunded':
        return PaymentStatus.REFUNDED;
      case 'cancelled':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
