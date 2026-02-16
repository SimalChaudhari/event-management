import PDFDocument from 'pdfkit';
import { Response } from 'express';

export interface ChatMessageForExport {
  msg?: string;
  senderID: string;
  senderNick?: string;
  receiverID?: string;
  msgDateUTC?: string | Date;
}

export interface ConversationForExport {
  userID: string;
  userName: string;
  messages: ChatMessageForExport[];
}

/**
 * Generate a PDF buffer for one user's event chats (one or more conversations).
 * Used for single-user PDF download and for each file in the all-users ZIP.
 */
export function generateChatPdfBuffer(
  conversations: ConversationForExport[],
  options: { userName?: string; eventName?: string; exportUserId?: string },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 100;
    let y = 50;

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#333');
    doc.text(options.eventName || 'Event Chat', 50, y);
    y += 24;
    if (options.userName) {
      doc.fontSize(11).font('Helvetica').fillColor('#666');
      doc.text(`Chat export for: ${options.userName}`, 50, y);
      y += 20;
    }
    doc.moveDown(0.5);
    y += 10;

    for (const conv of conversations) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#4680ff');
      doc.text(`Conversation with ${conv.userName || 'Unknown'}`, 50, y);
      y += 22;

      if (!conv.messages || conv.messages.length === 0) {
        doc.fontSize(10).font('Helvetica').fillColor('#999');
        doc.text('No messages in this thread.', 50, y);
        y += 18;
      } else {
        for (const m of conv.messages) {
          const dateStr = m.msgDateUTC
            ? new Date(m.msgDateUTC).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
            : '';
          const line = `${m.senderNick || 'User'}: ${(m.msg || '').slice(0, 200)}${(m.msg || '').length > 200 ? '...' : ''} ${dateStr}`;
          doc.fontSize(10).font('Helvetica').fillColor('#333');
          const height = doc.heightOfString(line, { width: pageWidth });
          if (y + height > doc.page.height - 50) {
            doc.addPage();
            y = 50;
          }
          doc.text(line, 50, y, { width: pageWidth, align: 'left' });
          y += height + 6;
        }
      }
      y += 16;
    }

    doc.end();
  });
}

/**
 * Stream a single user's chat PDF to HTTP response.
 */
export function streamChatPdfToResponse(
  conversations: ConversationForExport[],
  res: Response,
  filename: string,
  options: { userName?: string; eventName?: string; exportUserId?: string },
): void {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  const pageWidth = doc.page.width - 100;
  let y = 50;

  doc.fontSize(16).font('Helvetica-Bold').fillColor('#333');
  doc.text(options.eventName || 'Event Chat', 50, y);
  y += 24;
  if (options.userName) {
    doc.fontSize(11).font('Helvetica').fillColor('#666');
    doc.text(`Chat export for: ${options.userName}`, 50, y);
    y += 20;
  }
  y += 10;

  for (const conv of conversations) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#4680ff');
    doc.text(`Conversation with ${conv.userName || 'Unknown'}`, 50, y);
    y += 22;

    if (!conv.messages || conv.messages.length === 0) {
      doc.fontSize(10).font('Helvetica').fillColor('#999');
      doc.text('No messages in this thread.', 50, y);
      y += 18;
    } else {
      for (const m of conv.messages) {
        const dateStr = m.msgDateUTC
          ? new Date(m.msgDateUTC).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
          : '';
        const line = `${m.senderNick || 'User'}: ${(m.msg || '').slice(0, 200)}${(m.msg || '').length > 200 ? '...' : ''} ${dateStr}`;
        doc.fontSize(10).font('Helvetica').fillColor('#333');
        const height = doc.heightOfString(line, { width: pageWidth });
        if (y + height > doc.page.height - 50) {
          doc.addPage();
          y = 50;
        }
        doc.text(line, 50, y, { width: pageWidth, align: 'left' });
        y += height + 6;
      }
    }
    y += 16;
  }

  doc.end();
}
