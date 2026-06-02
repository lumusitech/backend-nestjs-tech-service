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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FinancesService } from './finances.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { FilterExpenseDto } from './dto/filter-expense.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Expenses')
@ApiBearerAuth()
@Controller('expenses')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class FinancesController {
  constructor(private readonly financesService: FinancesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiResponse({ status: 201, description: 'Expense created successfully' })
  create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.financesService.create(createExpenseDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all expenses with optional filters' })
  @ApiResponse({ status: 200, description: 'Expenses retrieved successfully' })
  findAll(@Query() filterDto: FilterExpenseDto) {
    return this.financesService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an expense by ID' })
  @ApiResponse({ status: 200, description: 'Expense retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.financesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiResponse({ status: 200, description: 'Expense updated successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.financesService.update(id, updateExpenseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an expense' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.financesService.remove(id);
  }

  @Delete(':id/hard')
  @ApiOperation({ summary: 'Permanently delete an expense' })
  @ApiResponse({ status: 200, description: 'Expense permanently deleted' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  hardRemove(@Param('id', ParseUUIDPipe) id: string) {
    return this.financesService.hardRemove(id);
  }
}
