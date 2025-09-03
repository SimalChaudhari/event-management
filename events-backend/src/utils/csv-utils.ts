export class CsvUtils {
  /**
   * Parse CSV string data into structured format
   * @param csvData - Array of CSV rows as strings
   * @returns Array of parsed CSV rows
   */
  static parseCsvData(csvData: string[]): any[] {
    const rows: any[] = [];

    for (const row of csvData) {
      if (!row || row.trim() === '') continue;

      const columns = row.split(',').map((col) => col.trim());
      
      if (columns.length < 1) continue;

      const csvRow = {
        registerEventId: columns[0],
        luckyDrawNumber: columns[1] || undefined,
        tableNumber: columns[2] || undefined,
        dressCode: columns[3] || undefined,
        hall: columns[4] || undefined,
      };

      rows.push(csvRow);
    }

    return rows;
  }

  /**
   * Validate CSV data structure
   * @param csvData - Array of CSV rows
   * @returns Validation result
   */
  static validateCsvData(csvData: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!csvData || csvData.length === 0) {
      errors.push('CSV data is empty');
      return { isValid: false, errors };
    }

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      if (!row || row.trim() === '') continue;

      const columns = row.split(',').map((col) => col.trim());
      
      // Check if registerEventId is provided
      if (!columns[0] || columns[0].trim() === '') {
        errors.push(`Row ${i + 1}: Register Event ID is required`);
      }

      // Check if registerEventId format is valid (UUID format)
      if (columns[0] && !this.isValidUUID(columns[0])) {
        errors.push(`Row ${i + 1}: Invalid Register Event ID format (must be UUID)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate CSV template for download
   * @returns CSV template string
   */
  static generateCsvTemplate(): string {
    return `Register Event ID,Lucky Draw Number,Table Number,Dress Code,Hall
register-event-uuid-1,LD001,T01,Business Casual,Hall A
register-event-uuid-2,LD002,T02,Business Casual,Hall B`;
  }

  /**
   * Convert data to CSV format
   * @param data - Array of objects to convert
   * @returns CSV string
   */
  static convertToCsv(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle values that contain commas by wrapping in quotes
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value || '';
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Basic email validation
   * @param email - Email string to validate
   * @returns Boolean indicating if email is valid
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Basic UUID validation
   * @param uuid - UUID string to validate
   * @returns Boolean indicating if UUID is valid
   */
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Clean CSV data by removing empty rows and trimming whitespace
   * @param csvData - Raw CSV data
   * @returns Cleaned CSV data
   */
  static cleanCsvData(csvData: string[]): string[] {
    return csvData
      .map(row => row.trim())
      .filter(row => row.length > 0);
  }
}
