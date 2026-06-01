import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FilterPaymentDto } from './dto/filter-payment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { Public } from '../auth/decorators/public.decorator';

@Controller('work-orders/:workOrderId/payments')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(
    @Param('workOrderId', ParseUUIDPipe) workOrderId: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(workOrderId, createPaymentDto);
  }

  @Get()
  findAll(
    @Param('workOrderId', ParseUUIDPipe) workOrderId: string,
    @Query() filterDto: FilterPaymentDto,
  ) {
    return this.paymentsService.findAll(workOrderId, filterDto);
  }

  @Get(':paymentId')
  findOne(
    @Param('workOrderId', ParseUUIDPipe) workOrderId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ) {
    return this.paymentsService.findOneByWorkOrder(workOrderId, paymentId);
  }

  @Patch(':paymentId')
  update(
    @Param('workOrderId', ParseUUIDPipe) workOrderId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    void workOrderId;
    return this.paymentsService.update(paymentId, updatePaymentDto);
  }
}

@Controller('payments')
export class PaymentsWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('mercadopago/webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  handleMercadoPagoWebhook(@Req() req: Request) {
    return this.paymentsService.handleMercadoPagoWebhook(req.body);
  }
}
