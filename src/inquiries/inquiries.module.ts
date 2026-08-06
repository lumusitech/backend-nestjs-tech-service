import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InquiriesService } from './inquiries.service';
import { InquiriesController } from './inquiries.controller';
import { Inquiry } from './entities/inquiry.entity';
import { User } from '../users/entities/user.entity';
import { WorkOrdersModule } from '../work-orders/work-orders.module';
import { PendingItemsModule } from '../pending-items/pending-items.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inquiry, User]),
    WorkOrdersModule,
    PendingItemsModule,
  ],
  controllers: [InquiriesController],
  providers: [InquiriesService],
  exports: [InquiriesService],
})
export class InquiriesModule {}
