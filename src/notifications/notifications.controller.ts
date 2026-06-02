import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { FilterNotificationDto } from './dto/filter-notification.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

interface UserPayload {
  id: string;
  role: string;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiResponse({ status: 200, description: 'Paginated list of notifications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser() user: UserPayload,
    @Query() filterDto: FilterNotificationDto,
  ) {
    return this.notificationsService.findAll(user.id, filterDto);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Number of unread notifications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUnreadCount(@CurrentUser() user: UserPayload) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({
    name: 'id',
    description: 'Notification UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  markAllAsRead(@CurrentUser() user: UserPayload) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}
