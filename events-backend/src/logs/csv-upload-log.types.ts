export type CsvUploadStatus = 'processing' | 'completed' | 'failed' | 'partial';

export type EmailAttemptStatus = 'sent' | 'failed';

export type EmailRecipientStatus = 'pending' | 'sent' | 'failed' | 'retried';

export interface EmailAttemptLog {
  attempt: number;
  status: EmailAttemptStatus;
  timestamp: string;
  errorMessage?: string;
}

export interface EmailRecipientLog {
  email: string;
  firstName?: string;
  lastName?: string;
  salutation?: string;
  status: EmailRecipientStatus;
  success: boolean;
  attempts: EmailAttemptLog[];
  retried?: boolean;
  lastUpdatedAt?: string;
  notes?: string;
}

export interface EmailLogDetails {
  totals: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    retried: number;
  };
  processingTimeMs?: number;
  provider?: string;
  emailSendingEnabled?: boolean;
  batchConfig?: {
    batchSize?: number;
    delayBetweenEmails?: number;
    delayBetweenBatches?: number;
    retryDelay?: number;
    maxRetries?: number;
  };
  completedAt?: string;
  recipients: EmailRecipientLog[];
}

export interface CsvUploadLogView {
  id: string;
  sessionId: string;
  adminId: string;
  fileName: string;
  totalRecords: number;
  recordsProcessed: number;
  recordsFailed: number;
  recordsSkipped: number;
  newUsersCreated: number;
  existingUsersUpdated: number;
  passwordsGenerated: number;
  emailsTotal: number;
  emailsSent: number;
  emailsFailed: number;
  emailsPending: number;
  status: CsvUploadStatus;
  processingTimeMs: number;
  emailSendingEnabled: boolean;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  fileDetails: {
    originalName: string;
    totalRecords: number;
  };
  emailSummary: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    retried: number;
    sendingEnabled: boolean;
  };
  emailDetails?: EmailLogDetails | null;
  errorDetails?: any;
  skippedRecords?: any[];
  failedRecords?: any[];
}

