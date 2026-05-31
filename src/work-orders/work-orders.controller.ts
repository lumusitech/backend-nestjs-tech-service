import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { WorkOrdersService } from './work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { FilterWorkOrderDto } from './dto/filter-work-order.dto';
import { CreateWorkOrderNoteDto } from './dto/create-work-order-note.dto';
import { CreateWorkOrderMaterialDto } from './dto/create-work-order-material.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('work-orders')
@UseGuards(RolesGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createWorkOrderDto: CreateWorkOrderDto) {
    return this.workOrdersService.create(createWorkOrderDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  findAll(@Query() filterDto: FilterWorkOrderDto, @Req() req: Request) {
    const user = req.user as { id: string; role: UserRole };

    if (user.role === UserRole.TECHNICIAN) {
      filterDto.technicianId = user.id;
    }

    return this.workOrdersService.findAll(filterDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrdersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkOrderDto: UpdateWorkOrderDto,
  ) {
    return this.workOrdersService.update(id, updateWorkOrderDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrdersService.remove(id);
  }

  @Delete(':id/hard')
  @Roles(UserRole.ADMIN)
  hardRemove(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrdersService.hardRemove(id);
  }

  // ─── Technicians ─────────────────────────────────────

  @Put(':id/technicians')
  @Roles(UserRole.ADMIN)
  replaceTechnicians(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('technicianIds') technicianIds: string[],
  ) {
    return this.workOrdersService.replaceTechnicians(id, technicianIds);
  }

  // ─── Notes ───────────────────────────────────────────

  @Post(':id/notes')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  createNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createNoteDto: CreateWorkOrderNoteDto,
  ) {
    return this.workOrdersService.createNote(id, createNoteDto);
  }

  @Get(':id/notes')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  findNotes(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrdersService.findNotes(id);
  }

  // ─── Materials ───────────────────────────────────────

  @Post(':id/materials')
  @Roles(UserRole.ADMIN)
  createMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createMaterialDto: CreateWorkOrderMaterialDto,
  ) {
    return this.workOrdersService.createMaterial(id, createMaterialDto);
  }

  @Get(':id/materials')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  findMaterials(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrdersService.findMaterials(id);
  }

  @Delete(':id/materials/:materialId')
  @Roles(UserRole.ADMIN)
  removeMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('materialId', ParseUUIDPipe) materialId: string,
  ) {
    return this.workOrdersService.removeMaterial(id, materialId);
  }

  // ─── Tasks ──────────────────────────────────────────

  @Post(':id/tasks')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  createTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.workOrdersService.createTask(id, createTaskDto);
  }

  @Get(':id/tasks')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  findTasks(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrdersService.findTasks(id);
  }

  @Patch(':id/tasks/:taskId')
  @Roles(UserRole.ADMIN)
  updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.workOrdersService.updateTask(id, taskId, updateTaskDto);
  }

  @Delete(':id/tasks/:taskId')
  @Roles(UserRole.ADMIN)
  removeTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.workOrdersService.removeTask(id, taskId);
  }
}
