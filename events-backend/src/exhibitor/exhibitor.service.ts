import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Exhibitor } from './exhibitor.entity';
import { ExhibitorLead } from './exhibitor-lead.entity';
import { ExhibitorDto, DocumentDto, EventImageDto } from './exhibitor.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { ExhibitorFileUtils } from '../utils/exhibitor-file.utils';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
} from '../utils/exceptions/custom-exceptions';
import { EventService } from '../event/event.service';
import { UserEntity } from '../user/users.entity';
import { Event } from '../event/event.entity';

@Injectable()
export class ExhibitorService {
  constructor(
    @InjectRepository(Exhibitor)
    private exhibitorRepository: Repository<Exhibitor>,
    @InjectRepository(ExhibitorLead)
    private exhibitorLeadRepository: Repository<ExhibitorLead>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private readonly errorHandler: ErrorHandlerService,
    @Inject(forwardRef(() => EventService))
    private eventService: EventService,
  ) {}

  async createExhibitor(exhibitorDto: ExhibitorDto | Partial<ExhibitorDto>): Promise<any> {
    try {
      const exhibitor = this.exhibitorRepository.create(exhibitorDto);
      const savedExhibitor = await this.exhibitorRepository.save(exhibitor);
      
      const full = await this.exhibitorRepository.findOne({
        where: { id: savedExhibitor.id },
        relations: ['promotionalOffers']
      });

      return full || savedExhibitor;
    } catch (error) {
      if (error instanceof DuplicateResourceException || error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor creation');
    }
  }

  async getAllExhibitors(eventId?: string): Promise<any[]> {
    try {
      // If eventId is provided, filter exhibitors by event
      if (eventId) {
        const { EventExhibitor } = await import('../event/event.entity');
        const { Event } = await import('../event/event.entity');
        
        const eventExhibitorRepository = this.exhibitorRepository.manager.getRepository(EventExhibitor);
        const eventRepository = this.exhibitorRepository.manager.getRepository(Event);

        // Check if event exists
        const event = await eventRepository.findOne({
          where: { id: eventId },
        });

        if (!event) {
          throw new ResourceNotFoundException('Event', eventId);
        }

        // Get exhibitors associated with this event
        const eventExhibitors = await eventExhibitorRepository.find({
          where: { eventId },
          relations: ['exhibitor', 'exhibitor.promotionalOffers'],
        });

        // Extract exhibitor data
        const exhibitors = eventExhibitors
          .map(ee => ee.exhibitor)
          .filter(Boolean);

        return exhibitors;
      }

      // If no eventId, return all exhibitors
      const exhibitors = await this.exhibitorRepository.find({
        relations: ['promotionalOffers'],
      });
      
      return exhibitors;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitors retrieval');
    }
  }

  async getExhibitorById(id: string): Promise<any> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ 
        where: { id },
        relations: ['promotionalOffers'],
      });
      
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      // Get Event Staff for this exhibitor
      const { EventStaff } = await import('../event/event-staff.entity');
      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);
      
      const eventStaffs = await eventStaffRepository.find({
        where: { exhibitorId: id },
        relations: ['user'],
      });

      // Format event staff data
      const formattedEventStaff = eventStaffs.map((es) => ({
        id: es.user?.id,
        firstName: es.user?.firstName || '',
        lastName: es.user?.lastName || '',
        email: es.user?.email || '',
        mobile: es.user?.mobile || '',
        profilePicture: es.user?.profilePicture || null,
        role: es.user?.role || 'exhibitor',
        createdAt: es.createdAt,
      }));

      return {
        ...exhibitor,
        eventStaff: formattedEventStaff,
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor retrieval by ID');
    }
  }

  async getExhibitorEntityById(id: string): Promise<Exhibitor> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ where: { id } });
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }
      return exhibitor;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor entity retrieval by ID');
    }
  }

  async updateExhibitor(
    id: string,
    exhibitorDto: Partial<ExhibitorDto>,
    userId?: string,
    userRole?: string,
    userEmail?: string,
  ): Promise<any> {
    try {
      const existingExhibitor = await this.getExhibitorEntityById(id);

      // If user is Exhibitor (not Admin), verify they can update this exhibitor
      if (userRole === 'exhibitor' && userId) {
        let userCanUpdate = false;

        // Check if exhibitor email matches user email
        if (userEmail && existingExhibitor.email === userEmail) {
          userCanUpdate = true;
        }

        // If not found by email, check via EventStaff table
        if (!userCanUpdate && userId) {
          const { EventStaff } = await import('../event/event-staff.entity');
          const eventStaffRepository =
            this.exhibitorRepository.manager.getRepository(EventStaff);

          const userStaffRecord = await eventStaffRepository.findOne({
            where: {
              exhibitorId: id,
              userId: userId,
            },
          });

          if (userStaffRecord) {
            userCanUpdate = true;
          }
        }

        // If user cannot update this exhibitor, throw forbidden error
        if (!userCanUpdate) {
          throw new ForbiddenException(
            'You do not have permission to update this exhibitor. You can only update your own exhibitor profile.',
          );
        }
      }

      // Clean up old files that are no longer needed
      await ExhibitorFileUtils.cleanupRemovedFiles(existingExhibitor, exhibitorDto, this.errorHandler);
      
      Object.assign(existingExhibitor, exhibitorDto);
      const savedExhibitor = await this.exhibitorRepository.save(existingExhibitor);
      
      const full = await this.exhibitorRepository.findOne({
        where: { id: savedExhibitor.id },
        relations: ['promotionalOffers']
      });

      return full || savedExhibitor;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof DuplicateResourceException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor update');
    }
  }

  async deleteExhibitor(id: string): Promise<{ message: string }> {
    try {
      const exhibitor = await this.getExhibitorEntityById(id);
      
      // Delete associated files
      ExhibitorFileUtils.deleteExhibitorFiles(exhibitor, this.errorHandler);

      await this.exhibitorRepository.remove(exhibitor);
      return { message: 'Exhibitor deleted successfully' };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor deletion');
    }
  }

  async updateExhibitorFlyers(
    id: string,
    flyers: Array<{ name: string; flyer: string }>,
  ): Promise<Partial<Exhibitor>> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ where: { id } });
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      exhibitor.flyers = flyers;
      return await this.exhibitorRepository.save(exhibitor);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor flyers update');
    }
  }

  async updateExhibitorDocuments(
    id: string,
    documents: Array<{ name: string; document: string }>,
  ): Promise<Partial<Exhibitor>> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ where: { id } });
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      exhibitor.documents = documents;
      return await this.exhibitorRepository.save(exhibitor);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor documents update');
    }
  }

  async updateExhibitorEventImages(
    id: string,
    eventImages: Array<{ name: string; eventImage: string }>,
  ): Promise<Partial<Exhibitor>> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({ where: { id } });
      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      exhibitor.eventImages = eventImages;
      return await this.exhibitorRepository.save(exhibitor);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor event images update');
    }
  }

  /**
   * Get all exhibitors with event-wise booth and staff information
   * Access: Admin and Exhibitor roles only
   * - If Exhibitor: Only show their own events
   * - If Admin: Show all exhibitors and all events
   */
  async getAllExhibitorsWithEventDetails(userId?: string, userRole?: string, userEmail?: string): Promise<any> {
    try {
      const { EventBooth } = await import('../event/event-booth.entity');
      const { EventStaff } = await import('../event/event-staff.entity');
      const { Event } = await import('../event/event.entity');

      const eventBoothRepository = this.exhibitorRepository.manager.getRepository(EventBooth);
      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);
      const eventRepository = this.exhibitorRepository.manager.getRepository(Event);

      let exhibitors = [];

      // If user is Exhibitor, find their exhibitor record
      if (userRole === 'exhibitor' && userId) {
        // First try to find exhibitor by user email
        let exhibitor = null;
        if (userEmail) {
          exhibitor = await this.exhibitorRepository.findOne({
            where: { email: userEmail },
            relations: ['promotionalOffers'],
          });
        }
        
        // If not found by email, try to find via EventStaff table
        if (!exhibitor && userId) {
          const userStaffRecords = await eventStaffRepository.find({
            where: { userId: userId },
            relations: ['exhibitor'],
          });
          
          // Get unique exhibitor IDs from staff records
          const exhibitorIds = [...new Set(userStaffRecords.map(es => es.exhibitorId).filter(Boolean))];
          
          if (exhibitorIds.length > 0) {
            // Get the first exhibitor (or we could get all, but for exhibitor role, usually one)
            exhibitor = await this.exhibitorRepository.findOne({
              where: { id: exhibitorIds[0] },
              relations: ['promotionalOffers'],
            });
          }
        }
        
        if (exhibitor) {
          exhibitors = [exhibitor];
        } else {
          // No exhibitor found for this user
          return {
            memberStaff: [],
          };
        }
      } 
      // If Admin, show all exhibitors
      else {
        exhibitors = await this.exhibitorRepository.find({
          relations: ['promotionalOffers'],
        });
      }

      // Combine all memberStaff from relevant exhibitors into one array
      const allMemberStaff = [];

      for (const exhibitor of exhibitors) {
        const exhibitorData = await this.formatExhibitorWithEventDetails(
          exhibitor,
          eventBoothRepository,
          eventStaffRepository,
          eventRepository,
        );
        
        if (exhibitorData?.memberStaff && exhibitorData.memberStaff.length > 0) {
          // For non-admin users, filter to only show events where they are staff members
          if (userRole !== 'admin' && userId) {
            const filteredStaffData = exhibitorData.memberStaff.filter((staffEntry: any) => {
              // Check if the logged-in user is in the staffs array for this event
              const staffs = staffEntry?.eventBooth?.staffs || [];
              return staffs.some((staff: any) => staff.id === userId);
            });
            
            if (filteredStaffData.length > 0) {
              allMemberStaff.push(...filteredStaffData);
            }
          } else {
            // Admin sees all events
            allMemberStaff.push(...exhibitorData.memberStaff);
          }
        }
      }

      return {
        memberStaff: allMemberStaff || [],
      };
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Exhibitors retrieval with event details');
    }
  }

  /**
   * Get exhibitor by ID with event-wise booth and staff information
   * Access: Admin and Exhibitor users only
   * Exhibitor users can only access their own exhibitor data
   */
  async getExhibitorByIdWithEventDetails(
    id: string,
    userId?: string,
    userRole?: string,
    userEmail?: string,
  ): Promise<any> {
    try {
      const exhibitor = await this.exhibitorRepository.findOne({
        where: { id },
        relations: ['promotionalOffers'],
      });

      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', id);
      }

      // If user is Exhibitor (not Admin), verify they can access this exhibitor
      if (userRole === 'exhibitor' && userId) {
        let userCanAccess = false;

        // Check if exhibitor email matches user email
        if (userEmail && exhibitor.email === userEmail) {
          userCanAccess = true;
        }

        // If not found by email, check via EventStaff table
        if (!userCanAccess && userId) {
          const { EventStaff } = await import('../event/event-staff.entity');
          const eventStaffRepository =
            this.exhibitorRepository.manager.getRepository(EventStaff);

          const userStaffRecord = await eventStaffRepository.findOne({
            where: {
              exhibitorId: id,
              userId: userId,
            },
          });

          if (userStaffRecord) {
            userCanAccess = true;
          }
        }

        // If user cannot access this exhibitor, throw forbidden error
        if (!userCanAccess) {
          throw new ForbiddenException(
            'You do not have permission to access this exhibitor data',
          );
        }
      }

      const { EventBooth } = await import('../event/event-booth.entity');
      const { EventStaff } = await import('../event/event-staff.entity');
      const { Event } = await import('../event/event.entity');

      const eventBoothRepository = this.exhibitorRepository.manager.getRepository(EventBooth);
      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);
      const eventRepository = this.exhibitorRepository.manager.getRepository(Event);

      return await this.formatExhibitorWithEventDetails(
        exhibitor,
        eventBoothRepository,
        eventStaffRepository,
        eventRepository,
      );
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Exhibitor retrieval by ID with event details');
    }
  }

  /**
   * Format exhibitor with event-wise booth and staff information
   */
  private async formatExhibitorWithEventDetails(
    exhibitor: Exhibitor,
    eventBoothRepository: Repository<any>,
    eventStaffRepository: Repository<any>,
    eventRepository: Repository<any>,
  ): Promise<any> {
    // Get all event booths for this exhibitor
    const eventBooths = await eventBoothRepository.find({
      where: { exhibitorId: exhibitor.id },
      relations: ['event'],
    });

    // Get all event staff for this exhibitor
    const eventStaffs = await eventStaffRepository.find({
      where: { exhibitorId: exhibitor.id },
      relations: ['user', 'event'],
    });

    // Get all unique event IDs
    const eventIds = new Set<string>();
    eventBooths.forEach(booth => eventIds.add(booth.eventId));
    eventStaffs.forEach(staff => eventIds.add(staff.eventId));

    // Fetch all events at once
    const events = await eventRepository.find({
      where: Array.from(eventIds).map(id => ({ id })),
    });

    // Create event lookup map
    const eventLookup = new Map<string, any>();
    events.forEach(event => eventLookup.set(event.id, event));

    // Build memberStaff array - one entry per event booth
    const memberStaff = [];

    // Process each event booth
    for (const booth of eventBooths) {
      const eventId = booth.eventId;
      const event = eventLookup.get(eventId) || booth.event;
      
      // Get staff members for this specific event
      const eventStaffMembers = eventStaffs
        .filter(es => es.eventId === eventId && es.user)
        .map((es) => ({
          id: es.user.id,
          firstName: es.user.firstName || '',
          lastName: es.user.lastName || '',
          email: es.user.email || '',
          mobile: es.user.mobile || '',
          profilePicture: es.user.profilePicture || null,
          role: es.user.role || 'exhibitor',
          createdAt: es.createdAt,
        }));

      // Remove duplicates from staff members
      const uniqueStaffMembers = Array.from(
        new Map(eventStaffMembers.map((staff) => [staff.id, staff])).values()
      );

      memberStaff.push({
        eventBooth: {
          event: {
            id: event?.id || eventId,
            name: event?.name || 'Unknown Event',
            startDate: event?.startDate || null,
            endDate: event?.endDate || null,
            location: event?.location || null,
            venue: event?.venue || null,
          },
          company: {
            id: exhibitor.id,
            companyName: exhibitor.companyName,
            email: exhibitor.email,
            mobile: exhibitor.mobile,
            uen: exhibitor.uen,
            logo: exhibitor.logo,
            booth: booth.uniqueCode || null,
          },
          staffs: uniqueStaffMembers,
        },
      });
    }

    // Also include events that have staff but no booth
    const eventsWithStaffOnly = new Set<string>();
    eventStaffs.forEach(staff => {
      const hasBooth = eventBooths.some(booth => booth.eventId === staff.eventId);
      if (!hasBooth) {
        eventsWithStaffOnly.add(staff.eventId);
      }
    });

    for (const eventId of eventsWithStaffOnly) {
      const event = eventLookup.get(eventId);
      
      // Get staff members for this specific event
      const eventStaffMembers = eventStaffs
        .filter(es => es.eventId === eventId && es.user)
        .map((es) => ({
          id: es.user.id,
          firstName: es.user.firstName || '',
          lastName: es.user.lastName || '',
          email: es.user.email || '',
          mobile: es.user.mobile || '',
          profilePicture: es.user.profilePicture || null,
          role: es.user.role || 'exhibitor',
          createdAt: es.createdAt,
        }));

      // Remove duplicates from staff members
      const uniqueStaffMembers = Array.from(
        new Map(eventStaffMembers.map((staff) => [staff.id, staff])).values()
      );

      memberStaff.push({
        eventBooth: {
          event: {
            id: event?.id || eventId,
            name: event?.name || 'Unknown Event',
            startDate: event?.startDate || null,
            endDate: event?.endDate || null,
            location: event?.location || null,
            venue: event?.venue || null,
          },
          company: {
            id: exhibitor.id,
            companyName: exhibitor.companyName,
            email: exhibitor.email,
            mobile: exhibitor.mobile,
            uen: exhibitor.uen,
            logo: exhibitor.logo,
            booth: null,
          },
          staffs: uniqueStaffMembers,
        },
      });
    }

    // Always return memberStaff as an array, even if empty
    return {
      memberStaff: memberStaff || [],
    };
  }

  /**
   * Get staff member user details
   * Only allows access if logged-in user and requested staff member are in the same event(s)
   */
  async getStaffMemberUserDetails(
    staffUserId: string,
    loggedInUserId: string,
    loggedInUserRole?: string,
  ): Promise<any> {
    try {
      // Import UserEntity and EventStaff
      const { UserEntity } = await import('../user/users.entity');
      const { EventStaff } = await import('../event/event-staff.entity');
      const { UserUtils } = await import('../utils/user.utils');

      const userRepository = this.exhibitorRepository.manager.getRepository(UserEntity);
      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);

      // Get the staff member user - only basic fields needed
      const staffUser = await userRepository.findOne({
        where: { id: staffUserId },
        select: ['id', 'firstName', 'lastName', 'email', 'mobile', 'profilePicture', 'role', 'createdAt'],
      });

      if (!staffUser) {
        throw new ResourceNotFoundException('User', staffUserId);
      }

      // For non-admin users, verify they are in the same event(s)
      if (loggedInUserRole !== 'admin' && loggedInUserId) {
        // Get all events where logged-in user is a staff member
        const loggedInUserEvents = await eventStaffRepository.find({
          where: { userId: loggedInUserId },
          select: ['eventId', 'exhibitorId'],
        });

        // Get all events where requested staff member is a staff member
        const staffUserEvents = await eventStaffRepository.find({
          where: { userId: staffUserId },
          select: ['eventId', 'exhibitorId'],
        });

        // Check if they share at least one common event
        const loggedInUserEventIds = new Set(
          loggedInUserEvents.map((es) => `${es.eventId}_${es.exhibitorId}`),
        );
        const hasCommonEvent = staffUserEvents.some(
          (es) => loggedInUserEventIds.has(`${es.eventId}_${es.exhibitorId}`),
        );

        if (!hasCommonEvent) {
          throw new ForbiddenException(
            'You do not have permission to view this staff member. You must be in the same event.',
          );
        }
      }

      // Return only basic user details
      return {
        id: staffUser.id,
        firstName: staffUser.firstName,
        lastName: staffUser.lastName,
        email: staffUser.email,
        mobile: staffUser.mobile || null,
        profilePicture: staffUser.profilePicture || null,
        role: staffUser.role,
        createdAt: staffUser.createdAt,
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Staff member user details retrieval');
    }
  }

  /**
   * Get all events where logged-in user is an exhibitor (staff member)
   * Returns all events regardless of company/exhibitor with full event details
   */
  async getUserExhibitorEvents(userId: string, userRole?: string): Promise<any> {
    try {
      const { EventStaff } = await import('../event/event-staff.entity');

      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);

      // Get all EventStaff records for this user
      const userStaffRecords = await eventStaffRepository.find({
        where: { userId: userId },
        relations: ['event', 'exhibitor'],
      });

      if (!userStaffRecords || userStaffRecords.length === 0) {
        return {
          events: [],
        };
      }

      // Get all unique event IDs
      const uniqueEventIds = [...new Set(userStaffRecords.map(es => es.eventId).filter(Boolean))];
      
      // Fetch full event details for each unique event using EventService
      const eventDetailsMap = new Map<string, any>();
      await Promise.all(
        uniqueEventIds.map(async (eventId) => {
          try {
            const fullEventDetails = await this.eventService.getEventById(eventId, userId, userRole);
            eventDetailsMap.set(eventId, fullEventDetails);
          } catch (error) {
            // If event not found or error, skip it
            console.warn(`Failed to fetch event details for eventId ${eventId}:`, error);
          }
        })
      );

      // Build events array with full event details only
      const eventsList = [];
      const processedEventIds = new Set<string>(); // Track processed event IDs

      for (const eventStaff of userStaffRecords) {
        const eventId = eventStaff.eventId;

        // Skip if already processed (same event)
        if (processedEventIds.has(eventId)) continue;
        processedEventIds.add(eventId);

        const fullEventDetails = eventDetailsMap.get(eventId);
        if (!fullEventDetails) continue;

        // Return only full event details without additional company/staff info
        eventsList.push(fullEventDetails);
      }

      return {
        events: eventsList,
      };
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'User exhibitor events retrieval');
    }
  }

  /**
   * Get simplified list of events for report (where user is staff member)
   * Returns only: id, name, date, location
   */
  async getReportEventsList(userId: string): Promise<any> {
    try {
      const { EventStaff } = await import('../event/event-staff.entity');
      const { Event } = await import('../event/event.entity');

      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);
      const eventRepository = this.exhibitorRepository.manager.getRepository(Event);

      // Get all EventStaff records for this user
      const userStaffRecords = await eventStaffRepository.find({
        where: { userId: userId },
      });

      if (!userStaffRecords || userStaffRecords.length === 0) {
        return {
          events: [],
        };
      }

      // Get all unique event IDs
      const uniqueEventIds = [...new Set(userStaffRecords.map(es => es.eventId).filter(Boolean))];
      
      // Fetch events with only required fields
      const events = await eventRepository.find({
        where: uniqueEventIds.map(id => ({ id })),
        select: ['id', 'name', 'startDate', 'endDate', 'location'],
      });

      // Format events to simple structure
      const eventsList = events.map(event => ({
        id: event.id,
        name: event.name,
      }));

      return {
        events: eventsList,
      };
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Report events list retrieval');
    }
  }

  /**
   * Get event statistics for report
   * Returns: event name, likes count, monthly views, downloads count, total leads
   */
  async getEventReportStatistics(eventId: string, userId: string): Promise<any> {
    try {
      const { EventStaff } = await import('../event/event-staff.entity');
      const { Event } = await import('../event/event.entity');
      const { FavoriteEvent } = await import('../favorite-event/favorite-event.entity');
      const { RegisterEvent } = await import('../registerEvent/registerEvent.entity');
      const { EventAttendance } = await import('../attendance/attendance.entity');

      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);
      const eventRepository = this.exhibitorRepository.manager.getRepository(Event);
      const favoriteEventRepository = this.exhibitorRepository.manager.getRepository(FavoriteEvent);
      const registerEventRepository = this.exhibitorRepository.manager.getRepository(RegisterEvent);
      const attendanceRepository = this.exhibitorRepository.manager.getRepository(EventAttendance);

      // Verify user is staff member for this event
      const userStaffRecord = await eventStaffRepository.findOne({
        where: {
          eventId: eventId,
          userId: userId,
        },
      });

      if (!userStaffRecord) {
        throw new ForbiddenException('You do not have permission to view statistics for this event');
      }

      // Get event details
      const event = await eventRepository.findOne({
        where: { id: eventId },
        select: ['id', 'name', 'startDate', 'endDate'],
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Get number of likes (favorites)
      const likesCount = await favoriteEventRepository.count({
        where: { eventId: eventId },
      });

      // Get total registrations (leads) for this event
      const totalLeads = await registerEventRepository.count({
        where: {
          eventId: eventId,
          isRegister: true,
        },
      });

      // Get monthly views - using attendance count as proxy (people who checked in)
      // Or we can use registration count for current month
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthlyViews = await registerEventRepository.count({
        where: {
          eventId: eventId,
          createdAt: Between(currentMonthStart, currentMonthEnd),
        },
      });

      // Get number of downloads - count event documents
      // For now, we'll count documents in the event
      const eventWithDocuments = await eventRepository.findOne({
        where: { id: eventId },
        select: ['documents'],
      });

      const downloadsCount = eventWithDocuments?.documents?.length || 0;

      // Get attendance count (people who actually attended)
      const { AttendanceStatus } = await import('../attendance/attendance.entity');
      const attendanceCount = await attendanceRepository.count({
        where: {
          eventId: eventId,
          status: AttendanceStatus.CheckedIn,
        },
      });

      return {
        event: {
          id: event.id,
          name: event.name,
        },
        statistics: {
          likes: likesCount,
          monthlyViews: monthlyViews,
          downloads: downloadsCount,
          totalLeads: totalLeads,
          attendanceCount: attendanceCount,
        },
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Event report statistics retrieval');
    }
  }

  /**
   * Scan attendee QR code and collect lead for exhibitor
   * @param qrCodeId QR code identifier (user ID) - actual user ID
   * @param eventId Event ID where the lead is being collected
   * @param exhibitorId Exhibitor ID who is collecting the lead
   * @param scannedBy User ID of the exhibitor staff member who scanned
   * @param notes Optional notes about the lead
   * @returns Lead information with attendee contact details
   */
  async scanAttendeeQRCodeForLead(
    qrCodeId: string,
    eventId: string,
    exhibitorId: string,
    scannedBy: string,
    notes?: string,
  ): Promise<any> {
    try {
      // QR code ID is the actual user ID
      const userId = qrCodeId;

      // Get attendee (user) data
      const attendee = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!attendee) {
        throw new ResourceNotFoundException('Attendee', userId);
      }

      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Check if attendee is registered for this event
      const { RegisterEvent } = await import('../registerEvent/registerEvent.entity');
      const registerEventRepository = this.exhibitorRepository.manager.getRepository(RegisterEvent);
      
      const registration = await registerEventRepository.findOne({
        where: {
          userId: userId,
          eventId: eventId,
          isRegister: true,
        },
      });

      if (!registration) {
        throw new BadRequestException('Attendee is not registered for this event');
      }

      // Verify exhibitor exists
      const exhibitor = await this.exhibitorRepository.findOne({
        where: { id: exhibitorId },
      });

      if (!exhibitor) {
        throw new ResourceNotFoundException('Exhibitor', exhibitorId);
      }

      // Check if exhibitor is associated with this event
      const { EventExhibitor } = await import('../event/event.entity');
      const { EventBooth } = await import('../event/event-booth.entity');
      const eventExhibitorRepository = this.exhibitorRepository.manager.getRepository(EventExhibitor);
      const eventBoothRepository = this.exhibitorRepository.manager.getRepository(EventBooth);

      // Check via EventExhibitor table
      const eventExhibitor = await eventExhibitorRepository.findOne({
        where: {
          eventId: eventId,
          exhibitorId: exhibitorId,
        },
      });

      // Check via EventBooth table
      const eventBooth = await eventBoothRepository.findOne({
        where: {
          eventId: eventId,
          exhibitorId: exhibitorId,
        },
      });

      if (!eventExhibitor && !eventBooth) {
        throw new ForbiddenException('Exhibitor is not associated with this event');
      }

      // Verify scanner (exhibitor staff) exists
      const scanner = await this.userRepository.findOne({
        where: { id: scannedBy },
      });

      if (!scanner) {
        throw new ResourceNotFoundException('Scanner', scannedBy);
      }

      // Verify scanner is staff member for this exhibitor at this event
      const { EventStaff } = await import('../event/event-staff.entity');
      const eventStaffRepository = this.exhibitorRepository.manager.getRepository(EventStaff);

      const staffRecord = await eventStaffRepository.findOne({
        where: {
          userId: scannedBy,
          exhibitorId: exhibitorId,
          eventId: eventId,
        },
      });

      if (!staffRecord) {
        throw new ForbiddenException('You do not have permission to collect leads for this exhibitor at this event');
      }

      // Check if lead already exists for this exhibitor-attendee-event combination
      const existingLead = await this.exhibitorLeadRepository.findOne({
        where: {
          exhibitorId: exhibitorId,
          attendeeId: userId,
          eventId: eventId,
        },
      });

      if (existingLead) {
        // Return existing lead information
        return {
          success: true,
          message: 'Lead already collected for this attendee',
          data: {
            lead: {
              id: existingLead.id,
              collectedAt: existingLead.createdAt,
            },
            attendee: {
              id: attendee.id,
              firstName: attendee.firstName,
              lastName: attendee.lastName,
              email: attendee.email,
              mobile: attendee.mobile,
              company: attendee.company,
              designation: attendee.designation,
              profilePicture: attendee.profilePicture,
            },
            event: {
              id: event.id,
              name: event.name,
            },
            exhibitor: {
              id: exhibitor.id,
              companyName: exhibitor.companyName,
            },
            isNewLead: false,
          },
        };
      }

      // Create new lead
      const lead = this.exhibitorLeadRepository.create({
        exhibitorId: exhibitorId,
        attendeeId: userId,
        eventId: eventId,
        scannedBy: scannedBy,
        firstName: attendee.firstName,
        lastName: attendee.lastName,
        email: attendee.email,
        mobile: attendee.mobile || undefined,
        company: attendee.company || undefined,
        designation: attendee.designation || undefined,
        notes: notes || undefined,
      });

      const savedLead = await this.exhibitorLeadRepository.save(lead);

      return {
        success: true,
        message: 'Lead collected successfully',
        data: {
          lead: {
            id: savedLead.id,
            collectedAt: savedLead.createdAt,
          },
          attendee: {
            id: attendee.id,
            firstName: attendee.firstName,
            lastName: attendee.lastName,
            email: attendee.email,
            mobile: attendee.mobile,
            company: attendee.company,
            designation: attendee.designation,
            profilePicture: attendee.profilePicture,
          },
          event: {
            id: event.id,
            name: event.name,
          },
          exhibitor: {
            id: exhibitor.id,
            companyName: exhibitor.companyName,
          },
          isNewLead: true,
        },
      };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Attendee QR code scanning for lead collection');
    }
  }
}