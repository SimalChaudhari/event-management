// src/controllers/speaker.controller.ts
import { Controller, Post, Get, Put, Delete, Body, Param, Res } from '@nestjs/common';

import { Response } from 'express';
import { SpeakerService } from './speaker.service';
import { SpeakerDto } from './speaker.dto';

@Controller('api/speakers')
export class SpeakerController {
    constructor(private readonly speakerService: SpeakerService) {}

    @Post('create')
    async createSpeaker(@Body() speakerDto: SpeakerDto, @Res() response: Response) {
        const speaker = await this.speakerService.createSpeaker(speakerDto);
        return response.status(201).json({
            success: true,
            message: 'Speaker created successfully',
            data: speaker,
        });
    }

    @Get('get')
    async getAllSpeakers(@Res() response: Response) {
        const speakers = await this.speakerService.getAllSpeakers();
        return response.status(200).json({
            success: true,
            message: 'Speakers retrieved successfully',
            data: speakers,
        });
    }

    @Get(':id')
    async getSpeakerById(@Param('id') id: string, @Res() response: Response) {
        const speaker = await this.speakerService.getSpeakerById(id);
        return response.status(200).json({
            success: true,
            message: 'Speaker retrieved successfully',
            data: speaker,
        });
    }

    @Put('update/:id')
    async updateSpeaker(@Param('id') id: string, @Body() speakerDto: SpeakerDto, @Res() response: Response) {
        const updatedSpeaker = await this.speakerService.updateSpeaker(id, speakerDto);
        return response.status(200).json({
            success: true,
            message: 'Speaker updated successfully',
            data: updatedSpeaker,
        });
    }

    @Delete('delete/:id')
    async deleteSpeaker(@Param('id') id: string, @Res() response: Response) {
        const result = await this.speakerService.deleteSpeaker(id);
        return response.status(200).json({
            success: true,
            message: result.message,
            data: null,
        });
    }
}