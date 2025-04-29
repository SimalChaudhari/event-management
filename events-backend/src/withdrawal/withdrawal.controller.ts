// src/withdrawal/withdrawal.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
  HttpStatus,
  HttpCode,
  Req,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { WithdrawalService } from './withdrawal.service';
import { CreateWithdrawalDto } from './create-withdrawal.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';

@Controller('api/withdrawal')
@UseGuards(JwtAuthGuard)
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('document', {
      storage: diskStorage({
        destination: './uploads/withdrawals',
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${uuidv4()}${path.extname(file.originalname)}`;
          cb(null, uniqueSuffix);
        },
      }),
    }),
  )
  async createWithdrawal(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateWithdrawalDto,
    @Request() req: any,
  ) {
    if (file) {
      dto.document = `uploads/withdrawals/${file.filename}`;
    }

    const userId = req.user.id;

    await this.withdrawalService.create(dto, userId);

    return {
      status: 'success',
      message: 'Withdrawal request created successfully',
    
    };
  }

  @Get()
  async getAllWithdrawals(@Request() req: any) {
    const user = req.user;

    const withdrawals =
      user.role === 'admin'
        ? await this.withdrawalService.findAll()
        : await this.withdrawalService.findByUserId(user.id);

    return {
      status: 'success',
      message: `Found ${withdrawals.length} withdrawal${withdrawals.length === 1 ? '' : 's'}`,
      length: withdrawals.length,
      data: withdrawals,
    };
  }

  @Get(':id')
  async getWithdrawalById(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    const withdrawal = await this.withdrawalService.findOne(id);

    if (!withdrawal) {
      throw new NotFoundException(`Withdrawal with ID ${id} not found`);
    }

    // Safely access and compare user IDs
    const withdrawalUserId = withdrawal.order?.user?.id;
    if (user.role !== 'admin' && withdrawalUserId !== user.id) {
      throw new NotFoundException(
        `You are not authorized to view this withdrawal`,
      );
    }

    return {
      status: 'success',
      message: `Withdrawal with ID ${id} retrieved successfully`,
      data: withdrawal,
    };
  }
}
