import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PushNotificationsService } from './push-notifications.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface UserPayload {
  id: string;
  role: string;
}

@ApiTags('Push Notifications')
@ApiBearerAuth()
@Controller('push')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
export class PushNotificationsController {
  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  @Get('vapid-key')
  @ApiOperation({ summary: 'Get VAPID public key for push subscription' })
  @ApiResponse({ status: 200, description: 'VAPID public key' })
  getVapidKey() {
    return { publicKey: this.pushNotificationsService.getPublicKey() };
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  async subscribe(
    @CurrentUser() user: UserPayload,
    @Body() dto: SubscribeDto,
  ) {
    const subscription = await this.pushNotificationsService.subscribe(
      user.id,
      dto,
    );
    return { id: subscription.id, endpoint: subscription.endpoint };
  }

  @Delete('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  @ApiResponse({ status: 200, description: 'Unsubscribed' })
  async unsubscribe(
    @CurrentUser() user: UserPayload,
    @Body('endpoint') endpoint: string,
  ) {
    await this.pushNotificationsService.unsubscribe(endpoint, user.id);
    return { success: true };
  }
}
