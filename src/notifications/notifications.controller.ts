import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { FilterNotificationDto } from './dto/filter-notification.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

interface UserPayload {
  id: string;
  role: string;
}

@Controller('notifications')
@UseGuards(RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: UserPayload,
    @Query() filterDto: FilterNotificationDto,
  ) {
    return this.notificationsService.findAll(user.id, filterDto);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: UserPayload) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: UserPayload) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
