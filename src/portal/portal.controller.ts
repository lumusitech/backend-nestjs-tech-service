import { Controller, Get, Param } from '@nestjs/common';
import { PortalService } from './portal.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Public()
  @Get('track/:trackingCode')
  track(@Param('trackingCode') trackingCode: string) {
    return this.portalService.trackByCode(trackingCode);
  }
}
