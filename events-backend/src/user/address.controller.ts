import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AddressService } from './address.service';
import { 
  CreateAddressDto, 
  UpdateAddressDto, 
  AddressQueryDto,
  SetDefaultAddressDto 
} from './address.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { UserEntity } from './users.entity';
import { GetUser } from 'jwt/get-user.decorator';

@Controller('api/users/addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createAddressDto: CreateAddressDto,
    @GetUser() user: UserEntity,
  ) {
    try {
      // Ensure the address is created for the authenticated user
      createAddressDto.userId = user.id;
      const address = await this.addressService.create(createAddressDto);
      return {
        status: 'success',
        message: 'Address created successfully',
        data: address,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('get')
  async findAll(@Query() queryDto: AddressQueryDto) {
    try {
      const addresses = await this.addressService.findAll(queryDto);
      return {
        status: 'success',
        message: 'Addresses retrieved successfully',
        data: addresses,
        count: addresses.length,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('my-addresses')
  async findMyAddresses(@GetUser() user: UserEntity) {
    try {
      const addresses = await this.addressService.findByUserId(user.id);
      return {
        status: 'success',
        message: 'User addresses retrieved successfully',
        data: addresses,
        count: addresses.length,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('default')
  async findDefaultAddress(@GetUser() user: UserEntity) {
    try {
      const address = await this.addressService.findDefaultAddress(user.id);
      return {
        status: 'success',
        message: address ? 'Default address retrieved successfully' : 'No default address found',
        data: address,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    try {
      const addresses = await this.addressService.findByUserId(userId);
      return {
        status: 'success',
        message: 'User addresses retrieved successfully',
        data: addresses,
        count: addresses.length,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const address = await this.addressService.findOne(id);
      return {
        status: 'success',
        message: 'Address retrieved successfully',
        data: address,
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch('update/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @GetUser() user: UserEntity,
  ) {
    try {
      // Validate that the address belongs to the authenticated user
      const isOwner = await this.addressService.validateAddressOwnership(id, user.id);
      if (!isOwner) {
        throw new Error('You can only update your own addresses');
      }

      const address = await this.addressService.update(id, updateAddressDto);
      return {
        status: 'success',
        message: 'Address updated successfully',
        data: address,
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id/set-default')
  async setAsDefault(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UserEntity,
  ) {
    try {
      // Validate that the address belongs to the authenticated user
      const isOwner = await this.addressService.validateAddressOwnership(id, user.id);
      if (!isOwner) {
        throw new Error('You can only set your own addresses as default');
      }

      const address = await this.addressService.setAsDefault(id);
      return {
        status: 'success',
        message: 'Address set as default successfully',
        data: address,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: UserEntity,
  ) {
    try {
      // Validate that the address belongs to the authenticated user
      const isOwner = await this.addressService.validateAddressOwnership(id, user.id);
      if (!isOwner) {
        throw new Error('You can only delete your own addresses');
      }

      const result = await this.addressService.remove(id);
      return {
        status: 'success',
        message: result.message,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete('user/:userId/all')
  @HttpCode(HttpStatus.OK)
  async removeAllByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    try {
      const result = await this.addressService.removeByUserId(userId);
      return {
        status: 'success',
        message: result.message,
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get addresses by type for authenticated user
  @Get('type/:type')
  async findByType(
    @Param('type') type: string,
    @GetUser() user: UserEntity,
  ) {
    try {
      const addresses = await this.addressService.findByUserIdAndType(
        user.id,
        type as any,
      );
      return {
        status: 'success',
        message: `${type} addresses retrieved successfully`,
        data: addresses,
        count: addresses.length,
      };
    } catch (error) {
      throw error;
    }
  }
}
