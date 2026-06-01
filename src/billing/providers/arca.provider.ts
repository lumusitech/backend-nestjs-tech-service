import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingProvider, ArcaResult } from './billing-provider.interface';

@Injectable()
export class ArcaProvider implements BillingProvider {
  private readonly logger = new Logger(ArcaProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async issueInvoice(data: {
    invoiceNumber: string;
    invoiceType: string;
    pointOfSale: number;
    concept: string;
    clientCuit?: string;
    clientIvaCondition: string;
    subtotal: number;
    ivaAmount: number;
    total: number;
    issuedAt: Date;
  }): Promise<ArcaResult> {
    const cuit = this.configService.get<string>('ARCA_CUIT');

    this.logger.warn(
      `[STUB] ARCA invoice issued: ${data.invoiceType} ${data.invoiceNumber} — ` +
        `CUIT emisor: ${cuit} — Total: $${data.total} — ` +
        `This is a stub. Real WSFEv1 integration not implemented yet.`,
    );

    const cae = this.generateMockCae();
    const caeExpiry = new Date(data.issuedAt);
    caeExpiry.setDate(caeExpiry.getDate() + 10);

    return await Promise.resolve({
      cae,
      caeExpiry,
      invoiceNumber: data.invoiceNumber,
      metadata: {
        stub: true,
        cuitEmisor: cuit,
        puntoVenta: data.pointOfSale,
        tipoComprobante: data.invoiceType,
        concepto: data.concept,
      },
    });
  }

  private generateMockCae(): string {
    return Array.from({ length: 14 }, () =>
      Math.floor(Math.random() * 10),
    ).join('');
  }
}
