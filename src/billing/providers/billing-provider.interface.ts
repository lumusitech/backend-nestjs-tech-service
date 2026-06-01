export interface ArcaResult {
  cae: string;
  caeExpiry: Date;
  invoiceNumber: string;
  metadata?: Record<string, unknown>;
}

export interface BillingProvider {
  issueInvoice(data: {
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
  }): Promise<ArcaResult>;
}
