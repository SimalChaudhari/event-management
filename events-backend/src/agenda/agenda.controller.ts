import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Res,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AgendaService } from './agenda.service';
import { CreateEventAgendaDto, UpdateEventAgendaDto } from './agenda.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../jwt/roles.guard';
import { Roles } from '../jwt/roles.decorator';
import { UserRole } from '../user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { SuccessResponse } from '../utils/interfaces/error-response.interface';
import { AgendaCategory } from './agenda.entity';

@Controller('api/agendas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgendaController {
  constructor(
    private readonly agendaService: AgendaService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  @Post('create')
  // @Roles(UserRole.Admin)
  async createAgenda(
    @Body() createAgendaDto: CreateEventAgendaDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {

      createAgendaDto.createdBy = req.user.id;
      const agenda = await this.agendaService.createAgenda(createAgendaDto);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Agenda created successfully',
        data: agenda,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Agenda creation', req.user?.id);
      throw error;
    }
  }

  @Get()
  async getAllAgendas(
    @Request() req: any,
    @Res() response: Response,

    @Query('eventId') eventId?: string,
    @Query('exhibitorId') exhibitorId?: string,
  ) {
    try {
      const agendas = await this.agendaService.getAllAgendas(eventId, exhibitorId);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Agendas retrieved successfully',
        data: agendas,
        metadata: {
          total: agendas.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Agendas retrieval', req.user?.id);
      throw error;
    }
  }

  @Get(':id')
  async getAgendaById(
    @Param('id') id: string,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const agenda = await this.agendaService.getAgendaById(id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: 'Agenda retrieved successfully',
        data: agenda,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Agenda retrieval by ID', req.user?.id);
      throw error;
    }
  }

  @Put('update/:id')
  @Roles(UserRole.Admin)
  async updateAgenda(
    @Param('id') id: string,
    @Body() updateAgendaDto: UpdateEventAgendaDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const agenda = await this.agendaService.updateAgenda(id, updateAgendaDto);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Agenda updated successfully',
        data: agenda,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Agenda update', req.user?.id);
      throw error;
    }
  }

  @Delete('delete/:id')
  @Roles(UserRole.Admin)
  async deleteAgenda(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.agendaService.deleteAgenda(id);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: result.message,
        data: null,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Agenda deletion', req.user?.id);
      throw error;
    }
  }

  @Get('category/:eventId/:category')
  async getAgendasByCategory(
    @Param('eventId') eventId: string,
    @Param('category') category: AgendaCategory,
    @Request() req: any,
    @Res() response: Response,
  ) {
    try {
      const agendas = await this.agendaService.getAgendasByCategory(eventId, category);
      
      const successResponse: SuccessResponse = {
        success: true,
        message: `Agendas for category ${category} retrieved successfully`,
        data: agendas,
        metadata: {
          total: agendas.length,
          timestamp: new Date().toISOString(),
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error) {
      this.errorHandler.logError(error, 'Agendas retrieval by category', req.user?.id);
      throw error;
    }
  }

}
