import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { BudgetReportDto, ReceiptReportDto } from '../dto/budget-report.dto';

@Injectable()
export class PdfService {
  generateBudgetPdf(data: BudgetReportDto): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.renderBudget(doc, data);
      doc.end();
    });
  }

  generateReceiptPdf(data: ReceiptReportDto): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.renderReceipt(doc, data);
      doc.end();
    });
  }

  private renderBudget(doc: PDFKit.PDFDocument, data: BudgetReportDto): void {
    const rightX = 545;

    doc.fontSize(20).text('PRESUPUESTO', 50, 50);
    doc
      .fontSize(10)
      .text(`Nro: ${data.budgetNumber}`, 50, 75)
      .text(`Fecha: ${this.formatDate(data.date)}`, 50, 90)
      .text(`Válido hasta: ${this.formatDate(data.validUntil)}`, 50, 105);

    doc.moveTo(50, 130).lineTo(rightX, 130).stroke();

    doc.fontSize(11).text('De:', 50, 140);
    doc
      .fontSize(10)
      .text(data.businessInfo.name, 50, 155)
      .text(data.businessInfo.address, 50, 170)
      .text(data.businessInfo.phone, 50, 185)
      .text(data.businessInfo.email, 50, 200);

    doc.fontSize(11).text('Para:', 300, 140);
    doc
      .fontSize(10)
      .text(data.client.name, 300, 155)
      .text(data.client.address, 300, 170)
      .text(data.client.phone, 300, 185)
      .text(data.client.email, 300, 200);

    doc.moveTo(50, 220).lineTo(rightX, 220).stroke();

    doc
      .fontSize(11)
      .text(`Orden: ${data.workOrder.trackingCode}`, 50, 230)
      .text(`Servicio: ${data.workOrder.serviceTypeName}`, 50, 245);

    if (data.workOrder.diagnosis) {
      doc.text(`Diagnóstico: ${data.workOrder.diagnosis}`, 50, 260);
    }

    let y = 290;
    doc.moveTo(50, y).lineTo(rightX, y).stroke();
    y += 10;

    doc.fontSize(11).text('DETALLE', 50, y);
    y += 20;

    doc.moveTo(50, y).lineTo(rightX, y).stroke();
    y += 5;

    doc.fontSize(9);
    doc.text('Descripción', 50, y);
    doc.text('Cant.', 350, y, { width: 50, align: 'right' });
    doc.text('P. Unit', 405, y, { width: 60, align: 'right' });
    doc.text('Subtotal', 475, y, { width: 70, align: 'right' });
    y += 15;

    doc.moveTo(50, y).lineTo(rightX, y).stroke();
    y += 5;

    for (const item of data.items) {
      doc.text(item.description, 50, y, { width: 290 });
      doc.text(String(item.quantity), 350, y, {
        width: 50,
        align: 'right',
      });
      doc.text(this.formatCurrency(item.unitPrice), 405, y, {
        width: 60,
        align: 'right',
      });
      doc.text(this.formatCurrency(item.subtotal), 475, y, {
        width: 70,
        align: 'right',
      });
      y += 18;
    }

    if (data.items.length === 0) {
      doc.text('Sin materiales detallados', 50, y);
      y += 18;
    }

    doc.moveTo(50, y).lineTo(rightX, y).stroke();
    y += 10;

    if (data.laborCost > 0) {
      doc.text('Mano de obra', 350, y, { width: 120, align: 'right' });
      doc.text(this.formatCurrency(data.laborCost), 475, y, {
        width: 70,
        align: 'right',
      });
      y += 18;
    }

    doc.fontSize(11).text('TOTAL', 350, y, { width: 120, align: 'right' });
    doc.text(this.formatCurrency(data.total), 475, y, {
      width: 70,
      align: 'right',
    });

    y += 40;

    if (data.notes) {
      doc.fontSize(10).text(`Notas: ${data.notes}`, 50, y);
      y += 15;
    }

    doc.fontSize(9).text('Validez: 30 días desde la fecha de emisión.', 50, y);
  }

  private renderReceipt(doc: PDFKit.PDFDocument, data: ReceiptReportDto): void {
    const rightX = 545;

    doc.fontSize(20).text('COMPROBANTE DE PAGO', 50, 50);
    doc
      .fontSize(10)
      .text(`Nro: ${data.receiptNumber}`, 50, 75)
      .text(`Fecha: ${this.formatDate(data.date)}`, 50, 90);

    doc.moveTo(50, 115).lineTo(rightX, 115).stroke();

    doc.fontSize(11).text(data.businessInfo.name, 50, 125);
    doc
      .fontSize(9)
      .text(data.businessInfo.address, 50, 140)
      .text(data.businessInfo.phone, 50, 155);

    doc.moveTo(50, 175).lineTo(rightX, 175).stroke();

    doc
      .fontSize(10)
      .text(`Cliente: ${data.client.name}`, 50, 185)
      .text(`Orden: ${data.workOrder.trackingCode}`, 50, 200)
      .text(`Servicio: ${data.workOrder.serviceTypeName}`, 50, 215);

    doc.moveTo(50, 240).lineTo(rightX, 240).stroke();

    doc.fontSize(12).text('DETALLE DEL PAGO', 50, 255);

    doc.moveTo(50, 275).lineTo(rightX, 275).stroke();

    const startY = 290;
    doc.fontSize(10);

    doc.text('Monto pagado:', 50, startY);
    doc
      .fontSize(14)
      .text(this.formatCurrency(data.payment.amount), 200, startY - 2);

    doc
      .fontSize(10)
      .text('Método:', 50, startY + 30)
      .text(this.getMethodLabel(data.payment.method), 200, startY + 30);

    doc
      .text('Estado:', 50, startY + 50)
      .text(this.getStatusLabel(data.payment.status), 200, startY + 50);

    doc
      .text('Fecha de pago:', 50, startY + 70)
      .text(this.formatDate(data.payment.paidAt), 200, startY + 70);

    if (data.payment.providerPaymentId) {
      doc
        .text('Referencia:', 50, startY + 90)
        .text(data.payment.providerPaymentId, 200, startY + 90);
    }

    if (data.payment.totalInstallments > 1) {
      doc
        .text('Cuota:', 50, startY + 110)
        .text(
          `${data.payment.installmentNumber} de ${data.payment.totalInstallments}`,
          200,
          startY + 110,
        );
    }

    doc
      .moveTo(50, startY + 140)
      .lineTo(rightX, startY + 140)
      .stroke();

    doc.fontSize(11).text('¡Gracias por su confianza!', 50, startY + 160, {
      align: 'center',
      width: rightX - 50,
    });
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  private formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private getMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      credit_card: 'Tarjeta de crédito',
      debit_card: 'Tarjeta de débito',
      cash: 'Efectivo',
      transfer: 'Transferencia',
    };
    return labels[method] || method;
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      refunded: 'Reembolsado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  }
}
