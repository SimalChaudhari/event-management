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

    // Header Section - Company info on left, Receipt title on right
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Your Company Inc.', margin, 50)
      .fontSize(10)
      .font('Helvetica')
      .text('1234 Company St, Company Town, ST 12345', margin, 70);

    // Receipt Title on right
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#28a745')
      .text('TAX INVOICE / RECEIPT', margin + contentWidth - 200, 50, {
        width: 200,
        align: 'right',
      })
      .fillColor('black');

    // Receipt Number and Date
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
    
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Receipt #: ${receiptNumber}`, margin + contentWidth - 200, 80, {
        width: 200,
        align: 'right',
      })
      .text(`Receipt date: ${receiptDate}`, margin + contentWidth - 200, 95, {
        width: 200,
        align: 'right',
      });

    // Billed To Section
    doc.y = 130;
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#28a745')
      .text('Billed To:', margin)
      .fillColor('black')
      .font('Helvetica-Bold')
      .text(
        `${receiptData.user.firstName} ${receiptData.user.lastName}`,
        margin,
        doc.y + 5,
      );

    // Itemized List Section
    doc.y = doc.y + 30;
    
    // Table Header
    const tableTop = doc.y;
    const itemHeight = 25;
    
    // Column positions
    const qtyX = margin + 10;
    const descX = margin + 80;
    const unitPriceX = margin + 380;
    const amountX = margin + contentWidth - 10;
    
    // Header background
    doc
      .rect(margin, tableTop, contentWidth, itemHeight)
      .fill('#28a745');
    
    // Header text - 4 columns properly aligned
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('white')
      .text('QTY', qtyX, tableTop + 8)
      .text('Description', descX, tableTop + 8)
      .text('Unit Price', unitPriceX, tableTop + 8, { align: 'right', width: 100 })
      .text('Amount', amountX, tableTop + 8, { align: 'right' })
      .fillColor('black');

    // Event Item
    const itemY = tableTop + itemHeight;
    const eventDescription = receiptData.event.name;
    const unitPrice = receiptData.discount
      ? receiptData.totalAmount + receiptData.discount
      : receiptData.totalAmount;
    const quantity = 1;
    const amount = receiptData.totalAmount;

    // Item row - properly aligned with header
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(quantity.toFixed(2), qtyX, itemY + 8)
      .text(eventDescription, descX, itemY + 8, { width: 290 })
      .text(`$${unitPrice.toFixed(2)}`, unitPriceX, itemY + 8, { align: 'right', width: 100 })
      .text(`$${amount.toFixed(2)}`, amountX, itemY + 8, { align: 'right' });

    // Divider line
    const dividerY = itemY + itemHeight + 10;
    doc
      .moveTo(margin, dividerY)
      .lineTo(margin + contentWidth, dividerY)
      .stroke();

    // Summary Section
    doc.y = dividerY + 15;
    const summaryStartX = margin + 300;
    const summaryWidth = contentWidth - 300;
    let summaryY = doc.y;

    // Subtotal
    if (receiptData.discount) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Subtotal:', summaryStartX, summaryY)
        .text(`$${unitPrice.toFixed(2)}`, summaryStartX + summaryWidth - 10, summaryY, { align: 'right' });
      summaryY += itemHeight;

      // Discount
      doc
        .text('Discount:', summaryStartX, summaryY)
        .text(`-$${receiptData.discount.toFixed(2)}`, summaryStartX + summaryWidth - 10, summaryY, { align: 'right' });
      summaryY += itemHeight;
    }

    // Total Amount with background
    const totalY = summaryY;
    doc
      .rect(summaryStartX - 5, totalY - 2, summaryWidth + 10, itemHeight)
      .fill('#e8f5e9');
    
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Total (USD):', summaryStartX, totalY + 3)
      .text(`$${receiptData.totalAmount.toFixed(2)}`, summaryStartX + summaryWidth - 10, totalY + 3, { align: 'right' });

    // Transaction ID if available
    if (receiptData.transactionId) {
      doc.y = totalY + itemHeight + 20;
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#666666')
        .text(`Transaction ID: ${receiptData.transactionId}`, margin);
    }

    // Payment Method
    if (receiptData.paymentMethod || receiptData.paymentGateway) {
      doc.y = doc.y + 10;
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#666666')
        .text(
          `Payment Method: ${receiptData.paymentMethod || receiptData.paymentGateway || 'N/A'}`,
          margin,
        );
    }

    // Notes Section
    const pageHeight = doc.page.height;
    const notesY = pageHeight - 100;
    
    doc.y = notesY;
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#28a745')
      .text('Notes', margin)
      .fillColor('black')
      .text('Thank you for your business!', margin, doc.y + 5);

    // Finalize PDF
    doc.end();
  }
}

