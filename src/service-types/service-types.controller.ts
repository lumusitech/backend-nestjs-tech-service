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
} from '@nestjs/common';
import { ServiceTypesService } from './service-types.service';
import { CreateServiceTypeDto } from './dto/create-service-type.dto';
import { UpdateServiceTypeDto } from './dto/update-service-type.dto';
import { FilterServiceTypeDto } from './dto/filter-service-type.dto';
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

@ApiTags('Service Types')
@ApiBearerAuth()
@Controller('service-types')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class ServiceTypesController {
  constructor(private readonly serviceTypesService: ServiceTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service type' })
  @ApiResponse({
    status: 201,
    description: 'Service type created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Service type name already exists' })
  create(@Body() createServiceTypeDto: CreateServiceTypeDto) {
    return this.serviceTypesService.create(createServiceTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all service types with pagination' })
  @ApiResponse({ status: 200, description: 'List of service types returned' })
  findAll(@Query() filterDto: FilterServiceTypeDto) {
    return this.serviceTypesService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service type by ID' })
  @ApiParam({ name: 'id', description: 'Service type UUID' })
  @ApiResponse({ status: 200, description: 'Service type found' })
  @ApiResponse({ status: 404, description: 'Service type not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service type' })
  @ApiParam({ name: 'id', description: 'Service type UUID' })
  @ApiResponse({
    status: 200,
    description: 'Service type updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Service type not found' })
  @ApiResponse({ status: 409, description: 'Service type name already exists' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceTypeDto: UpdateServiceTypeDto,
  ) {
    return this.serviceTypesService.update(id, updateServiceTypeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a service type' })
  @ApiParam({ name: 'id', description: 'Service type UUID' })
  @ApiResponse({ status: 200, description: 'Service type soft deleted' })
  @ApiResponse({ status: 404, description: 'Service type not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceTypesService.remove(id);
  }

  @Delete(':id/hard')
  @ApiOperation({ summary: 'Permanently delete a service type' })
  @ApiParam({ name: 'id', description: 'Service type UUID' })
  @ApiResponse({ status: 200, description: 'Service type permanently deleted' })
  @ApiResponse({ status: 404, description: 'Service type not found' })
  hardRemove(@Param('id', ParseUUIDPipe) id: string) {
    return this.serviceTypesService.hardRemove(id);
  }
}
