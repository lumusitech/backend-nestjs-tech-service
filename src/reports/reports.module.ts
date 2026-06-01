import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PdfService } from './pdf/pdf.service';
import { Payment } from '../payments/entities/payment.entity';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { WorkOrderMaterial } from '../work-orders/entities/work-order-material.entity';
import { Expense } from '../finances/entities/expense.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      WorkOrder,
      WorkOrderMaterial,
      Expense,
      Client,
      User,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, PdfService],
  exports: [ReportsService],
})
export class ReportsModule {}
