// address.utils.ts
import { AddressService } from '../user/address.service';
import { AddressType } from '../user/address.entity';
import { ErrorHandlerService } from './services/error-handler.service';

export interface AddressData {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  addressType?: string;
  isDefaultAddress?: boolean;
  apartment?: string;
  landmark?: string;
  addressLabel?: string;
  deliveryInstructions?: string;
}

export class AddressUtils {
  /**
   * Create a new address for a user
   * @param addressService - AddressService instance
   * @param userId - User ID to associate address with
   * @param addressData - Address data to create
   * @param errorHandler - ErrorHandlerService instance for logging
   */
  static async createUserAddress(
    addressService: AddressService,
    userId: string,
    addressData: AddressData,
    errorHandler?: ErrorHandlerService
  ): Promise<void> {
    try {
      // Check if any address data is provided (all fields are optional now)
      const hasAnyAddressData = 
        addressData.street || 
        addressData.city || 
        addressData.state || 
        addressData.postalCode || 
        addressData.country ||
        addressData.apartment ||
        addressData.landmark ||
        addressData.addressLabel ||
        addressData.deliveryInstructions;

      if (!hasAnyAddressData) {
        return; // No address data provided, skip
      }

      // Create address with any provided fields (all fields are optional)
      await addressService.create({
        street: addressData.street || '',
        city: addressData.city || '',
        state: addressData.state || '',
        postalCode: addressData.postalCode || '',
        country: addressData.country || 'USA',
        type: (addressData.addressType as AddressType) || AddressType.HOME,
        isDefault: addressData.isDefaultAddress !== false, // Default to true if not specified
        apartment: addressData.apartment,
        landmark: addressData.landmark,
        label: addressData.addressLabel,
        instructions: addressData.deliveryInstructions,
        userId: userId
      });
    } catch (error) {
      // Log error but don't fail the main operation
      if (errorHandler) {
        errorHandler.logError(error, 'Address creation', userId);
      } else {
        console.error(`Error creating address for user ${userId}:`, error);
      }
    }
  }

  /**
   * Update or create address for a user
   * @param addressService - AddressService instance
   * @param userId - User ID to associate address with
   * @param addressData - Address data to update/create
   * @param errorHandler - ErrorHandlerService instance for logging
   */
  static async updateUserAddress(
    addressService: AddressService,
    userId: string,
    addressData: AddressData,
    errorHandler?: ErrorHandlerService
  ): Promise<void> {
    try {
      // Check if any address data is provided (all fields are optional now)
      const hasAnyAddressData = 
        addressData.street !== undefined || 
        addressData.city !== undefined || 
        addressData.state !== undefined || 
        addressData.postalCode !== undefined || 
        addressData.country !== undefined ||
        addressData.apartment !== undefined ||
        addressData.landmark !== undefined ||
        addressData.addressLabel !== undefined ||
        addressData.deliveryInstructions !== undefined ||
        addressData.addressType !== undefined;

      if (!hasAnyAddressData) {
        return; // No address data provided, skip
      }

      // Find existing addresses for this user
      const existingAddresses = await addressService.findByUserId(userId);
      const defaultAddress = existingAddresses.find(addr => addr.isDefault);

      // Prepare update data - only include fields that are provided
      const updateData: any = {};
      if (addressData.street !== undefined) updateData.street = addressData.street;
      if (addressData.city !== undefined) updateData.city = addressData.city;
      if (addressData.state !== undefined) updateData.state = addressData.state;
      if (addressData.postalCode !== undefined) updateData.postalCode = addressData.postalCode;
      if (addressData.country !== undefined) updateData.country = addressData.country;
      if (addressData.addressType !== undefined) updateData.type = addressData.addressType as AddressType;
      if (addressData.apartment !== undefined) updateData.apartment = addressData.apartment;
      if (addressData.landmark !== undefined) updateData.landmark = addressData.landmark;
      if (addressData.addressLabel !== undefined) updateData.label = addressData.addressLabel;
      if (addressData.deliveryInstructions !== undefined) updateData.instructions = addressData.deliveryInstructions;

      if (defaultAddress && addressData.isDefaultAddress !== false) {
        // Update existing default address with only provided fields
        if (Object.keys(updateData).length > 0) {
          await addressService.update(defaultAddress.id, updateData);
        }
      } else {
        // No default address exists, create new one with provided fields
        // Use empty strings for required fields if not provided
        await addressService.create({
          street: addressData.street || '',
          city: addressData.city || '',
          state: addressData.state || '',
          postalCode: addressData.postalCode || '',
          country: addressData.country || 'USA',
          type: (addressData.addressType as AddressType) || AddressType.HOME,
          isDefault: addressData.isDefaultAddress !== false, // Default to true if no existing default
          apartment: addressData.apartment,
          landmark: addressData.landmark,
          label: addressData.addressLabel,
          instructions: addressData.deliveryInstructions,
          userId: userId
        });
      }
    } catch (error) {
      // Log error but don't fail the main operation
      if (errorHandler) {
        errorHandler.logError(error, 'Address update', userId);
      } else {
        console.error(`Error updating address for user ${userId}:`, error);
      }
    }
  }

  /**
   * Extract address data from a DTO/request object
   * @param data - Object containing potential address fields
   * @returns AddressData object with extracted fields
   */
  static extractAddressData(data: any): AddressData {
    // Map 'address' to 'street' for frontend compatibility
    return {
      street: data.address || data.street,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
      addressType: data.addressType,
      isDefaultAddress: data.isDefaultAddress,
      apartment: data.apartment,
      landmark: data.landmark,
      addressLabel: data.addressLabel,
      deliveryInstructions: data.deliveryInstructions,
    };
  }

  /**
   * Remove address fields from an object (useful for separating user data from address data)
   * @param data - Object to clean
   * @returns Object without address fields
   */
  static removeAddressFields(data: any): any {
    const {
      street,
      city,
      state,
      postalCode,
      country,
      addressType,
      isDefaultAddress,
      apartment,
      landmark,
      addressLabel,
      deliveryInstructions,
      ...cleanData
    } = data;

    return cleanData;
  }

  /**
   * Check if address data has required fields for creation/update
   * @param addressData - Address data to validate
   * @returns Boolean indicating if required fields are present
   */
  static hasRequiredAddressFields(addressData: AddressData): boolean {
    return !!(addressData.street && addressData.city && addressData.state && addressData.postalCode);
  }

  /**
   * Check if any address data is provided
   * @param addressData - Address data to check
   * @returns Boolean indicating if any address fields are present
   */
  static hasAnyAddressFields(addressData: AddressData): boolean {
    return !!(
      addressData.street ||
      addressData.city ||
      addressData.state ||
      addressData.postalCode ||
      addressData.country ||
      addressData.addressType ||
      addressData.apartment ||
      addressData.landmark ||
      addressData.addressLabel ||
      addressData.deliveryInstructions
    );
  }
}
