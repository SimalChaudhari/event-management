// src/utils/exhibitor.utils.ts
import { Exhibitor } from '../exhibitor/exhibitor.entity';
import { Repository } from 'typeorm';
import { EventStaff } from '../event/event-staff.entity';

export class ExhibitorUtils {
  /**
   * Get basic exhibitor info for events (minimal fields)
   * @param exhibitor Exhibitor entity
   * @returns Basic exhibitor info for event displays
   */
  static getBasicExhibitorInfo(exhibitor: Partial<Exhibitor>) {
    return {
      id: exhibitor.id,
      companyName: exhibitor.companyName || '',
      companyDescription: exhibitor.companyDescription || '',
      email: exhibitor.email || '',
      mobile: exhibitor.mobile || '',
      logo: exhibitor.logo || '',
      uen: exhibitor.uen || '',
      bothNumber: exhibitor.bothNumber || '',
      address: exhibitor.address || '',
      isActive: exhibitor.isActive || false,
      flyers: exhibitor.flyers || [],
      documents: exhibitor.documents || [],
      eventImages: exhibitor.eventImages || [],
      boothBanner: exhibitor.boothBanners 
        ? exhibitor.boothBanners.map(bb => ({ id: bb.id, value: bb.banner }))
        : [],
      createdAt: exhibitor.createdAt || '',
      updatedAt: exhibitor.updatedAt || '',
    };
  }

  /**
   * Format event staff entities to a consistent format
   * @param eventStaffs Array of EventStaff entities with user relation loaded
   * @returns Array of formatted event staff data
   */
  static formatEventStaff(eventStaffs: EventStaff[]): any[] {
    return eventStaffs.map((es) => ({
      id: es.user?.id,
      firstName: es.user?.firstName || '',
      lastName: es.user?.lastName || '',
      email: es.user?.email || '',
      mobile: es.user?.mobile || '',
      profilePicture: es.user?.profilePicture || null,
      role: es.user?.role || 'exhibitor',
      createdAt: es.createdAt,
    }));
  }

  /**
   * Get event staff for an exhibitor in a specific event
   * @param eventStaffRepository Repository for EventStaff entity
   * @param eventId Event ID
   * @param exhibitorId Exhibitor ID
   * @returns Array of formatted event staff data
   */
  static async getEventStaffForExhibitor(
    eventStaffRepository: Repository<EventStaff>,
    eventId: string,
    exhibitorId: string,
  ): Promise<any[]> {
    if (!eventId || !exhibitorId) {
      return [];
    }

    const exhibitorStaffs = await eventStaffRepository.find({
      where: {
        eventId: eventId,
        exhibitorId: exhibitorId,
      },
      relations: ['user'],
    });

    // Format event staff data for this exhibitor using utility
    return this.formatEventStaff(exhibitorStaffs);
  }
}
