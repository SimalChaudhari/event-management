// src/utils/exhibitor.utils.ts
import { Exhibitor } from '../exhibitor/exhibitor.entity';

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
      isActive: exhibitor.isActive || false,
      flyers: exhibitor.flyers || [],
      flyerNames: exhibitor.flyerNames || [],
      documents: exhibitor.documents || [],
      documentNames: exhibitor.documentNames || [],
      eventImages: exhibitor.eventImages || [],
      eventImageNames: exhibitor.eventImageNames || [],
      createdAt: exhibitor.createdAt || '',
      updatedAt: exhibitor.updatedAt || '',
    };
  }

}
