import { Body, Controller, Delete, Get, Param, Post, Put, Req, Res, UseGuards, HttpStatus } from '@nestjs/common';
import { RegisterEventService } from './registerEvent.service';
import { CreateRegisterEventDto, UpdateRegisterEventDto } from './registerEvent.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { Request, Response } from 'express';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { UserRole } from 'user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
  ValidationException
} from '../utils/exceptions/custom-exceptions';

@Controller('api/register-events')
@UseGuards(JwtAuthGuard)
export class RegisterEventController {
  constructor(
    private readonly registerEventService: RegisterEventService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  @Post('create')
  async createRegisterEvent(
    @Req() req: Request,
    @Body() createRegisterEventDto: CreateRegisterEventDto,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user.id;
      const registration = await this.registerEventService.createRegisterEvent(userId, createRegisterEventDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Event registration created successfully',
        data: registration,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Register Event creation', req.user?.id);
      throw error;
    }
  }

  @Post('admin/create')
  async adminCreateRegisterEvent(
    @Req() req: Request,
    @Body() createRegisterEventDto: CreateRegisterEventDto,
    @Res() response: Response,
  ) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        throw new ValidationException('Only admin can create registrations for other users');
      }

      // Set isCreatedByAdmin to true for admin-created registrations
      createRegisterEventDto.isCreatedByAdmin = true;
      
      // Use the userId from the request body (admin specifies which user to register)
      const userId = createRegisterEventDto.userId;
      if (!userId) {
        throw new ValidationException('userId is required for admin registration');
      }

      const registration = await this.registerEventService.createRegisterEvent(userId, createRegisterEventDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Admin registration created successfully',
        data: registration,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Admin Register Event creation', req.user?.id);
      throw error;
    }
  }

  @Put('admin/update/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async adminUpdateRegisterEvent(
    @Param('id') id: string,
    @Body() updateRegisterEventDto: UpdateRegisterEventDto,
    @Res() response: Response,
    @Req() req: Request,
  ) {
    try {
      const updatedRegistration = await this.registerEventService.adminUpdateRegisterEvent(id, updateRegisterEventDto);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Registration updated successfully',
        data: updatedRegistration,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Admin Register Event update', req.user?.id);
      throw error;
    }
  }

  @Delete('admin/delete/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async adminDeleteRegisterEvent(
    @Param('id') id: string,
    @Res() response: Response,
    @Req() req: Request,
  ) {
    try {
      await this.registerEventService.adminDeleteRegisterEvent(id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Registration deleted successfully',
        data: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };
      
      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Admin Register Event deletion', req.user?.id);
      throw error;
    }
  }

  @Get('all')
  async getAll(@Req() req: Request, @Res() response: Response) {
    try {
      const userId = req.user.id;
      const role = req.user.role;
      const result = await this.registerEventService.findAll(userId, role);
      
      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'Register Event retrieval', req.user?.id);
      throw error;
    }
  }
  
  @Get(':id')
  async getById(@Param('id') id: string, @Req() req: Request, @Res() response: Response) {
    try {
      const userId = req.user.id;
      const role = req.user.role;
      const result = await this.registerEventService.findOne(id, userId, role);
      
      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.errorHandler.logError(error, 'Register Event retrieval by ID', req.user?.id);
      throw error;
    }
  }
}
