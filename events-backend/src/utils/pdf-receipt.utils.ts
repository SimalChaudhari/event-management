import PDFDocument from 'pdfkit';
import { Response } from 'express';

export interface ReceiptData {
  checkoutId: string;
  transactionId?: string;
  totalAmount: number;
  discount?: number;
  couponCode?: string;
  promoCode?: string;
  paymentGateway?: string;
  paymentMethod?: string;
  status: string;
  createdAt: Date;
  completedAt?: Date;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    mobile?: string;
  };
  event: {
    name: string;
    startDate: string;
    endDate: string;
    location?: string;
    venue?: string;
  };
  orderNo?: string;
}

export class PDFReceiptUtils {
  /**
   * Generate PDF receipt for checkout
   */
  static generateReceiptPDF(receiptData: ReceiptData, res: Response): void {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Tax-Invoice-Receipt-${receiptData.checkoutId}.pdf"`,
    );

    // Pipe PDF to response
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = 50;

    // ==================== HEADER SECTION ====================
    
    // Left side - Logo area (simplified, no border)
    const logoAreaWidth = 100;
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('LOGO', margin, currentY + 10);

    // Right side - Receipt Number and Date
    const receiptDate = receiptData.completedAt
      ? new Date(receiptData.completedAt).toLocaleDateString('en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : new Date(receiptData.createdAt).toLocaleDateString('en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

    const receiptNumber = receiptData.orderNo || receiptData.checkoutId;
    
    const rightAlignX = margin + contentWidth - 180;
    
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#333333')
      .text('Receipt No:', rightAlignX, currentY, {
        width: 180,
        align: 'right',
      })
      .fontSize(10)
      .font('Helvetica')
      .text(receiptNumber, rightAlignX, currentY + 12, {
        width: 180,
        align: 'right',
      })
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Receipt Date:', rightAlignX, currentY + 32, {
        width: 180,
        align: 'right',
      })
      .fontSize(10)
      .font('Helvetica')
      .text(receiptDate, rightAlignX, currentY + 44, {
        width: 180,
        align: 'right',
      });

    // Center - TAX INVOICE / RECEIPT Title
    currentY = 120;
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#28a745')
      .text('TAX INVOICE / RECEIPT', margin, currentY, {
        width: contentWidth,
        align: 'center',
      })
      .fillColor('#000000');

    // ==================== BILLED TO SECTION ====================
    currentY = 170;
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#28a745')
      .text('Billed To:', margin, currentY)
      .fillColor('#000000')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(
        `${receiptData.user.firstName} ${receiptData.user.lastName}`,
        margin,
        currentY + 18,
      );

    // ==================== TABLE SECTION ====================
    currentY = 220;
    const tableTop = currentY;
    const headerHeight = 35;
    const rowHeight = 35;
    
    // Column widths - only 3 columns: SNO, Name, Amount
    const colWidths = {
      sno: 50,
      name: 300,
      amount: 150,
    };

    // Calculate column X positions
    const snoX = margin + 10;
    const nameX = snoX + colWidths.sno;
    const amountX = nameX + colWidths.name;

    // Table Header
    doc
      .rect(margin, tableTop, contentWidth, headerHeight)
      .fill('#28a745');
    
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#FFFFFF');
    
    // Header text - 3 columns only
    doc.text('SNO', snoX, tableTop + 12, { width: colWidths.sno - 10, align: 'center' });
    doc.text('Name', nameX, tableTop + 12, { width: colWidths.name - 10 });
    doc.text('Amount', amountX, tableTop + 12, { width: colWidths.amount - 10, align: 'right' });

    // Table Data Row
    let rowY = tableTop + headerHeight;
    const eventName = receiptData.event.name || 'Event Registration';
    const originalAmount = receiptData.discount
      ? receiptData.totalAmount + receiptData.discount
      : receiptData.totalAmount;
    const discountAmount = receiptData.discount || 0;
    const couponCode = receiptData.couponCode || receiptData.promoCode || null;
    const finalTotal = receiptData.totalAmount;

    // Row background
    doc
      .rect(margin, rowY, contentWidth, rowHeight)
      .fill('#F8F9FA');

    // Row content - Main row with SNO, Name, Amount
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#000000')
      .text('1', snoX, rowY + 12, { width: colWidths.sno - 10, align: 'center' })
      .text(eventName, nameX, rowY + 12, { width: colWidths.name - 10, ellipsis: true })
      .text(`$${originalAmount.toFixed(2)}`, amountX, rowY + 12, { width: colWidths.amount - 10, align: 'right' });

    // Discount and Coupon info below the row (aligned with Name column)
    let detailY = rowY + rowHeight;
    
    // Discount row
    if (discountAmount > 0) {
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Discount:', nameX, detailY + 8)
        .fillColor('#000000')
        .text(`-$${discountAmount.toFixed(2)}`, amountX, detailY + 8, { width: colWidths.amount - 10, align: 'right' });
      detailY += 20;
    }

    // Coupon code row
    if (couponCode) {
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#666666')
        .text(`Apply Coupon No: ${couponCode}`, nameX, detailY + 8);
      detailY += 20;
    }

    // Divider line before total
    const dividerY = detailY + 10;
    doc
      .moveTo(margin, dividerY)
      .lineTo(margin + contentWidth, dividerY)
      .lineWidth(1)
      .stroke();

    // Total row
    const totalY = dividerY + 15;
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('Total:', nameX, totalY)
      .text(`$${finalTotal.toFixed(2)}`, amountX, totalY, { width: colWidths.amount - 10, align: 'right' });

    const tableBottom = totalY + 25;

    // ==================== TRANSACTION DETAILS ====================
    currentY = tableBottom + 30;
    
    if (receiptData.transactionId) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text(`Transaction ID: ${receiptData.transactionId}`, margin, currentY);
      currentY += 18;
    }

    if (receiptData.paymentMethod || receiptData.paymentGateway) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text(
          `Payment Method: ${receiptData.paymentMethod || receiptData.paymentGateway || 'N/A'}`,
          margin,
          currentY,
        );
      currentY += 25;
    }

    // ==================== NOTES SECTION ====================
    const pageHeight = doc.page.height;
    const notesY = pageHeight - 100;
    
    doc.y = notesY;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#28a745')
      .text('Notes:', margin)
      .fillColor('#000000')
      .fontSize(10)
      .font('Helvetica')
      .text('Thank you!', margin, doc.y + 18);

    // Finalize PDF
    doc.end();
  }
}

