import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { UserEntity } from '../user/users.entity';
import { Event, EventType } from '../event/event.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { BillingDetail } from '../registerEvent/billing-detail.entity';
import { Status, Type } from '../registerEvent/registerEvent.dto';
import { 
  SSOUserInfoResponse, 
  CourseRegistration, 
  SSOSyncResult 
} from './sso-sync.dto';

@Injectable()
export class SSOSyncService {
  private readonly externalApiUrl = 'https://eservices-isca--fuat.sandbox.my.site.com/services/apexrest/userInfo';

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(RegisterEvent)
    private registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(BillingDetail)
    private billingDetailRepository: Repository<BillingDetail>,
  ) {}

  /**
   * Sync SSO user data - fetch registrations from external API and sync to our database
   */
  async syncSSOUserData(userId: string): Promise<SSOSyncResult> {
    try {
      // 1. Get user from database
      const user = await this.userRepository.findOne({ 
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.socialAccessToken) {
        throw new BadRequestException('Social access token not found. Please login again via SSO.');
      }

      // 2. Call external API to get user's course registrations
      const externalData = await this.fetchExternalUserData(user.socialAccessToken);

      if (!externalData.success) {
        throw new BadRequestException(externalData.errorMessage || 'Failed to fetch external user data');
      }

      // 3. Update user mobile if available and not already set
      if (externalData.mobile && externalData.mobile !== 'NA' && !user.mobile) {
        user.mobile = externalData.mobile;
        await this.userRepository.save(user);
      }

      // 4. Process and sync events and registrations
      const syncResult = await this.processAndSyncRegistrations(
        user,
        externalData.courseRegistrations
      );

      return {
        success: true,
        message: `Successfully synced ${syncResult.eventsCreated + syncResult.eventsUpdated} events and ${syncResult.registrationsCreated} registrations`,
        eventsCreated: syncResult.eventsCreated,
        eventsUpdated: syncResult.eventsUpdated,
        registrationsCreated: syncResult.registrationsCreated,
        userInfo: {
          userId: externalData.userId,
          email: externalData.email,
          firstName: externalData.firstName,
          lastName: externalData.lastName,
          mobile: externalData.mobile,
        },
        events: syncResult.events,
        registrations: syncResult.registrations,
        errors: syncResult.errors,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(`SSO sync failed: ${error.message}`);
    }
  }

  /**
   * Fetch user data from external API
   */
  private async fetchExternalUserData(accessToken: string): Promise<SSOUserInfoResponse> {
    try {
      const response = await axios.get<SSOUserInfoResponse>(this.externalApiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new BadRequestException('Social access token expired. Please login again via SSO.');
      }
      
      if (error.response?.status) {
        throw new BadRequestException(`Failed to fetch external user data: ${error.message}`);
      }
      
      throw new InternalServerErrorException(`External API request failed: ${error.message}`);
    }
  }

  /**
   * Process course registrations and sync events and registrations to database
   */
  private async processAndSyncRegistrations(
    user: UserEntity,
    courseRegistrations: CourseRegistration[]
  ): Promise<{
    eventsCreated: number;
    eventsUpdated: number;
    registrationsCreated: number;
    events: Array<{ eventCode: string; eventName: string; status: 'created' | 'updated' | 'existing' }>;
    registrations: Array<{ registrationId: string; eventCode: string; status: 'created' | 'existing' }>;
    errors: string[];
  }> {
    let eventsCreated = 0;
    let eventsUpdated = 0;
    let registrationsCreated = 0;
    const events: Array<{ eventCode: string; eventName: string; status: 'created' | 'updated' | 'existing' }> = [];
    const registrations: Array<{ registrationId: string; eventCode: string; status: 'created' | 'existing' }> = [];
    const errors: string[] = [];

    for (const registration of courseRegistrations) {
      try {
        // 1. Create or update event
        const eventResult = await this.createOrUpdateEvent(registration);
        
        if (eventResult.status === 'created') {
          eventsCreated++;
        } else if (eventResult.status === 'updated') {
          eventsUpdated++;
        }

        events.push({
          eventCode: registration.eventCode,
          eventName: registration.eventName,
          status: eventResult.status,
        });

        // 2. Create registration if doesn't exist
        const registrationResult = await this.createRegistrationIfNotExists(
          user.id,
          eventResult.event.id,
          registration
        );

        if (registrationResult.status === 'created') {
          registrationsCreated++;
        }

        registrations.push({
          registrationId: registration.registrationId,
          eventCode: registration.eventCode,
          status: registrationResult.status,
        });
      } catch (error: any) {
        errors.push(`Registration ${registration.registrationName}: ${error.message}`);
      }
    }

    return {
      eventsCreated,
      eventsUpdated,
      registrationsCreated,
      events,
      registrations,
      errors,
    };
  }

  /**
   * Create or update event from course registration data
   */
  private async createOrUpdateEvent(
    registration: CourseRegistration
  ): Promise<{
    event: Event;
    status: 'created' | 'updated' | 'existing';
  }> {
    try {
      // Check if event already exists by eventCode (using name field as unique identifier)
      let event = await this.eventRepository.findOne({
        where: { name: `${registration.eventCode} - ${registration.eventName}` },
      });

      const eventData = this.mapCourseToEventData(registration);

      if (!event) {
        // Create new event
        event = this.eventRepository.create(eventData);
        await this.eventRepository.save(event);
        return { event, status: 'created' };
      } else {
        // Update existing event
        // Check if any data has changed
        const hasChanges = this.hasEventDataChanged(event, eventData);
        
        if (hasChanges) {
          Object.assign(event, eventData);
          await this.eventRepository.save(event);
          return { event, status: 'updated' };
        } else {
          return { event, status: 'existing' };
        }
      }
    } catch (error: any) {
      throw new InternalServerErrorException(`Failed to create/update event: ${error.message}`);
    }
  }

  /**
   * Map course registration data to Event entity structure
   */
  private mapCourseToEventData(registration: CourseRegistration): Partial<Event> {
    // Build full address from registration data
    const addressParts = [
      registration.buildingName !== 'NA' ? registration.buildingName : '',
      registration.buildingNumber,
      registration.streetName,
      registration.city,
      registration.state,
      registration.postalCode,
    ].filter(Boolean);

    const fullAddress = addressParts.join(', ');

    // Determine event type based on location data
    let eventType = EventType.Physical;
    if (!registration.streetName || registration.streetName === 'NA') {
      eventType = EventType.Virtual;
    }

    return {
      name: `${registration.eventCode} - ${registration.eventName}`,
      description: registration.eventDescription !== 'NA' ? registration.eventDescription : `Event: ${registration.eventName}`,
      startDate: new Date(registration.startDate),
      startTime: this.convertTo24HourFormat(registration.StartTime),
      endDate: new Date(registration.endDate),
      endTime: this.convertTo24HourFormat(registration.EndTime),
      location: fullAddress || registration.city,
      venue: registration.buildingName !== 'NA' ? registration.buildingName : registration.city,
      country: registration.country,
      type: eventType,
      price: 0, // Default to free, can be updated manually
      currency: 'SGD',
    };
  }

  /**
   * Convert time format from "9:00 AM" to "09:00" (24-hour format)
   */
  private convertTo24HourFormat(time: string): string {
    try {
      if (!time || time === 'NA') {
        return '00:00';
      }

      // Parse time like "9:00 AM" or "5:00 PM"
      const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      
      if (!match) {
        return '00:00';
      }

      let hours = parseInt(match[1]);
      const minutes = match[2];
      const meridiem = match[3].toUpperCase();

      // Convert to 24-hour format
      if (meridiem === 'PM' && hours !== 12) {
        hours += 12;
      } else if (meridiem === 'AM' && hours === 12) {
        hours = 0;
      }

      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    } catch (error) {
      return '00:00';
    }
  }

  /**
   * Check if event data has changed
   */
  private hasEventDataChanged(existingEvent: Event, newData: Partial<Event>): boolean {
    const fieldsToCheck: (keyof Event)[] = [
      'description', 'startDate', 'startTime', 'endDate', 'endTime',
      'location', 'venue', 'country', 'type'
    ];

    for (const field of fieldsToCheck) {
      const existingValue = existingEvent[field];
      const newValue = newData[field];

      // Skip if new value is undefined
      if (newValue === undefined) continue;

      // For dates, compare timestamps
      if (field === 'startDate' || field === 'endDate') {
        const existingDate = existingValue instanceof Date ? existingValue : new Date(existingValue as any);
        const newDate = newValue instanceof Date ? newValue : new Date(newValue as any);
        if (existingDate.getTime() !== newDate.getTime()) {
          return true;
        }
      } else if (existingValue !== newValue) {
        return true;
      }
    }

    return false;
  }

  /**
   * Create registration if it doesn't exist + Save ALL billing details
   */
  private async createRegistrationIfNotExists(
    userId: string,
    eventId: string,
    registration: CourseRegistration
  ): Promise<{
    registration: RegisterEvent;
    status: 'created' | 'existing';
  }> {
    try {
      // Check if registration already exists by external registration ID
      const existingRegistration = await this.registerEventRepository.findOne({
        where: {
          externalRegistrationId: registration.registrationId,
        },
        relations: ['billingDetails'],
      });

      if (existingRegistration) {
        // Update billing details if they've changed
        await this.updateBillingDetails(existingRegistration.id, registration);
        return { registration: existingRegistration, status: 'existing' };
      }

      const newRegistration = this.registerEventRepository.create({
        userId: userId,
        eventId: eventId,
        type: Type.Attendee,
        status: this.mapRegistrationStatus(registration.registrationStatus),
        isCreatedByAdmin: true, // SSO-synced registrations are marked as admin-created
        isRegister: true,
        externalRegistrationId: registration.registrationId,
        externalRegistrationName: registration.registrationName,
      });

      const savedRegistration = await this.registerEventRepository.save(newRegistration);
      
      // Create billing details for this registration
      await this.createBillingDetails(savedRegistration.id, registration);

      return { registration: savedRegistration, status: 'created' };
    } catch (error: any) {
      throw new InternalServerErrorException(`Failed to create registration: ${error.message}`);
    }
  }

  /**
   * Create billing details from course registration data
   */
  private async createBillingDetails(
    registerEventId: string,
    registration: CourseRegistration
  ): Promise<void> {
    try {
      // Delete existing billing details for this registration
      await this.billingDetailRepository.delete({ registerEventId });

      if (!registration.billingDetails || registration.billingDetails.length === 0) {
        return;
      }

      // Create billing detail records for each billing detail in the response
      for (const billing of registration.billingDetails) {
        const billingDetail = this.billingDetailRepository.create({
          registerEventId: registerEventId,
          registrationId: registration.registrationId,
          registrationName: registration.registrationName,
          registrationStatus: registration.registrationStatus,
          
          // Billing information
          billingHeaderName: billing.billingHeaderName,
          billingHeaderId: billing.billingHeaderId,
          billingDetailName: billing.billingDetailName,
          billingDetailId: billing.billingDetailId,
          billingAttachmentUrl: billing.billingAttachmentUrl,
          
          // Location details from registration
          unitNumber: registration.unitNumber,
          streetName: registration.streetName,
          city: registration.city,
          state: registration.state,
          postalCode: registration.postalCode,
          country: registration.country,
          buildingNumber: registration.buildingNumber,
          buildingName: registration.buildingName,
          
          // Additional flags
          hasCourseInstance: registration.hasCourseInstance,
          totalBillingDetails: registration.totalBillingDetails,
        });

        await this.billingDetailRepository.save(billingDetail);
      }
    } catch (error: any) {
      throw new InternalServerErrorException(`Failed to create billing details: ${error.message}`);
    }
  }

  /**
   * Update billing details if they've changed
   */
  private async updateBillingDetails(
    registerEventId: string,
    registration: CourseRegistration
  ): Promise<void> {
    try {
      // Simply recreate billing details
      await this.createBillingDetails(registerEventId, registration);
    } catch (error: any) {
      throw new InternalServerErrorException(`Failed to update billing details: ${error.message}`);
    }
  }

  /**
   * Map external registration status to our status enum
   */
  private mapRegistrationStatus(externalStatus: string): Status {
    switch (externalStatus?.toLowerCase()) {
      case 'confirmed':
        return Status.Sucesss;
      case 'cancelled':
      case 'withdrawn':
        return Status.Withdraw;
      default:
        return Status.Sucesss;
    }
  }

  /**
   * Manual sync endpoint - can be called anytime to re-sync data
   */
  async manualSync(userId: string): Promise<SSOSyncResult> {
    return await this.syncSSOUserData(userId);
  }
}

