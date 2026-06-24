import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BusinessSettingsService } from './business-settings.service';
import { UpdateBusinessSettingDto } from './dto/update-business-settings.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Business Settings')
@ApiBearerAuth()
@Controller('business-settings')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class BusinessSettingsController {
  constructor(private readonly settingsService: BusinessSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get business settings' })
  @ApiResponse({ status: 200, description: 'Business settings returned' })
  get() {
    return this.settingsService.get();
  }

  @Patch()
  @ApiOperation({ summary: 'Update business settings' })
  @ApiResponse({ status: 200, description: 'Business settings updated' })
  update(@Body() dto: UpdateBusinessSettingDto) {
    return this.settingsService.update(dto);
  }
}
