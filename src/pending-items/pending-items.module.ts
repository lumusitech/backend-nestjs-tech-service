import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PendingItemsService } from './pending-items.service';
import { PendingItemsController } from './pending-items.controller';
import { PendingItem } from './entities/pending-item.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PendingItem, User])],
  controllers: [PendingItemsController],
  providers: [PendingItemsService],
  exports: [PendingItemsService],
})
export class PendingItemsModule {}
