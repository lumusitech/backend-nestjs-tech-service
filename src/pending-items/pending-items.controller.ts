import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PendingItemsService } from './pending-items.service';
import { CreatePendingItemDto } from './dto/create-pending-item.dto';
import { UpdatePendingItemDto } from './dto/update-pending-item.dto';
import { FilterPendingItemDto } from './dto/filter-pending-item.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Pending Items')
@ApiBearerAuth()
@Controller('pending-items')
@UseGuards(RolesGuard)
export class PendingItemsController {
  constructor(private readonly pendingItemsService: PendingItemsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Create a new pending item' })
  @ApiResponse({
    status: 201,
    description: 'Pending item created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  create(@Body() createDto: CreatePendingItemDto, @Req() req: Request) {
    const user = req.user as { id: string; role: UserRole };
    return this.pendingItemsService.create(createDto, user.id, user.role);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Get all pending items with filters and pagination',
  })
  @ApiResponse({ status: 200, description: 'List of pending items returned' })
  findAll(@Query() filterDto: FilterPendingItemDto, @Req() req: Request) {
    const user = req.user as { id: string; role: UserRole };
    return this.pendingItemsService.findAll(filterDto, user.id, user.role);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get a pending item by ID' })
  @ApiParam({ name: 'id', description: 'Pending item UUID' })
  @ApiResponse({ status: 200, description: 'Pending item found' })
  @ApiResponse({ status: 404, description: 'Pending item not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pendingItemsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a pending item' })
  @ApiParam({ name: 'id', description: 'Pending item UUID' })
  @ApiResponse({
    status: 200,
    description: 'Pending item updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Pending item not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePendingItemDto,
  ) {
    return this.pendingItemsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete a pending item' })
  @ApiParam({ name: 'id', description: 'Pending item UUID' })
  @ApiResponse({ status: 200, description: 'Pending item soft deleted' })
  @ApiResponse({ status: 404, description: 'Pending item not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pendingItemsService.remove(id);
  }
}
