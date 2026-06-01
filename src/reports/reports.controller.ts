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
import { ReportsService } from './reports.service';
import { PdfService } from './pdf/pdf.service';
import { PeriodFilterDto } from './dto/period-filter.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('reports')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly pdfService: PdfService,
  ) {}

  @Get('summary')
  getSummary() {
    return this.reportsService.getSummary();
  }

  @Get('income')
  getIncome(@Query() filter: PeriodFilterDto) {
    return this.reportsService.getIncome(filter);
  }

  @Get('expenses')
  getExpenses(@Query() filter: PeriodFilterDto) {
    return this.reportsService.getExpenses(filter);
  }

  @Get('profit')
  getProfit(@Query() filter: PeriodFilterDto) {
    return this.reportsService.getProfit(filter);
  }

  @Get('services')
  getServices(@Query() filter: PeriodFilterDto) {
    return this.reportsService.getServices(filter);
  }

  @Get('technicians')
  getTechnicianRanking() {
    return this.reportsService.getTechnicianRanking();
  }

  @Get('technicians/:id')
  getTechnicianDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.getTechnicianDetail(id);
  }

  @Get('clients/:id')
  getClientReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.getClientReport(id);
  }

  @Get('work-orders/:id/budget')
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
