import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Invoice } from '../entities/invoice.entity';
import { IvaCondition } from '../enums/iva-condition.enum';
import { InvoiceConcept } from '../enums/invoice-concept.enum';
import { InvoiceStatus } from '../enums/invoice-status.enum';

@Injectable()
export class InvoicePdfService {
  generateInvoicePdf(invoice: Invoice): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.renderInvoice(doc, invoice);
      doc.end();
    });
  }

  private renderInvoice(doc: PDFKit.PDFDocument, invoice: Invoice): void {
    const rightX = 545;
    let y = 50;

    // Header
    doc.fontSize(18).text(`FACTURA ${invoice.invoiceType}`, 50, y);

    doc
      .fontSize(10)
      .text(`Nro: ${invoice.invoiceNumber}`, 350, y)
      .text(
        `Punto de Venta: ${String(invoice.pointOfSale).padStart(4, '0')}`,
        350,
        y + 15,
      )
      .text(
        `Fecha: ${this.formatDate(invoice.issuedAt || invoice.createdAt)}`,
        350,
        y + 30,
      );

    y += 55;

    // CAE
    if (invoice.cae) {
      doc
        .fontSize(9)
        .text(`CAE: ${invoice.cae}`, 350, y)
        .text(`Venc. CAE: ${this.formatDate(invoice.caeExpiry)}`, 350, y + 12);
      y += 25;
    }

    doc.moveTo(50, y).lineTo(rightX, y).stroke();
    y += 10;

    // Business info (left)
    doc.fontSize(11).text('Emisor:', 50, y);
    y += 15;

    const cuitEmisor =
      invoice.metadata && typeof invoice.metadata['cuitEmisor'] === 'string'
        ? invoice.metadata['cuitEmisor']
        : '';
    if (cuitEmisor) {
      doc.fontSize(10).text(`CUIT: ${cuitEmisor}`, 50, y);
      y += 12;
    }

    y += 10;
    doc.moveTo(50, y).lineTo(rightX, y).stroke();
    y += 10;

    // Client info (right)
    doc.fontSize(11).text('Cliente:', 50, y);
    y += 15;
    doc.fontSize(10).text(`Nombre: ${invoice.clientName}`, 50, y);

    if (invoice.clientCuit) {
      y += 12;
      doc.text(`CUIT/DNI: ${invoice.clientCuit}`, 50, y);
    }

    y += 12;
    doc.text(`Dirección: ${invoice.clientAddress}`, 50, y);
    y += 12;
    doc.text(
      `Condición IVA: ${this.getIvaConditionLabel(invoice.clientIvaCondition)}`,
      50,
      y,
    );

    y += 20;
    doc.moveTo(50, y).lineTo(rightX, y).stroke();
    y += 10;

    // Concept
    doc
      .fontSize(10)
      .text(`Concepto: ${this.getConceptLabel(invoice.concept)}`, 50, y);
    y += 20;

    // Work order reference
    if (invoice.workOrder) {
      doc.text(`Orden de Trabajo: ${invoice.workOrder.trackingCode}`, 50, y);
      y += 12;
    }

    y += 10;
    doc.moveTo(50, y).lineTo(rightX, y).stroke();
    y += 10;

    // Totals
    doc.fontSize(10);

    doc.text('Subtotal:', 350, y, { width: 120, align: 'right' });
    doc.text(this.formatCurrency(invoice.subtotal), 475, y, {
      width: 70,
      align: 'right',
    });
    y += 18;

    if (invoice.ivaAmount > 0) {
      doc.text('IVA:', 350, y, { width: 120, align: 'right' });
      doc.text(this.formatCurrency(invoice.ivaAmount), 475, y, {
        width: 70,
        align: 'right',
      });
      y += 18;
    }

    doc.moveTo(350, y).lineTo(rightX, y).stroke();
    y += 5;

    doc.fontSize(12).text('TOTAL:', 350, y, { width: 120, align: 'right' });
    doc.text(this.formatCurrency(invoice.total), 475, y, {
      width: 70,
      align: 'right',
    });

    y += 40;

    // Footer
    doc
      .fontSize(8)
      .text('Comprobante válido como factura electrónica.', 50, y, {
        align: 'center',
        width: rightX - 50,
      });

    if (invoice.status === InvoiceStatus.CANCELLED) {
      y += 20;
      doc
        .fontSize(14)
        .fillColor('red')
        .text('ANULADA', 50, y, {
          align: 'center',
          width: rightX - 50,
        });
    }
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  private formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private getIvaConditionLabel(condition: IvaCondition): string {
    const labels: Record<string, string> = {
      responsable_inscripto: 'Responsable Inscripto',
      consumidor_final: 'Consumidor Final',
      monotributo: 'Monotributo',
      exento: 'Exento',
    };
    return labels[condition] || condition;
  }

  private getConceptLabel(concept: InvoiceConcept): string {
    const labels: Record<string, string> = {
      products: 'Productos',
      services: 'Servicios',
      both: 'Productos y Servicios',
    };
    return labels[concept] || concept;
  }
}
