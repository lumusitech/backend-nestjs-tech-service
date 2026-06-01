import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalService } from './portal.service';
import { PortalController } from './portal.controller';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder, Payment])],
  controllers: [PortalController],
  providers: [PortalService],
})
export class PortalModule {}
