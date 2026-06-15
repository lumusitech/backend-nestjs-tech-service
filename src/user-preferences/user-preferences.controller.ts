import { Controller, Get, Put, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserPreferencesService } from './user-preferences.service';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('User Preferences')
@ApiBearerAuth()
@Controller('user-preferences')
@UseGuards(RolesGuard)
export class UserPreferencesController {
  constructor(
    private readonly userPreferencesService: UserPreferencesService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get current user preferences' })
  @ApiResponse({ status: 200, description: 'User preferences returned' })
  getPreferences(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.userPreferencesService.getByUserId(user.id);
  }

  @Put()
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Update current user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  updatePreferences(@Req() req: Request, @Body() dto: UpdatePreferenceDto) {
    const user = req.user as { id: string };
    return this.userPreferencesService.update(user.id, dto);
  }
}
