export interface ErrorResponse {
  success: false;
  message: string;
  error: {
    type: string;
    code: number;
    timestamp: string;
    path: string;
    method: string;
  };
  details?: any;
}

export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
    timestamp?: string;
  };
} 