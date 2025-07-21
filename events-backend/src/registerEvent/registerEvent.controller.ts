import { Body, Controller, Delete, Get, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { RegisterEventService } from './registerEvent.service';
import { CreateRegisterEventDto, UpdateRegisterEventDto } from './registerEvent.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { Request, Response } from 'express';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { UserRole } from 'user/users.entity';

@Controller('api/register-events')
@UseGuards(JwtAuthGuard)
export class RegisterEventController {
  constructor(private readonly registerEventService: RegisterEventService) {}

  @Post('create')
  async createRegisterEvent(
    @Req() req: Request,
    @Body() createRegisterEventDto: CreateRegisterEventDto,
  ) {
    const userId = req.user.id;
    return this.registerEventService.createRegisterEvent(userId, createRegisterEventDto);
  }

  @Post('admin/create')
  async adminCreateRegisterEvent(
    @Req() req: Request,
    @Body() createRegisterEventDto: CreateRegisterEventDto,
  ) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new Error('Only admin can create registrations for other users');
    }

    // Set isCreatedByAdmin to true for admin-created registrations
    createRegisterEventDto.isCreatedByAdmin = true;
    
    // Use the userId from the request body (admin specifies which user to register)
    const userId = createRegisterEventDto.userId;
    if (!userId) {
      throw new Error('userId is required for admin registration');
    }

    return this.registerEventService.createRegisterEvent(userId, createRegisterEventDto);
  }

  // Admin can update any registration
  @Put('admin/update/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async adminUpdateRegisterEvent(
    @Param('id') id: string,
    @Body() updateRegisterEventDto: UpdateRegisterEventDto,
    @Res() response: Response,
  ) {
    try {
      const updatedRegistration = await this.registerEventService.adminUpdateRegisterEvent(id, updateRegisterEventDto);
      
      return response.status(200).json({
        success: true,
        message: 'Registration updated successfully',
        data: updatedRegistration,
      });
    } catch (error) {
      throw error;
    }
  }

  // Admin can delete any registration
  @Delete('admin/delete/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  async adminDeleteRegisterEvent(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    try {
      await this.registerEventService.adminDeleteRegisterEvent(id);
      
      return response.status(200).json({
        success: true,
        message: 'Registration deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  
  @Get('all')
  async getAll(@Req() req: Request) {
    const userId = req.user.id;
    const role = req.user.role;
    return this.registerEventService.findAll(userId,role);
  }
  
  @Get(':id')
  async getById(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user.id;
    const role = req.user.role;
    return this.registerEventService.findOne(id, userId,role);
  }
  

}
