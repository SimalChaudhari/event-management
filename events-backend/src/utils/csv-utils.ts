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
        email: columns[0],
        luckyDrawNumber: columns[1] || undefined,
        tableNumber: columns[2] || undefined,
        additionalInformation: columns[3] || undefined,
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
      
      // Check if email is provided
      if (!columns[0] || columns[0].trim() === '') {
        errors.push(`Row ${i + 1}: Email is required`);
      }

      // Check if email format is valid (basic validation)
      if (columns[0] && !this.isValidEmail(columns[0])) {
        errors.push(`Row ${i + 1}: Invalid email format`);
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
    return `Email,Lucky Draw Number,Table Number,Additional Information
example@email.com,LD001,T01,Dress Code: Business Casual
another@email.com,LD002,T02,Directions: Main Hall Entrance`;
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
