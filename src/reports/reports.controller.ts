import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { PdfService } from './pdf/pdf.service';
import { PeriodFilterDto } from './dto/period-filter.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly pdfService: PdfService,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary report' })
  @ApiResponse({
    status: 200,
    description: 'Summary with KPIs, trends, top clients, technicians, etc.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  getSummary() {
    return this.reportsService.getSummary();
  }

  @Get('income')
  @ApiOperation({ summary: 'Get income report by period' })
  @ApiResponse({
    status: 200,
    description: 'Income breakdown by payment method and day',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  getIncome(@Query() filter: PeriodFilterDto) {
    return this.reportsService.getIncome(filter);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Get expense report by period' })
  @ApiResponse({ status: 200, description: 'Expense breakdown by category' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  getExpenses(@Query() filter: PeriodFilterDto) {
    return this.reportsService.getExpenses(filter);
  }

  @Get('profit')
  @ApiOperation({ summary: 'Get profit report by period' })
  @ApiResponse({
    status: 200,
    description: 'Profit breakdown with income, expenses, and margins',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  getProfit(@Query() filter: PeriodFilterDto) {
    return this.reportsService.getProfit(filter);
  }

  @Get('services')
  @ApiOperation({ summary: 'Get services ranking report' })
  @ApiResponse({
    status: 200,
    description: 'Services ranked by frequency and revenue',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  getServices(@Query() filter: PeriodFilterDto) {
    return this.reportsService.getServices(filter);
  }

  @Get('technicians')
  @ApiOperation({ summary: 'Get technician ranking' })
  @ApiResponse({
    status: 200,
    description: 'Technicians ranked by performance metrics',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  getTechnicianRanking() {
    return this.reportsService.getTechnicianRanking();
  }

  @Get('technicians/:id')
  @ApiOperation({ summary: 'Get technician detail report' })
  @ApiParam({
    name: 'id',
    description: 'Technician UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Technician performance details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  @ApiResponse({ status: 404, description: 'Technician not found' })
  getTechnicianDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.getTechnicianDetail(id);
  }

  @Get('clients/:id')
  @ApiOperation({ summary: 'Get client report' })
  @ApiParam({
    name: 'id',
    description: 'Client UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Client history, KPIs, work orders, and payments',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  getClientReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.getClientReport(id);
  }

  @Get('work-orders/:id/budget')
  @ApiOperation({ summary: 'Download budget PDF for a work order' })
  @ApiParam({
    name: 'id',
    description: 'Work order UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF file',
    content: { 'application/pdf': {} },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async getBudget(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.getBudgetData(id);
    const pdf = await this.pdfService.generateBudgetPdf(data);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=presupuesto-${data.workOrder.trackingCode}.pdf`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  @Get('payments/:id/receipt')
  @ApiOperation({ summary: 'Download receipt PDF for a payment' })
  @ApiParam({
    name: 'id',
    description: 'Payment UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'PDF file',
    content: { 'application/pdf': {} },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.getReceiptData(id);
    const pdf = await this.pdfService.generateReceiptPdf(data);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=comprobante-${data.receiptNumber}.pdf`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}
