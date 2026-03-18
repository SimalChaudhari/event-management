/**
 * DTOs and interfaces for Salesforce APIs (OAuth, EventInfo, EventRegistrations, etc.)
 */

/** OAuth token response from Salesforce */
export interface SalesforceTokenResponse {
  access_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

/** Venue from EventInfo */
export interface SalesforceVenue {
  id: string;
  name: string;
}

/** Trainer from EventInfo */
export interface SalesforceTrainer {
  id: string;
  name: string;
  venueCode: string | null;
}

/** Pricing option from EventInfo */
export interface SalesforcePricingOption {
  id: string;
  name: string;
  courseInstance: string;
  baseValue: number;
  defaultValue: number;
}

/** Single event/course instance from GET EventInfo */
export interface SalesforceEventInfoItem {
  courseInstanceId: string;
  courseCode: string;
  courseName: string;
  courseDisplayName: string | null;
  description: string | null;
  outline: string | null;
  imageUrl: string | null;
  venue: SalesforceVenue;
  trainers: SalesforceTrainer[];
  pricingOptions: SalesforcePricingOption[];
  /** When true, event is private (not shown in public listing). */
  privateEvent?: boolean;
}

/** Course master from EventRegistrations */
export interface SalesforceCourseMaster {
  id: string;
  name: string;
  courseName: string;
}

/** Course instance from EventRegistrations */
export interface SalesforceCourseInstance {
  id: string;
  name: string;
  eventStartDate: string;
  eventEndDate: string;
}

/** Single registration from GET EventRegistrations?accountId=xxx */
export interface SalesforceEventRegistration {
  id: string;
  regNo: string;
  name: string;
  email: string;
  contactNo: string | null;
  company: string | null;
  registrationStatus: string;
  courseMaster: SalesforceCourseMaster;
  courseInstance: SalesforceCourseInstance;
}

/** Picklist value from Salesforce UI API */
export interface SalesforcePicklistValue {
  value: string;
  label: string;
  validFor: number[];
  attributes: unknown;
}

/** Picklist response */
export interface SalesforcePicklistResponse {
  values: SalesforcePicklistValue[];
  defaultValue: string | null;
  controllerValues: Record<string, unknown>;
  url: string;
  eTag: string;
}

/** Body for POST CourseRegistrationCreation */
export interface SalesforceCreateRegistrationDto {
  email: string;
  name: string;
  courseMasterId: string;
  courseInstanceId: string;
  contactNo?: string;
  designation?: string;
  residentialDeclaration: string;
}

/** Body for POST attendanceForEvent */
export interface SalesforceAttendanceDto {
  registrationNumber: string;
}

/** Response for GET sync settings */
export interface SalesforceSyncSettingsDto {
  enabled: boolean;
  cronSchedule: string;
  updatedAt?: string;
}

/** Body for PUT sync settings */
export interface UpdateSalesforceSyncSettingsDto {
  enabled?: boolean;
  cronSchedule?: string;
}
