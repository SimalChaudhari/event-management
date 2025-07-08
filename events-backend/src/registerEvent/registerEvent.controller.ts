import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RegisterEventService } from './registerEvent.service';
import { CreateRegisterEventDto } from './registerEvent.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { Request } from 'express';

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
