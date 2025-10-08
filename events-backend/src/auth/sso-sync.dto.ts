// DTOs for SSO External API Response

export interface BillingDetail {
  billingHeaderName: string;
  billingHeaderId: string;
  billingDetailName: string;
  billingDetailId: string;
  billingAttachmentUrl: string;
}

export interface CourseRegistration {
  unitNumber: string;
  totalBillingDetails: number;
  streetName: string;
  state: string;
  StartTime: string;
  startDate: string;
  registrationStatus: string;
  registrationName: string;
  registrationId: string;
  postalCode: string;
  hasCourseInstance: boolean;
  eventName: string;
  eventDescription: string;
  eventCode: string;
  EndTime: string;
  endDate: string;
  country: string;
  city: string;
  buildingNumber: string;
  buildingName: string;
  billingDetails: BillingDetail[];
}

export interface SSOUserInfoResponse {
  userId: string;
  totalRegistrations: number;
  success: boolean;
  registrationsWithCourseInstances: number;
  mobile: string;
  lastName: string;
  firstName: string;
  errorMessage: string;
  email: string;
  courseRegistrations: CourseRegistration[];
  accountId: string;
}

export interface SSOSyncResult {
  success: boolean;
  message: string;
  eventsCreated: number;
  eventsUpdated: number;
  registrationsCreated: number;
  userInfo?: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    mobile: string;
  };
  events?: Array<{
    eventCode: string;
    eventName: string;
    status: 'created' | 'updated' | 'existing';
  }>;
  registrations?: Array<{
    registrationId: string;
    eventCode: string;
    status: 'created' | 'existing';
  }>;
  errors?: string[];
}

