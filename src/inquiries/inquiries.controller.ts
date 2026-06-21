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
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { FilterInquiryDto } from './dto/filter-inquiry.dto';
import { ContactInquiryDto } from './dto/contact-inquiry.dto';
import { InquiryDecision } from './enums/inquiry-decision.enum';
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

@ApiTags('Inquiries')
@ApiBearerAuth()
@Controller('inquiries')
@UseGuards(RolesGuard)
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new inquiry' })
  @ApiResponse({ status: 201, description: 'Inquiry created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createDto: CreateInquiryDto, @Req() req: Request) {
    const user = req.user as { id: string; role: UserRole };
    return this.inquiriesService.create(createDto, user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get all inquiries with filters and pagination' })
  @ApiResponse({ status: 200, description: 'List of inquiries returned' })
  findAll(@Query() filterDto: FilterInquiryDto, @Req() req: Request) {
    const user = req.user as { id: string; role: UserRole };
    return this.inquiriesService.findAll(filterDto, user.id, user.role);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Get an inquiry by ID' })
  @ApiParam({ name: 'id', description: 'Inquiry UUID' })
  @ApiResponse({ status: 200, description: 'Inquiry found' })
  @ApiResponse({ status: 404, description: 'Inquiry not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inquiriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an inquiry' })
  @ApiParam({ name: 'id', description: 'Inquiry UUID' })
  @ApiResponse({ status: 200, description: 'Inquiry updated successfully' })
  @ApiResponse({ status: 404, description: 'Inquiry not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateInquiryDto,
  ) {
    return this.inquiriesService.update(id, updateDto);
  }

  @Patch(':id/contact')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Contact client and record notes' })
  @ApiParam({ name: 'id', description: 'Inquiry UUID' })
  @ApiResponse({ status: 200, description: 'Inquiry marked as contacted' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  contact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() contactDto: ContactInquiryDto,
  ) {
    return this.inquiriesService.contact(id, contactDto);
  }

  @Patch(':id/review')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Review inquiry and set admin decision' })
  @ApiParam({ name: 'id', description: 'Inquiry UUID' })
  @ApiResponse({ status: 200, description: 'Inquiry reviewed' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { adminDecision: InquiryDecision; adminNotes?: string },
  ) {
    return this.inquiriesService.review(id, body);
  }

  @Post(':id/convert')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Convert approved inquiry to Work Order' })
  @ApiParam({ name: 'id', description: 'Inquiry UUID' })
  @ApiResponse({ status: 200, description: 'Inquiry converted to work order' })
  @ApiResponse({ status: 400, description: 'Invalid status or not approved' })
  convert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { clientId: string; serviceTypeId: string },
  ) {
    return this.inquiriesService.convertToWorkOrder(
      id,
      body.clientId,
      body.serviceTypeId,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete an inquiry' })
  @ApiParam({ name: 'id', description: 'Inquiry UUID' })
  @ApiResponse({ status: 200, description: 'Inquiry soft deleted' })
  @ApiResponse({ status: 404, description: 'Inquiry not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.inquiriesService.remove(id);
  }
}
