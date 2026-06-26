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
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Business Settings')
@Controller('business-settings')
export class BusinessSettingsController {
  constructor(private readonly settingsService: BusinessSettingsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get business settings' })
  @ApiResponse({ status: 200, description: 'Business settings returned' })
  get() {
    return this.settingsService.get();
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch()
  @ApiOperation({ summary: 'Update business settings' })
  @ApiResponse({ status: 200, description: 'Business settings updated' })
  update(@Body() dto: UpdateBusinessSettingDto) {
    return this.settingsService.update(dto);
  }
}
