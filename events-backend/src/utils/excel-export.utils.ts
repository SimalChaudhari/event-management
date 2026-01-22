import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { ResourceNotFoundException } from './exceptions/custom-exceptions';
import { ForbiddenException } from '@nestjs/common';

/**
 * Excel Export Utility
 * Handles creation of Excel workbooks for event statistics
 */
export class ExcelExportUtils {

  /**
   * Create single Excel workbook with multiple sheets
   * Contains: Lead Collection, Overview, and Views Over Time
   */
  static createSingleExcelWorkbook(
    statistics: any,
    leadsData: any[],
    stampIssuedMap: { [attendeeId: string]: boolean },
    totalAttendees: number,
  ): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Event Management System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Sheet 1: Lead Collection
    const leadSheet = workbook.addWorksheet('Lead Collection');
    
    // Lead Collection Headers
    leadSheet.addRow([
      'Name',
      'Company',
      'Position',
      'Mobile Number',
      'Email address',
      'Industry',
      'LinkedIn Account',
      'Notes',
      'Booth Staff',
      'Stamp Issued',
    ]);

    // Style header row
    const leadHeaderRow = leadSheet.getRow(1);
    leadHeaderRow.font = { bold: true, size: 12 };
    leadHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    leadHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    leadHeaderRow.font = { ...leadHeaderRow.font, color: { argb: 'FFFFFFFF' } };

    // Add lead data rows
    leadsData.forEach((lead) => {
      const attendee = lead.attendee || {};
      const scanner = lead.scanner || {};
      const fullName = `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim() || 'N/A';
      const boothStaff = scanner.firstName && scanner.lastName
        ? `${scanner.firstName} ${scanner.lastName}`
        : 'N/A';
      const stampIssued = stampIssuedMap[lead.attendeeId] ? 'Yes' : 'No';

      leadSheet.addRow([
        fullName,
        attendee.company || 'N/A',
        attendee.designation || 'N/A',
        attendee.mobile || 'N/A',
        attendee.email || 'N/A',
        attendee.industry || 'N/A',
        attendee.linkedinProfile || 'N/A',
        lead.notes || 'N/A',
        boothStaff,
        stampIssued,
      ]);
    });

    // Set column widths for Lead Collection
    leadSheet.getColumn(1).width = 25; // Name
    leadSheet.getColumn(2).width = 30; // Company
    leadSheet.getColumn(3).width = 25; // Position
    leadSheet.getColumn(4).width = 18; // Mobile Number
    leadSheet.getColumn(5).width = 30; // Email address
    leadSheet.getColumn(6).width = 30; // Industry
    leadSheet.getColumn(7).width = 35; // LinkedIn Account
    leadSheet.getColumn(8).width = 30; // Notes
    leadSheet.getColumn(9).width = 20; // Booth Staff
    leadSheet.getColumn(10).width = 15; // Stamp Issued

    // Add auto filter
    if (leadsData.length > 0) {
      leadSheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: leadsData.length + 1, column: 10 },
      };
    }

    // Sheet 2: Overview
    const overviewSheet = workbook.addWorksheet('Overview');
    
    // Overview Headers
    overviewSheet.addRow([
      'Event Title',
      'Total leads count',
      'Leads collected/ number of attendees',
      'Stamps issued',
      'Total view count',
      'Average Rating score',
    ]);

    // Style header row
    const overviewHeaderRow = overviewSheet.getRow(1);
    overviewHeaderRow.font = { bold: true, size: 12 };
    overviewHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    overviewHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    overviewHeaderRow.font = { ...overviewHeaderRow.font, color: { argb: 'FFFFFFFF' } };

    // Format leads collected percentage (already calculated in statistics)
    const leadsCollectedPercentage = `${statistics.leadsCollected.leadsCollectedPercentage}%`;

    // Add overview data row
    overviewSheet.addRow([
      statistics.event.name,
      statistics.leadsCollected.totalLeadsCount,
      leadsCollectedPercentage,
      statistics.leadsCollected.stampsIssued,
      statistics.boothProfileStatistics.totalViewCount,
      statistics.boothProfileStatistics.ratingScore || 0,
    ]);

    // Set column widths for Overview
    overviewSheet.getColumn(1).width = 40; // Event Title
    overviewSheet.getColumn(2).width = 20; // Total leads count
    overviewSheet.getColumn(3).width = 35; // Leads collected/ number of attendees
    overviewSheet.getColumn(4).width = 18; // Stamps issued
    overviewSheet.getColumn(5).width = 20; // Total view count
    overviewSheet.getColumn(6).width = 22; // Average Rating score

    // Sheet 3: Views Over Time (optional - keeping for completeness)
    const viewsSheet = workbook.addWorksheet('Views Over Time');
    
    viewsSheet.addRow(['SNo', 'Date (ISO)', 'Date (Formatted)', 'View Count (Daily)']);

    // Style header row
    const viewsHeaderRow = viewsSheet.getRow(1);
    viewsHeaderRow.font = { bold: true, size: 12 };
    viewsHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    viewsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    viewsHeaderRow.font = { ...viewsHeaderRow.font, color: { argb: 'FFFFFFFF' } };

    // Add views data
    let serialNumber = 1;
    statistics.boothProfileStatistics.viewCountOverTime.forEach((view: { date: string; count: number }) => {
      const date = new Date(view.date);
      viewsSheet.addRow([
        serialNumber++,
        view.date,
        date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        view.count,
      ]);
    });

    // Add total row
    if (statistics.boothProfileStatistics.viewCountOverTime.length > 0) {
      viewsSheet.addRow([
        '',
        '',
        'TOTAL',
        statistics.boothProfileStatistics.totalViewCount,
      ]);
      const totalRow = viewsSheet.getRow(viewsSheet.rowCount);
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    }

    // Set column widths for Views Over Time
    viewsSheet.getColumn(1).width = 10; // SNo
    viewsSheet.getColumn(2).width = 30; // Date (ISO)
    viewsSheet.getColumn(3).width = 25; // Date (Formatted)
    viewsSheet.getColumn(4).width = 20; // View Count

    // Add auto filter for views
    if (statistics.boothProfileStatistics.viewCountOverTime.length > 0) {
      viewsSheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: statistics.boothProfileStatistics.viewCountOverTime.length + 1, column: 4 },
      };
    }

    return workbook;
  }

  /**
   * Stream single Excel file with multiple sheets to response
   */
  static async streamSingleExcelToResponse(
    statistics: any,
    leadsData: any[],
    stampIssuedMap: { [attendeeId: string]: boolean },
    totalAttendees: number,
    response: Response,
    excelFileName: string,
  ): Promise<void> {
    try {
      // Create single workbook with multiple sheets
      const workbook = this.createSingleExcelWorkbook(statistics, leadsData, stampIssuedMap, totalAttendees);

      // Set response headers
      response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      response.setHeader('Content-Disposition', `attachment; filename="${excelFileName}"`);

      // Write workbook to response
      await workbook.xlsx.write(response);
      response.end();
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw error;
    }
  }

}
