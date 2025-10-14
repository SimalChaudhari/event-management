/**
 * Professional CSV Upload Configuration
 * Centralized configuration for CSV upload operations
 */

export interface CsvUploadConfig {
  // File upload settings
  maxFileSize: number;
  allowedMimeTypes: string[];
  tempDirectory: string;
  
  // Email settings
  emailSendingEnabled: boolean;
  emailProvider: 'gmail' | 'sendgrid' | 'mailgun' | 'ses';
  
  // Processing settings
  batchProcessingEnabled: boolean;
  maxConcurrentBatches: number;
  
  // Validation settings
  requiredFields: string[];
  fieldMappings: { [key: string]: string };
  
  // Performance settings
  chunkSize: number;
  maxRetries: number;
  
  // Logging settings
  enableDetailedLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface EmailBatchConfig {
  batchSize: number;
  delayBetweenEmails: number;
  delayBetweenBatches: number;
  retryDelay: number;
  maxRetries: number;
  enableProgressTracking: boolean;
}

export class CsvUploadConfigService {
  private static instance: CsvUploadConfigService;
  
  private config: CsvUploadConfig = {
    // File upload settings
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['text/csv', 'application/csv'],
    tempDirectory: './uploads/temp',
    
    // Email settings
    emailSendingEnabled: true,
    emailProvider: 'gmail',
    
    // Processing settings
    batchProcessingEnabled: true,
    maxConcurrentBatches: 1,
    
    // Validation settings
    requiredFields: ['firstname', 'lastname', 'email', 'mobile'],
    fieldMappings: {
      'firstname': 'firstName',
      'first_name': 'firstName',
      'fname': 'firstName',
      'lastname': 'lastName',
      'last_name': 'lastName',
      'lname': 'lastName',
      'email': 'email',
      'email_address': 'email',
      'mobile': 'mobile',
      'phone': 'mobile',
      'phone_number': 'mobile',
      'contact': 'mobile'
    },
    
    // Performance settings
    chunkSize: 1000,
    maxRetries: 3,
    
    // Logging settings
    enableDetailedLogging: true,
    logLevel: 'info'
  };

  private emailConfigs: { [key: string]: EmailBatchConfig } = {
    gmail: {
      batchSize: 15,
      delayBetweenEmails: 1000, // 1 second
      delayBetweenBatches: 5000, // 5 seconds (changed from 30)
      retryDelay: 120000, // 2 minutes
      maxRetries: 1,
      enableProgressTracking: true
    },
    sendgrid: {
      batchSize: 50,
      delayBetweenEmails: 500, // 0.5 seconds
      delayBetweenBatches: 10000, // 10 seconds
      retryDelay: 60000, // 1 minute
      maxRetries: 2,
      enableProgressTracking: true
    },
    mailgun: {
      batchSize: 40,
      delayBetweenEmails: 750, // 0.75 seconds
      delayBetweenBatches: 15000, // 15 seconds
      retryDelay: 90000, // 1.5 minutes
      maxRetries: 2,
      enableProgressTracking: true
    },
    ses: {
      batchSize: 100,
      delayBetweenEmails: 200, // 0.2 seconds
      delayBetweenBatches: 5000, // 5 seconds
      retryDelay: 30000, // 30 seconds
      maxRetries: 3,
      enableProgressTracking: true
    }
  };

  private constructor() {}

  public static getInstance(): CsvUploadConfigService {
    if (!CsvUploadConfigService.instance) {
      CsvUploadConfigService.instance = new CsvUploadConfigService();
    }
    return CsvUploadConfigService.instance;
  }

  /**
   * Get current configuration
   */
  public getConfig(): CsvUploadConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<CsvUploadConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get email batch configuration for current provider
   */
  public getEmailBatchConfig(): EmailBatchConfig {
    const provider = this.config.emailProvider;
    return { ...this.emailConfigs[provider] };
  }

  /**
   * Get email batch configuration for specific provider
   */
  public getEmailBatchConfigForProvider(provider: string): EmailBatchConfig {
    return { ...this.emailConfigs[provider] || this.emailConfigs.gmail };
  }

  /**
   * Update email provider and get corresponding config
   */
  public setEmailProvider(provider: 'gmail' | 'sendgrid' | 'mailgun' | 'ses'): EmailBatchConfig {
    this.config.emailProvider = provider;
    return this.getEmailBatchConfig();
  }

  /**
   * Get field mapping for CSV headers
   */
  public getFieldMapping(header: string): string {
    const normalizedHeader = header.toLowerCase().trim();
    return this.config.fieldMappings[normalizedHeader] || normalizedHeader;
  }

  /**
   * Validate CSV headers against required fields
   */
  public validateHeaders(headers: string[]): { isValid: boolean; missingFields: string[]; mappedFields: { [key: string]: string } } {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    const mappedFields: { [key: string]: string } = {};
    
    // Map headers to standard field names
    normalizedHeaders.forEach(header => {
      mappedFields[header] = this.getFieldMapping(header);
    });

    // Check for required fields
    const missingFields = this.config.requiredFields.filter(required => {
      const mappedField = mappedFields[required];
      return !normalizedHeaders.some(header => mappedFields[header] === mappedField);
    });

    return {
      isValid: missingFields.length === 0,
      missingFields,
      mappedFields
    };
  }

  /**
   * Get recommended configuration based on email count
   */
  public getRecommendedConfigForEmailCount(emailCount: number): EmailBatchConfig {
    const baseConfig = this.getEmailBatchConfig();
    
    if (emailCount <= 50) {
      return {
        ...baseConfig,
        batchSize: Math.min(baseConfig.batchSize, emailCount),
        delayBetweenBatches: 5000 // 5 seconds for small batches
      };
    } else if (emailCount <= 200) {
      return {
        ...baseConfig,
        batchSize: Math.min(baseConfig.batchSize, 20),
        delayBetweenBatches: 5000 // 5 seconds for medium batches
      };
    } else {
      return {
        ...baseConfig,
        batchSize: Math.min(baseConfig.batchSize, 15),
        delayBetweenBatches: 5000 // 5 seconds for large batches
      };
    }
  }

  /**
   * Get processing time estimate
   */
  public estimateProcessingTime(emailCount: number, config?: EmailBatchConfig): number {
    const emailConfig = config || this.getEmailBatchConfig();
    const totalBatches = Math.ceil(emailCount / emailConfig.batchSize);
    
    // Calculate time per batch
    const timePerBatch = (emailConfig.batchSize * emailConfig.delayBetweenEmails) + emailConfig.delayBetweenBatches;
    
    // Total estimated time in milliseconds
    return totalBatches * timePerBatch;
  }

  /**
   * Get formatted time estimate
   */
  public getFormattedTimeEstimate(emailCount: number, config?: EmailBatchConfig): string {
    const estimateMs = this.estimateProcessingTime(emailCount, config);
    const minutes = Math.floor(estimateMs / 60000);
    const seconds = Math.floor((estimateMs % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Check if email sending is enabled
   */
  public isEmailSendingEnabled(): boolean {
    return this.config.emailSendingEnabled;
  }

  /**
   * Enable/disable email sending
   */
  public setEmailSendingEnabled(enabled: boolean): void {
    this.config.emailSendingEnabled = enabled;
  }

  /**
   * Get logging configuration
   */
  public getLoggingConfig(): { enableDetailedLogging: boolean; logLevel: string } {
    return {
      enableDetailedLogging: this.config.enableDetailedLogging,
      logLevel: this.config.logLevel
    };
  }

  /**
   * Set logging configuration
   */
  public setLoggingConfig(enableDetailedLogging: boolean, logLevel: 'debug' | 'info' | 'warn' | 'error'): void {
    this.config.enableDetailedLogging = enableDetailedLogging;
    this.config.logLevel = logLevel;
  }

  /**
   * Reset to default configuration
   */
  public resetToDefaults(): void {
    this.config = {
      maxFileSize: 10 * 1024 * 1024,
      allowedMimeTypes: ['text/csv', 'application/csv'],
      tempDirectory: './uploads/temp',
      emailSendingEnabled: true,
      emailProvider: 'gmail',
      batchProcessingEnabled: true,
      maxConcurrentBatches: 1,
      requiredFields: ['firstname', 'lastname', 'email', 'mobile'],
      fieldMappings: {
        'firstname': 'firstName',
        'first_name': 'firstName',
        'fname': 'firstName',
        'lastname': 'lastName',
        'last_name': 'lastName',
        'lname': 'lastName',
        'email': 'email',
        'email_address': 'email',
        'mobile': 'mobile',
        'phone': 'mobile',
        'phone_number': 'mobile',
        'contact': 'mobile'
      },
      chunkSize: 1000,
      maxRetries: 3,
      enableDetailedLogging: true,
      logLevel: 'info'
    };
  }
}

// Export singleton instance
export const csvUploadConfig = CsvUploadConfigService.getInstance();
