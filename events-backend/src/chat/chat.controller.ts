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
  DeleteMessageDto,
  DeleteAllMessagesDto,
  EditMessageDto,
  GetChatListDto,
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



  // Delete specific message
  @Post('delete-message')
  async deleteMessage(@Req() req: any, @Body() dto: DeleteMessageDto) {
    const userID = req.user?.sub || req.user?.id;
    if (!userID) {
      throw new BadRequestException('User authentication failed');
    }

    const result = await this.chatService.deleteMessage(userID, dto);
    return {
      success: true,
      data: result,
    };
  }

  // Delete all messages in a thread
  @Post('delete-all-messages')
  async deleteAllMessages(@Req() req: any, @Body() dto: DeleteAllMessagesDto) {
    const userID = req.user?.sub || req.user?.id;
    if (!userID) {
      throw new BadRequestException('User authentication failed');
    }

    const result = await this.chatService.deleteAllMessages(userID, dto);
    return {
      success: true,
      data: result,
    };
  }

  // Edit message
  @Post('edit-message')
  async editMessage(@Req() req: any, @Body() dto: EditMessageDto) {
    const userID = req.user?.sub || req.user?.id;
    if (!userID) {
      throw new BadRequestException('User authentication failed');
    }

    const result = await this.chatService.editMessage(userID, dto);
    return {
      success: true,
      data: result,
    };
  }

  // Get chat list (WhatsApp style contact list)
  @Get('list')
  async getChatList(@Req() req: any, @Query() dto: GetChatListDto) {
    const userID = req.user?.sub || req.user?.id;
    if (!userID) {
      throw new BadRequestException('User authentication failed');
    }

    const result = await this.chatService.getChatList(userID, dto);
    return result;
  }

}
