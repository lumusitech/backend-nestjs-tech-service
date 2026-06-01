import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { BillingService } from './billing.service';
import { InvoicePdfService } from './pdf/invoice-pdf.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('billing')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

  @Post('invoices')
  create(@Body() dto: CreateInvoiceDto) {
    return this.billingService.create(dto);
  }

  @Get('invoices')
  findAll(@Query() filter: FilterInvoiceDto) {
    return this.billingService.findAll(filter);
  }

  @Get('invoices/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.billingService.findOne(id);
  }

  @Post('invoices/:id/issue')
  issue(@Param('id', ParseUUIDPipe) id: string) {
    return this.billingService.issue(id);
  }

  @Post('invoices/:id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.billingService.cancel(id);
  }

  @Get('invoices/:id/pdf')
  async getPdf(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const invoice = await this.billingService.findOne(id);
    const pdf = await this.invoicePdfService.generateInvoicePdf(invoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=factura-${invoice.invoiceNumber}.pdf`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}
