import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddressEntity, AddressType } from './address.entity';
import { CreateAddressDto, UpdateAddressDto, AddressQueryDto } from './address.dto';
import { UserEntity } from './users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import {
  ResourceNotFoundException,
  ForeignKeyConstraintException,
} from '../utils/exceptions/custom-exceptions';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(AddressEntity)
    private addressRepository: Repository<AddressEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async create(createAddressDto: CreateAddressDto): Promise<AddressEntity> {
    try {
      // Verify user exists
      const user = await this.userRepository.findOne({
        where: { id: createAddressDto.userId },
      });
      if (!user) {
        throw new ResourceNotFoundException('User', createAddressDto.userId);
      }

      // If this is set as default, unset other default addresses for this user
      if (createAddressDto.isDefault) {
        await this.unsetDefaultAddresses(createAddressDto.userId);
      }

      // Create new address
      const address = this.addressRepository.create(createAddressDto);
      return await this.addressRepository.save(address);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Address creation');
    }
  }

  async findAll(queryDto?: AddressQueryDto): Promise<AddressEntity[]> {
    try {
      const where: any = {};
      
      if (queryDto?.userId) {
        where.userId = queryDto.userId;
      }
      if (queryDto?.type) {
        where.type = queryDto.type;
      }
      if (queryDto?.isDefault !== undefined) {
        where.isDefault = queryDto.isDefault;
      }

      return await this.addressRepository.find({
        where,
        relations: ['user'],
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Addresses retrieval');
    }
  }

  async findByUserId(userId: string): Promise<AddressEntity[]> {
    try {
      // Verify user exists
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      return await this.addressRepository.find({
        where: { userId },
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'User addresses retrieval');
    }
  }

  async findOne(id: string): Promise<AddressEntity> {
    try {
      const address = await this.addressRepository.findOne({
        where: { id },
        relations: ['user'],
      });
      if (!address) {
        throw new ResourceNotFoundException('Address', id);
      }
      return address;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Address retrieval');
    }
  }

  async findDefaultAddress(userId: string): Promise<AddressEntity | null> {
    try {
      // Verify user exists
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      return await this.addressRepository.findOne({
        where: { userId, isDefault: true },
      });
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Default address retrieval');
    }
  }

  async update(id: string, updateAddressDto: UpdateAddressDto): Promise<AddressEntity> {
    try {
      const address = await this.addressRepository.findOne({
        where: { id },
      });
      if (!address) {
        throw new ResourceNotFoundException('Address', id);
      }

      // If this is being set as default, unset other default addresses for this user
      if (updateAddressDto.isDefault) {
        await this.unsetDefaultAddresses(address.userId);
      }

      // Update address
      Object.assign(address, updateAddressDto);
      return await this.addressRepository.save(address);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Address update');
    }
  }

  async setAsDefault(addressId: string): Promise<AddressEntity> {
    try {
      const address = await this.addressRepository.findOne({
        where: { id: addressId },
      });
      if (!address) {
        throw new ResourceNotFoundException('Address', addressId);
      }

      // Unset other default addresses for this user
      await this.unsetDefaultAddresses(address.userId);

      // Set this address as default
      address.isDefault = true;
      return await this.addressRepository.save(address);
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Setting default address');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      const address = await this.addressRepository.findOne({
        where: { id },
      });
      if (!address) {
        throw new ResourceNotFoundException('Address', id);
      }

      await this.addressRepository.remove(address);
      return { message: 'Address deleted successfully' };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Address deletion');
    }
  }

  async removeByUserId(userId: string): Promise<{ message: string; deletedCount: number }> {
    try {
      // Verify user exists
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      const addresses = await this.addressRepository.find({
        where: { userId },
      });

      if (addresses.length > 0) {
        await this.addressRepository.remove(addresses);
      }

      return {
        message: 'All user addresses deleted successfully',
        deletedCount: addresses.length,
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'User addresses deletion');
    }
  }

  // Private helper method to unset default addresses for a user
  private async unsetDefaultAddresses(userId: string): Promise<void> {
    await this.addressRepository.update(
      { userId, isDefault: true },
      { isDefault: false }
    );
  }

  // Get addresses by type for a user
  async findByUserIdAndType(userId: string, type: AddressType): Promise<AddressEntity[]> {
    try {
      // Verify user exists
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new ResourceNotFoundException('User', userId);
      }

      return await this.addressRepository.find({
        where: { userId, type },
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.handleDatabaseError(error, 'Addresses by type retrieval');
    }
  }

  // Validate address ownership
  async validateAddressOwnership(addressId: string, userId: string): Promise<boolean> {
    try {
      const address = await this.addressRepository.findOne({
        where: { id: addressId, userId },
      });
      return !!address;
    } catch (error) {
      this.errorHandler.handleDatabaseError(error, 'Address ownership validation');
      return false;
    }
  }
}
