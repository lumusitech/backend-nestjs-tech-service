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
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { InvoicePdfService } from './pdf/invoice-pdf.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FilterInvoiceDto } from './dto/filter-invoice.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

  @Post('invoices')
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  create(@Body() dto: CreateInvoiceDto) {
    return this.billingService.create(dto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List all invoices with optional filters' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  findAll(@Query() filter: FilterInvoiceDto) {
    return this.billingService.findAll(filter);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.billingService.findOne(id);
  }

  @Post('invoices/:id/issue')
  @HttpCode(200)
  @ApiOperation({ summary: 'Issue an invoice (generate CAE via ARCA)' })
  @ApiResponse({ status: 200, description: 'Invoice issued successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  issue(@Param('id', ParseUUIDPipe) id: string) {
    return this.billingService.issue(id);
  }

  @Post('invoices/:id/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.billingService.cancel(id);
  }

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Download invoice as PDF' })
  @ApiResponse({ status: 200, description: 'PDF generated successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
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
