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
import { UpdateWorkOrderNoteDto } from './dto/update-work-order-note.dto';
import { CreateWorkOrderMaterialDto } from './dto/create-work-order-material.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Work Orders')
@ApiBearerAuth()
@Controller('work-orders')
@UseGuards(RolesGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new work order' })
  @ApiResponse({ status: 201, description: 'Work order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  create(@Body() createWorkOrderDto: CreateWorkOrderDto) {
    return this.workOrdersService.create(createWorkOrderDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all work orders with filters and pagination' })
  @ApiResponse({ status: 200, description: 'List of work orders returned' })
  findAll(@Query() filterDto: FilterWorkOrderDto, @Req() req: Request) {
    const user = req.user as { id: string; role: UserRole };

    if (user.role === UserRole.TECHNICIAN) {
      filterDto.technicianId = user.id;
    }

    return this.workOrdersService.findAll(filterDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get a work order by ID' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiResponse({ status: 200, description: 'Work order found' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrdersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiResponse({ status: 200, description: 'Work order updated successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkOrderDto: UpdateWorkOrderDto,
  ) {
    return this.workOrdersService.update(id, updateWorkOrderDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiResponse({ status: 200, description: 'Work order soft deleted' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrdersService.remove(id);
  }

  @Delete(':id/hard')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Permanently delete a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiResponse({ status: 200, description: 'Work order permanently deleted' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  hardRemove(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrdersService.hardRemove(id);
  }

  // ─── Technicians ─────────────────────────────────────

  @Put(':id/technicians')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Replace technicians assigned to a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiResponse({
    status: 200,
    description: 'Technicians replaced successfully',
  })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  replaceTechnicians(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('technicianIds') technicianIds: string[],
  ) {
    return this.workOrdersService.replaceTechnicians(id, technicianIds);
  }

  // ─── Notes ───────────────────────────────────────────

  @Post(':id/notes')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Add a note to a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  createNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createNoteDto: CreateWorkOrderNoteDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.workOrdersService.createNote(id, createNoteDto, user.id, user.role);
  }

  @Get(':id/notes')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all notes for a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiResponse({ status: 200, description: 'List of notes returned' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  findNotes(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrdersService.findNotes(id);
  }

  @Patch(':id/notes/:noteId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a note in a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiParam({ name: 'noteId', description: 'Note UUID' })
  @ApiResponse({ status: 200, description: 'Note updated successfully' })
  @ApiResponse({ status: 404, description: 'Work order or note not found' })
  updateNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() updateNoteDto: UpdateWorkOrderNoteDto,
  ) {
    return this.workOrdersService.updateNote(id, noteId, updateNoteDto);
  }

  @Delete(':id/notes/:noteId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a note from a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiParam({ name: 'noteId', description: 'Note UUID' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  @ApiResponse({ status: 404, description: 'Work order or note not found' })
  deleteNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
  ) {
    return this.workOrdersService.deleteNote(id, noteId);
  }

  // ─── Materials ───────────────────────────────────────

  @Post(':id/materials')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a material to a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiResponse({ status: 201, description: 'Material created successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  createMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createMaterialDto: CreateWorkOrderMaterialDto,
  ) {
    return this.workOrdersService.createMaterial(id, createMaterialDto);
  }

  @Get(':id/materials')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all materials for a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiResponse({ status: 200, description: 'List of materials returned' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  findMaterials(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrdersService.findMaterials(id);
  }

  @Delete(':id/materials/:materialId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a material from a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiParam({ name: 'materialId', description: 'Material UUID' })
  @ApiResponse({ status: 200, description: 'Material removed successfully' })
  @ApiResponse({ status: 404, description: 'Work order or material not found' })
  removeMaterial(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('materialId', ParseUUIDPipe) materialId: string,
  ) {
    return this.workOrdersService.removeMaterial(id, materialId);
  }

  // ─── Tasks ──────────────────────────────────────────

  @Post(':id/tasks')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Add a task to a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  createTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.workOrdersService.createTask(id, createTaskDto);
  }

  @Get(':id/tasks')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all tasks for a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiResponse({ status: 200, description: 'List of tasks returned' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  findTasks(@Param('id', ParseUUIDPipe) id: string) {
    return this.workOrdersService.findTasks(id);
  }

  @Patch(':id/tasks/:taskId')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Update a task in a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiParam({ name: 'taskId', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Work order or task not found' })
  @ApiResponse({ status: 403, description: 'Technician not assigned to this work order' })
  async updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string; role: UserRole };

    if (user.role === UserRole.TECHNICIAN) {
      await this.workOrdersService.validateTechnicianOwnership(id, user.id);
    }

    return this.workOrdersService.updateTask(id, taskId, updateTaskDto);
  }

  @Delete(':id/tasks/:taskId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a task from a work order' })
  @ApiParam({ name: 'id', description: 'Work order UUID' })
  @ApiParam({ name: 'taskId', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task removed successfully' })
  @ApiResponse({ status: 404, description: 'Work order or task not found' })
  removeTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.workOrdersService.removeTask(id, taskId);
  }
}
