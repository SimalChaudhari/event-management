import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Res,
  UseGuards,
  Request,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { EngagementQnaService } from './engagement-qna.service';
import {
  CreateEngagementQuestionDto,
  UpdateEngagementQuestionDto,
  AnswerEngagementQuestionDto,
  LikeEngagementQuestionDto,
  GetEngagementQuestionsDto,
  GenerateShareLinkDto,
  GenerateQuestionShareLinkDto,
  GenerateTrackShareLinkDto,
} from './engagement-qna.dto';
import { JwtAuthGuard } from 'jwt/jwt-auth.guard';
import { RolesGuard } from 'jwt/roles.guard';
import { Roles } from 'jwt/roles.decorator';
import { Public } from 'jwt/public.decorator';
import { UserRole } from 'user/users.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';

interface SuccessResponse {
  success: boolean;
  message: string;
  data?: any;
  metadata?: {
    timestamp: string;
    [key: string]: any;
  };
}

@Controller('api/engagements/qna')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EngagementQnaController {
  constructor(
    private readonly engagementQnaService: EngagementQnaService,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  // 3. Like/Unlike Question (Registered users only)
  // @Public()
  @Post('like')
  @Roles(UserRole.Admin, UserRole.Moderator,UserRole.User)
  async toggleLike(
    @Body() likeDto: LikeEngagementQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.engagementQnaService.toggleLike(likeDto, req.user?.id);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          userId: req.user?.id,
          voteCount: result.data?.likesCount || 0,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Toggle question like', req.user?.id);
      throw error;
    }
  }

  // 4. Get All Questions for Engagement (Users and Admin)
  @Public()
  @Get('questions')
  async getQuestions(
    @Query() query: GetEngagementQuestionsDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      if (!query.engagementId && !query.sessionId) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Engagement ID or Session ID is required',
          data: null,
          metadata: {
            timestamp: new Date().toISOString(),
            userId: req.user?.id,
          },
        });
      }

      const result = await this.engagementQnaService.getQuestions(query, req.user?.id);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          ...result.metadata,
          userId: req.user?.id,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get Engagement Q&A questions', req.user?.id);
      throw error;
    }
  }

  // Get Session Q&A by Share Link (Public Access) - Must be before :id route
  @Public()
  @Get('share/:shareToken')
  async getSessionQnaByShareLink(
    @Param('shareToken') shareToken: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.engagementQnaService.getSessionQnaByShareLink(shareToken);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: result.metadata,
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get session Q&A by share link');
      throw error;
    }
  }

  // Answer Question via Share Link (Public Access)
  @Public()
  @Put('share/:shareToken/answer/:questionId')
  async answerQuestionViaShareLink(
    @Param('shareToken') shareToken: string,
    @Param('questionId') questionId: string,
    @Body() answerDto: AnswerEngagementQuestionDto,
    @Res() response: Response,
  ) {
    try {
      const result = await this.engagementQnaService.answerQuestionViaShareLink(
        shareToken,
        questionId,
        answerDto.answer,
      );

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          shareToken: shareToken,
          questionId: questionId,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Answer question via share link');
      throw error;
    }
  }

  // Update Question via Share Link (Public Access)
  @Public()
  @Put('share/:shareToken/question/:questionId')
  async updateQuestionViaShareLink(
    @Param('shareToken') shareToken: string,
    @Param('questionId') questionId: string,
    @Body() updateDto: UpdateEngagementQuestionDto,
    @Res() response: Response,
  ) {
    try {
      const result = await this.engagementQnaService.updateQuestionViaShareLink(
        shareToken,
        questionId,
        updateDto,
      );

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          shareToken: shareToken,
          questionId: questionId,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Update question via share link');
      throw error;
    }
  }

  // Delete Question via Share Link (Public Access)
  @Public()
  @Delete('share/:shareToken/question/:questionId')
  async deleteQuestionViaShareLink(
    @Param('shareToken') shareToken: string,
    @Param('questionId') questionId: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.engagementQnaService.deleteQuestionViaShareLink(
        shareToken,
        questionId,
      );

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        metadata: {
          timestamp: new Date().toISOString(),
          shareToken: shareToken,
          questionId: questionId,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Delete question via share link');
      throw error;
    }
  }

  // Generate Shareable Link for Individual Question (Public Access - No Auth Required)
  @Public()
  @Post('generate-question-link')
  async generateQuestionShareLink(
    @Body() generateDto: GenerateQuestionShareLinkDto,
    @Res() response: Response,
  ) {
    try {
      const result = await this.engagementQnaService.generateQuestionShareLink(generateDto);
      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          questionId: generateDto.questionId,
        },
      };
      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Generate question share link');
      throw error;
    }
  }


  // Get Track Q&A by Share Link (All Sessions with Questions) - Public Access
  // Must be before :id route to avoid route conflicts
  @Public()
  @Get('track/:shareToken')
  async getTrackQnaByShareLink(
    @Param('shareToken') shareToken: string,
    @Res() response: Response,
  ) {
    try {
      const result = await this.engagementQnaService.getTrackQnaByShareLink(shareToken);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: result.metadata,
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get track Q&A by share link');
      throw error;
    }
  }

  // 7. Get Vote Count for Question
  @Get(':id')
  async getQuestionById(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const question = await this.engagementQnaService.getQuestionById(id, req.user?.id);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Question retrieved successfully',
        data: question,
        metadata: {
          timestamp: new Date().toISOString(),
          questionId: id,
          userId: req.user?.id,
          voteCount: question.likesCount,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get question by ID', req.user?.id);
      throw error;
    }
  }

  // 1. Create Question (Registered users only for the event)
  @Post()
  async createQuestion(
    @Body() createDto: CreateEngagementQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.engagementQnaService.createQuestion(
        createDto,
        req.user?.id,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Question created successfully',
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          askedBy: req.user?.id,
          engagementId: createDto.engagementId,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Create Engagement Q&A question', req.user?.id);
      throw error;
    }
  }

  // 6. Update Question (Own question by user OR Admin/Moderator can update any)
  @Put(':id')
  async updateQuestion(
    @Param('id') id: string,
    @Body() updateDto: UpdateEngagementQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const isAdmin = req.user?.role === UserRole.Admin;
      const isModerator = req.user?.role === UserRole.Moderator;
      const result = await this.engagementQnaService.updateQuestion(
        id,
        updateDto,
        req.user?.id,
        isAdmin,
        isModerator,
      );

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          updatedBy: req.user?.id,
          isAdmin: isAdmin,
          isModerator: isModerator,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Update question', req.user?.id);
      throw error;
    }
  }

  // 5. Delete Question (Own question by user OR Admin/Moderator can delete any)
  @Delete(':id')
  async deleteQuestion(
    @Param('id') id: string,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const isAdmin = req.user?.role === UserRole.Admin;
      const isModerator = req.user?.role === UserRole.Moderator;
  
      const result = await this.engagementQnaService.deleteQuestion(id, req.user?.id, isAdmin, isModerator);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        metadata: {
          timestamp: new Date().toISOString(),
          deletedBy: req.user?.id,
          isAdmin: isAdmin,
          isModerator: isModerator,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Delete question', req.user?.id);
      throw error;
    }
  }

  // 2. Answer Question (Admin/Moderator only)
  @Put(':id/answer')
  @Roles(UserRole.Admin, UserRole.Moderator)
  async answerQuestion(
    @Param('id') id: string,
    @Body() answerDto: AnswerEngagementQuestionDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.engagementQnaService.answerQuestion(
        id,
        answerDto,
        req.user?.id,
      );

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          answeredBy: req.user?.id,
          isUpdated: result.data?.isUpdated || false,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Answer question', req.user?.id);
      throw error;
    }
  }

  // Generate Shareable Link for Session Q&A (Admin/Moderator only)
  @Post('generate-link')
  @Roles(UserRole.Admin, UserRole.Moderator)
  async generateShareLink(
    @Body() generateDto: GenerateShareLinkDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.engagementQnaService.generateShareLink(generateDto);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          generatedBy: req.user?.id,
          sessionId: generateDto.sessionId,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Generate share link', req.user?.id);
      throw error;
    }
  }

  // Generate Shareable Link for Track (All Sessions with Questions) - Admin/Moderator only
  @Post('generate-track-link')
  @Roles(UserRole.Admin, UserRole.Moderator)
  async generateTrackShareLink(
    @Body() generateDto: GenerateTrackShareLinkDto,
    @Res() response: Response,
    @Request() req: any,
  ) {
    try {
      const result = await this.engagementQnaService.generateTrackShareLink(generateDto);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          generatedBy: req.user?.id,
          trackId: generateDto.trackId,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Generate track share link', req.user?.id);
      throw error;
    }
  }

}

