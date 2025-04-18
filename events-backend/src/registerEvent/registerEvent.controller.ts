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
  
  @Get('all')
  async getAll(@Req() req: Request) {
    const userId = req.user.id;
    return this.registerEventService.findAll(userId);
  }
  
  @Get(':id')
  async getById(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user.id;
    return this.registerEventService.findOne(id, userId);
  }
  

}
