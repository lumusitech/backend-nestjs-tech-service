import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PortalService } from './portal.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Portal')
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Public()
  @Get('track/:trackingCode')
  @ApiOperation({ summary: 'Track work order by code (public)' })
  @ApiParam({
    name: 'trackingCode',
    description: 'Work order tracking code',
    example: 'TS-A1B2C3',
  })
  @ApiResponse({ status: 200, description: 'Work order tracking details' })
  @ApiResponse({ status: 404, description: 'Tracking code not found' })
  track(@Param('trackingCode') trackingCode: string) {
    return this.portalService.trackByCode(trackingCode);
  }
}
