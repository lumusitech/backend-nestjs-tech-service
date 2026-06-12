import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import {
  PaymentsController,
  PaymentsApiController,
  PaymentsWebhookController,
} from './payments.controller';
import { Payment } from './entities/payment.entity';
import { MercadoPagoProvider } from './providers/mercadopago.provider';
import { CashProvider } from './providers/cash.provider';
import { TransferProvider } from './providers/transfer.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [
    PaymentsController,
    PaymentsApiController,
    PaymentsWebhookController,
  ],
  providers: [
    PaymentsService,
    MercadoPagoProvider,
    CashProvider,
    TransferProvider,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
