// src/utils/exhibitor.utils.ts
import { Exhibitor } from '../exhibitor/exhibitor.entity';
import { Repository } from 'typeorm';
import { EventStaff } from '../event/event-staff.entity';
import { ExhibitorRating } from '../exhibitor/exhibitor-rating.entity';

export class ExhibitorUtils {
  /**
   * Get basic exhibitor info for events (minimal fields)
   * @param exhibitor Exhibitor entity
   * @returns Basic exhibitor info for event displays
   */
  static getBasicExhibitorInfo(exhibitor: Partial<Exhibitor>) {
    // Build socialMedia array from individual URL fields
    // Show platform name even if URL is empty
    const socialMediaArray = [];
    
    socialMediaArray.push({
      platform: 'Facebook',
      link: exhibitor.facebookUrl || ''
    });
    
    socialMediaArray.push({
      platform: 'Instagram',
      link: exhibitor.instagramUrl || ''
    });
    
    socialMediaArray.push({
      platform: 'LinkedIn',
      link: exhibitor.linkedinUrl || ''
    });
    
    socialMediaArray.push({
      platform: 'X',
      link: exhibitor.xUrl || ''
    });
    
    // If old socialMedia array exists, merge it (for backward compatibility)
    const oldSocialMedia = exhibitor.socialMedia && Array.isArray(exhibitor.socialMedia) 
      ? exhibitor.socialMedia 
      : [];
    
    // Combine new social media with old one (avoid duplicates)
    const combinedSocialMedia = [...socialMediaArray, ...oldSocialMedia];

    return {
      id: exhibitor.id,
      companyName: exhibitor.companyName || '',
      companyDescription: exhibitor.companyDescription || '',
      email: exhibitor.email || '',
      mobile: exhibitor.mobile || '',
      logo: exhibitor.logo || '',
      uen: exhibitor.uen || '',
      boothNumber: exhibitor.boothNumber || '',
      website: exhibitor.website || '',
      socialMedia: combinedSocialMedia.length > 0 ? combinedSocialMedia : [],
      promotionalOfferNote: exhibitor.promotionalOfferNote || '',
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

  /**
   * Get rating information for an exhibitor in a specific event
   * @param exhibitorRatingRepository Repository for ExhibitorRating entity
   * @param exhibitorId Exhibitor ID
   * @param eventId Event ID
   * @returns Rating information object with averageRating and totalRatings
   */
  static async getExhibitorRating(
    exhibitorRatingRepository: Repository<ExhibitorRating>,
    exhibitorId: string,
    eventId: string,
  ): Promise<{ averageRating: number; totalRatings: number }> {
    if (!exhibitorId || !eventId) {
      return {
        averageRating: 0,
        totalRatings: 0,
      };
    }

    try {
      const ratings = await exhibitorRatingRepository.find({
        where: {
          exhibitorId: exhibitorId,
          eventId: eventId,
          isActive: true,
        },
        select: ['rating'],
      });

      let averageRating = 0;
      if (ratings.length > 0) {
        const totalRating = ratings.reduce((sum, r) => sum + parseFloat(String(r.rating)), 0);
        averageRating = parseFloat((totalRating / ratings.length).toFixed(1));
      }

      return {
        averageRating,
        totalRatings: ratings.length,
      };
    } catch (error) {
      // If there's an error, return default values
      return {
        averageRating: 0,
        totalRatings: 0,
      };
    }
  }
}
