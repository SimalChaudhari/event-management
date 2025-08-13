import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  SendMessageDto,
  GetChatDto,
  CreateThreadDto,
  MarkReadDto,
  UpdateLastSeenDto,
} from './chat.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';

@Controller('api/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  // Send message API
  @Post('send/:receiverID')
  async sendMessage(
    @Req() req: any,
    @Param('receiverID') receiverID: string,
    @Body() dto: Omit<SendMessageDto, 'threadID'>,
  ) {
    const userID = req.user?.sub || req.user?.id;
    if (!userID) {
      throw new BadRequestException('User authentication failed');
    }



    const result = await this.chatService.sendMessage(userID, receiverID, dto);
    return {
      success: true,
      data: result,
    };
  }

  // Get chat API
  @Get('open-chat')
  async getChat(@Req() req: any, @Query() dto: GetChatDto) {
    const userID = req.user?.sub || req.user?.id;
    if (!userID) {
      throw new BadRequestException('User authentication failed');
    }

    const result = await this.chatService.getChat(userID, dto);
    return {
      success: true,
      data: result,
    };
  }


  // Mark as read
  @Post('read')
  async markAsRead(@Req() req: any, @Body() dto: MarkReadDto) {
    const userID = req.user?.sub || req.user?.id;
    if (!userID) {
      throw new BadRequestException('User authentication failed');
    }



    const result = await this.chatService.markAsRead(userID, dto);
    return {
      success: true,
      data: result,
    };
  }

  // Update last seen
  @Post('seen')
  async updateLastSeen(@Req() req: any, @Body() dto: UpdateLastSeenDto) {
    const userID = req.user?.sub || req.user?.id;
    if (!userID) {
      throw new BadRequestException('User authentication failed');
    }



    const result = await this.chatService.updateLastSeen(userID, dto);
    return {
      success: true,
      data: result,
    };
  }

}
