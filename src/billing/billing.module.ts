import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { Invoice } from './entities/invoice.entity';
import { ArcaProvider } from './providers/arca.provider';
import { InvoicePdfService } from './pdf/invoice-pdf.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice])],
  controllers: [BillingController],
  providers: [BillingService, ArcaProvider, InvoicePdfService],
  exports: [BillingService],
})
export class BillingModule {}
