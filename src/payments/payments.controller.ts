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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FilterPaymentDto } from './dto/filter-payment.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('work-orders/:workOrderId/payments')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a payment for a work order' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiParam({ name: 'workOrderId', type: 'string', format: 'uuid' })
  create(
    @Param('workOrderId', ParseUUIDPipe) workOrderId: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(workOrderId, createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all payments for a work order' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiParam({ name: 'workOrderId', type: 'string', format: 'uuid' })
  findAll(
    @Param('workOrderId', ParseUUIDPipe) workOrderId: string,
    @Query() filterDto: FilterPaymentDto,
  ) {
    return this.paymentsService.findAll(workOrderId, filterDto);
  }

  @Get(':paymentId')
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'workOrderId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'paymentId', type: 'string', format: 'uuid' })
  findOne(
    @Param('workOrderId', ParseUUIDPipe) workOrderId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ) {
    return this.paymentsService.findOneByWorkOrder(workOrderId, paymentId);
  }

  @Patch(':paymentId')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiParam({ name: 'workOrderId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'paymentId', type: 'string', format: 'uuid' })
  update(
    @Param('workOrderId', ParseUUIDPipe) workOrderId: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    void workOrderId;
    return this.paymentsService.update(paymentId, updatePaymentDto);
  }
}

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class PaymentsApiController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all payments across all work orders' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  findAllGlobal(@Query() filterDto: FilterPaymentDto) {
    return this.paymentsService.findAllGlobal(filterDto);
  }
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('mercadopago/webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle MercadoPago webhook notifications' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  handleMercadoPagoWebhook(@Req() req: Request) {
    return this.paymentsService.handleMercadoPagoWebhook(req.body);
  }
}
