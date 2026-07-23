import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrdersService } from './work-orders.service';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderNote } from './entities/work-order-note.entity';
import { WorkOrderMaterial } from './entities/work-order-material.entity';
import { WorkOrderStatusLog } from './entities/work-order-status-log.entity';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkOrder,
      WorkOrderNote,
      WorkOrderMaterial,
      WorkOrderStatusLog,
      Task,
      User,
    ]),
  ],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
