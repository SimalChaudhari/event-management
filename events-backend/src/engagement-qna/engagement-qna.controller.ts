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
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
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

  private extractUserId(req: any): string | undefined {
    if (!req?.user) {
      return undefined;
    }
    return req.user.id ?? req.user.sub ?? req.user.userId ?? req.user._id;
  }

  // Real-Time Q&A Dashboard (Public Access)
  @Public()
  @Get('realtime-dashboard')
  getRealtimeDashboard(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', '..', 'public', 'qna-realtime.html'));
  }

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
      const userId = this.extractUserId(req);
      if (!userId) {
        throw new UnauthorizedException('Authentication required to like a question');
      }
      const result = await this.engagementQnaService.toggleLike(likeDto, userId);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          userId,
          voteCount: result.data?.likesCount || 0,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Toggle question like', this.extractUserId(req));
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
      const userId = this.extractUserId(req);
      if (!query.engagementId && !query.sessionId) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Engagement ID or Session ID is required',
          data: null,
          metadata: {
            timestamp: new Date().toISOString(),
            userId,
          },
        });
      }

      // Process query parameters
      const processedQuery = {
        engagementId: query.engagementId,
        sessionId: query.sessionId,
        status: query.status,
        sortBy: query.sortBy,
        page: query.page ? Number(query.page) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
        search: query.search?.trim() || undefined,
        sortOrder: query.sortOrder || undefined,
      };

      const result = await this.engagementQnaService.getQuestions(processedQuery, userId);

      const hasPagination = processedQuery.page !== undefined || processedQuery.limit !== undefined;

      // Extract questions array from data
      const questionsData = hasPagination 
        ? (result.data?.questions || [])
        : (result.data?.questions || []);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: questionsData, // Return questions array directly
        metadata: {
          ...result.metadata,
          userId,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get Engagement Q&A questions', this.extractUserId(req));
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
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    try {
      const pageNumber = page ? parseInt(page, 10) : 1;
      const pageSizeNumber = pageSize ? parseInt(pageSize, 10) : 1; // Default 1 session per page
      const result = await this.engagementQnaService.getTrackQnaByShareLink(
        shareToken,
        pageNumber,
        pageSizeNumber,
      );

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
      const userId = this.extractUserId(req);
      const question = await this.engagementQnaService.getQuestionById(id, userId);

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Question retrieved successfully',
        data: question,
        metadata: {
          timestamp: new Date().toISOString(),
          questionId: id,
          userId,
          voteCount: question.likesCount,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get question by ID', this.extractUserId(req));
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
      const userId = this.extractUserId(req);
      if (!userId) {
        throw new UnauthorizedException('Authentication required to create a question');
      }
      const result = await this.engagementQnaService.createQuestion(
        createDto,
        userId,
      );

      const successResponse: SuccessResponse = {
        success: true,
        message: 'Question created successfully',
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          askedBy: userId,
          engagementId: createDto.engagementId,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Create Engagement Q&A question', this.extractUserId(req));
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
      const userId = this.extractUserId(req);
      if (!userId) {
        throw new UnauthorizedException('Authentication required to update a question');
      }
      const result = await this.engagementQnaService.updateQuestion(
        id,
        updateDto,
        userId,
        isAdmin,
        isModerator,
      );

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          updatedBy: userId,
          isAdmin: isAdmin,
          isModerator: isModerator,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Update question', this.extractUserId(req));
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
      const userId = this.extractUserId(req);
      if (!userId) {
        throw new UnauthorizedException('Authentication required to delete a question');
      }
  
      const result = await this.engagementQnaService.deleteQuestion(id, userId, isAdmin, isModerator);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        metadata: {
          timestamp: new Date().toISOString(),
          deletedBy: userId,
          isAdmin: isAdmin,
          isModerator: isModerator,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Delete question', this.extractUserId(req));
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
      const userId = this.extractUserId(req);
      if (!userId) {
        throw new UnauthorizedException('Authentication required to answer a question');
      }
      const result = await this.engagementQnaService.answerQuestion(
        id,
        answerDto,
        userId,
      );

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          answeredBy: userId,
          isUpdated: result.data?.isUpdated || false,
        },
      };

      return response.status(HttpStatus.OK).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Answer question', this.extractUserId(req));
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
      const userId = this.extractUserId(req);
      if (!userId) {
        throw new UnauthorizedException('Authentication required to generate a share link');
      }
      const result = await this.engagementQnaService.generateShareLink(generateDto);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          generatedBy: userId,
          sessionId: generateDto.sessionId,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Generate share link', this.extractUserId(req));
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
      const userId = this.extractUserId(req);
      if (!userId) {
        throw new UnauthorizedException('Authentication required to generate a track share link');
      }
      const result = await this.engagementQnaService.generateTrackShareLink(generateDto);

      const successResponse: SuccessResponse = {
        success: result.success,
        message: result.message,
        data: result.data,
        metadata: {
          timestamp: new Date().toISOString(),
          generatedBy: userId,
          trackId: generateDto.trackId,
        },
      };

      return response.status(HttpStatus.CREATED).json(successResponse);
    } catch (error: any) {
      this.errorHandler.logError(error, 'Generate track share link', this.extractUserId(req));
      throw error;
    }
  }

}

