import * as ExcelJS from 'exceljs';
import * as archiver from 'archiver';
import { Response } from 'express';
import { ResourceNotFoundException } from './exceptions/custom-exceptions';
import { ForbiddenException } from '@nestjs/common';

/**
 * Excel Export Utility
 * Handles creation of Excel workbooks and ZIP files for event statistics
 */
export class ExcelExportUtils {
  /**
   * Create Statistics Excel Workbook
   * Contains: Event Summary + Views Over Time (Booth Statistics)
   */
  static createStatisticsExcel(statistics: any): ExcelJS.Workbook {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Event Management System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Single Sheet with Event Summary and Booth Statistics only
    const dataSheet = workbook.addWorksheet('Statistics');
      
    // Section 1: Event Summary
    dataSheet.addRow(['EVENT SUMMARY', '', '', '']);
    dataSheet.addRow(['Event Name', statistics.event.name, '', '']);
    dataSheet.addRow(['Total Leads Collected', statistics.leadsCollected.totalLeadsCount, '', '']);
    dataSheet.addRow(['Leads Collected Percentage', `${statistics.leadsCollected.leadsCollectedPercentage}%`, '', '']);
    dataSheet.addRow(['Stamps Issued', statistics.leadsCollected.stampsIssued, '', '']);
    dataSheet.addRow(['Total Views', statistics.boothProfileStatistics.totalViewCount, '', '']);
    dataSheet.addRow(['Average Rating', statistics.boothProfileStatistics.ratingScore, '', '']);
    
    // Add spacing
    dataSheet.addRow({});
    dataSheet.addRow({});

    // Section 2: Views Over Time (Booth Statistics)
    dataSheet.addRow(['', '', '', '', '']);
    dataSheet.addRow(['', '', '', '', '']);
    const viewsHeaderRow = dataSheet.rowCount;
    dataSheet.addRow(['VIEWS OVER TIME (BOOTH STATISTICS)', '', '', '', '']);
    const tableHeaderRow = dataSheet.rowCount + 1;
    dataSheet.addRow(['SNo', 'Date (ISO)', 'Date (Formatted)', 'View Count (Daily)', '']);

    const viewDataRows: Array<{ sno: number; dateISO: string; date: string; count: number }> = [];
    let serialNumber = 1;

    statistics.boothProfileStatistics.viewCountOverTime.forEach((view: { date: string; count: number }) => {
      const date = new Date(view.date);
      const rowData = {
        sno: serialNumber++,
        dateISO: view.date, // Original ISO date string
        date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        count: view.count,
      };
      viewDataRows.push(rowData);
      dataSheet.addRow([
        rowData.sno,
        rowData.dateISO,
        rowData.date,
        rowData.count,
        '',
      ]);
    });

    // Add total row for views
    if (viewDataRows.length > 0) {
      const viewsTotalRow = dataSheet.rowCount + 1;
      dataSheet.addRow([
        '',
        '',
        'TOTAL',
        statistics.boothProfileStatistics.totalViewCount,
        '',
      ]);

      // Style views section header (blue background, white bold text)
      const viewsSectionHeader = dataSheet.getRow(viewsHeaderRow);
      viewsSectionHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      viewsSectionHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      // Merge cells for section header (A{viewsHeaderRow}:E{viewsHeaderRow})
      dataSheet.mergeCells(`A${viewsHeaderRow}:E${viewsHeaderRow}`);

      // Style views table header (grey background, bold text)
      const tableHeader = dataSheet.getRow(tableHeaderRow);
      tableHeader.font = { bold: true };
      tableHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Style views total row (grey background, bold text)
      const totalRow = dataSheet.getRow(viewsTotalRow);
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Add auto filter to the table (from table header row to last data row)
      const filterStartRow = tableHeaderRow;
      const filterEndRow = viewsTotalRow - 1; // Before total row
      dataSheet.autoFilter = {
        from: { row: filterStartRow, column: 1 },
        to: { row: filterEndRow, column: 4 },
      };
    }

    // Style event summary section header (row 1) - blue background, white bold text
    const eventSummaryHeader = dataSheet.getRow(1);
    eventSummaryHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    eventSummaryHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    // Merge cells for section header (A1:E1)
    dataSheet.mergeCells('A1:E1');

    // Make all data rows in Event Summary bold for labels
    for (let i = 2; i <= 7; i++) {
      const row = dataSheet.getRow(i);
      const labelCell = row.getCell(1);
      labelCell.font = { bold: true };
    }

    // Set column widths
    dataSheet.getColumn(1).width = 40; // Event Summary Labels / SNo
    dataSheet.getColumn(2).width = 30; // Event Summary Values / Date ISO
    dataSheet.getColumn(3).width = 25; // Date Formatted
    dataSheet.getColumn(4).width = 20; // View Count
    dataSheet.getColumn(5).width = 10; // Empty column

    return workbook;
  }

  /**
   * Create Lead Collection Excel Workbook
   * Contains: Event Summary + Staff ID, Staff Name, Leads Collected
   */
  static createLeadCollectionExcel(statistics: any): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Event Management System';
    workbook.created = new Date();
    workbook.modified = new Date();

    const leadSheet = workbook.addWorksheet('Lead Collection');
    
    // Section 1: Event Summary
    leadSheet.addRow(['EVENT SUMMARY', '', '', '']);
    leadSheet.addRow(['Event Name', statistics.event.name, '', '']);
    leadSheet.addRow(['Total Leads Collected', statistics.leadsCollected.totalLeadsCount, '', '']);
    leadSheet.addRow(['Leads Collected Percentage', `${statistics.leadsCollected.leadsCollectedPercentage}%`, '', '']);
    leadSheet.addRow(['Stamps Issued', statistics.leadsCollected.stampsIssued, '', '']);
    leadSheet.addRow(['Total Views', statistics.boothProfileStatistics.totalViewCount, '', '']);
    leadSheet.addRow(['Average Rating', statistics.boothProfileStatistics.ratingScore, '', '']);
    
    // Add spacing
    leadSheet.addRow({});
    leadSheet.addRow({});

    // Section 2: Lead Collection Table
    const leadCollectionHeaderRow = leadSheet.rowCount;
    leadSheet.addRow(['LEAD COLLECTION', '', '', '']);
    const tableHeaderRow = leadSheet.rowCount + 1;
    leadSheet.addRow(['SNo', 'Staff ID', 'Staff Name', 'Leads Collected']);
    
    // Add data rows
    const dataStartRow = tableHeaderRow + 1;
    let leadSerialNumber = 1;
    statistics.leadsCollected.leadsByStaff.forEach((staff: { staffId: string; staffName: string; count: number }) => {
      leadSheet.addRow([
        leadSerialNumber++,
        staff.staffId,
        staff.staffName,
        staff.count,
      ]);
    });

    // Add total row
    const totalRow = leadSheet.rowCount + 1;
    leadSheet.addRow([
      '',
      '',
      'TOTAL',
      statistics.leadsCollected.totalLeadsCount,
    ]);

    // Style Event Summary section header (row 1) - blue background, white bold text
    const eventSummaryHeader = leadSheet.getRow(1);
    eventSummaryHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    eventSummaryHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    // Merge cells for section header
    leadSheet.mergeCells('A1:D1');

    // Make all data rows in Event Summary bold for labels
    for (let i = 2; i <= 7; i++) {
      const row = leadSheet.getRow(i);
      const labelCell = row.getCell(1);
      labelCell.font = { bold: true };
    }

    // Style Lead Collection section header - blue background, white bold text
    const leadSectionHeader = leadSheet.getRow(leadCollectionHeaderRow);
    leadSectionHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    leadSectionHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    // Merge cells for section header
    leadSheet.mergeCells(`A${leadCollectionHeaderRow}:D${leadCollectionHeaderRow}`);

    // Style table header (grey background, bold text)
    const tableHeader = leadSheet.getRow(tableHeaderRow);
    tableHeader.font = { bold: true };
    tableHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Style total row (grey background, bold text)
    const total = leadSheet.getRow(totalRow);
    total.font = { bold: true };
    total.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add auto filter to the table (from table header row to last data row, before total)
    const filterEndRow = totalRow - 1;
    if (filterEndRow >= dataStartRow) {
      leadSheet.autoFilter = {
        from: { row: tableHeaderRow, column: 1 },
        to: { row: filterEndRow, column: 4 },
      };
    }

    // Set column widths
    leadSheet.getColumn(1).width = 35; // Event Summary Labels / SNo
    leadSheet.getColumn(2).width = 40; // Event Summary Values / Staff ID
    leadSheet.getColumn(3).width = 30; // Staff Name
    leadSheet.getColumn(4).width = 20; // Leads Collected

    return workbook;
  }

  /**
   * Stream ZIP file with Statistics and Lead Collection Excel files to response
   */
  static async streamExcelZipToResponse(
    statistics: any,
    response: Response,
    zipFileName: string,
  ): Promise<void> {
    try {
      // Create both Excel workbooks
      const statisticsWorkbook = this.createStatisticsExcel(statistics);
      const leadCollectionWorkbook = this.createLeadCollectionExcel(statistics);

      // Convert workbooks to buffers
      const statisticsBuffer = await statisticsWorkbook.xlsx.writeBuffer();
      const leadCollectionBuffer = await leadCollectionWorkbook.xlsx.writeBuffer();

      // Use require for archiver (same as flyer download)
      const archiverLib = require('archiver');
      const archive = archiverLib('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      // Set response attachment (same as flyer download)
      response.attachment(zipFileName);

      // Handle archive errors
      archive.on('error', (err: Error) => {
        console.error('Archive error:', err);
        if (!response.headersSent) {
          response.status(500).json({
            success: false,
            message: 'Error creating ZIP file',
          });
        }
      });

      // Pipe archive to response
      archive.pipe(response);

      // Add Excel files to ZIP
      archive.append(Buffer.from(statisticsBuffer), { name: 'Statistics.xlsx' });
      archive.append(Buffer.from(leadCollectionBuffer), { name: 'Lead_Collection.xlsx' });

      // Finalize the archive (this will trigger the download)
      await archive.finalize();
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
