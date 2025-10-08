// src/services/qa.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SurveyQuestion, SurveyAnswer, QuestionType, QuestionStatus } from './qa.entity';
import { Survey, SurveySession } from './survey.entity';
import { Event } from '../event/event.entity';
import { CreateQuestionDto, UpdateQuestionDto, SubmitAnswerDto } from './qa.dto';
import {
  ValidationException,
  ResourceNotFoundException,
  DuplicateResourceException,
  BusinessLogicException,
} from '../utils/exceptions/custom-exceptions';
import { ErrorHandlerService } from '../utils/services/error-handler.service';

@Injectable()
export class QAService {
  constructor(
    @InjectRepository(SurveyQuestion)
    private questionRepository: Repository<SurveyQuestion>,
    @InjectRepository(SurveyAnswer)
    private answerRepository: Repository<SurveyAnswer>,
    @InjectRepository(Survey)
    private surveyRepository: Repository<Survey>,
    @InjectRepository(SurveySession)
    private sessionRepository: Repository<SurveySession>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private errorHandler: ErrorHandlerService,
  ) {}

  // CREATE - Admin creates question
  async createQuestion(createQuestionDto: CreateQuestionDto) {
    try {
      // 1. Validate survey exists
      const survey = await this.surveyRepository.findOne({
        where: { id: createQuestionDto.surveyId },
      });

      if (!survey) {
        throw new ResourceNotFoundException('Survey', createQuestionDto.surveyId);
      }

      // 2. Validate session exists and belongs to survey
      const session = await this.sessionRepository.findOne({
        where: { 
          id: createQuestionDto.sessionId,
          surveyId: createQuestionDto.surveyId,
          isActive: true 
        },
      });

      if (!session) {
        throw new ValidationException(
          `Session with ID ${createQuestionDto.sessionId} not found or does not belong to survey ${createQuestionDto.surveyId}`,
          [{ field: 'sessionId', provided: createQuestionDto.sessionId, surveyId: createQuestionDto.surveyId }]
        );
      }

      // 3. Validate question type specific requirements
      await this.validateQuestionTypeRequirements(createQuestionDto);

      // 4. Check for duplicate question name in the same survey and session
      const existingQuestion = await this.questionRepository.findOne({
        where: {
          surveyId: createQuestionDto.surveyId,
          sessionId: createQuestionDto.sessionId,
          questionName: createQuestionDto.questionName,
        },
      });

      if (existingQuestion) {
        throw new DuplicateResourceException(
          `Question with name "${createQuestionDto.questionName}" already exists in this survey session`,
        );
      }

      // 5. Create question
      const question = new SurveyQuestion();
      question.surveyId = createQuestionDto.surveyId;
      question.sessionId = createQuestionDto.sessionId;
      question.questionName = createQuestionDto.questionName;
      question.description = createQuestionDto.description;
      question.questionType = createQuestionDto.questionType;
      question.status = createQuestionDto.status || QuestionStatus.ACTIVE;
      question.isRequired = createQuestionDto.isRequired ?? true;
      question.orderIndex = createQuestionDto.orderIndex || 0;
      question.options = createQuestionDto.options;
      question.minRating = createQuestionDto.minRating;
      question.maxRating = createQuestionDto.maxRating;
      question.ratingLabel = createQuestionDto.ratingLabel;
      question.isActive = createQuestionDto.isActive ?? true;

      const savedQuestion = await this.questionRepository.save(question);

      // 6. Return created question with survey and session info
      return {
        ...savedQuestion,
        surveyInfo: {
          id: survey.id,
          title: survey.title,
          eventId: survey.eventId,
        },
        sessionInfo: {
          id: session.id,
          name: session.name,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          description: session.description,
        },
      };
    } catch (error: any) {
      if (
        error instanceof ValidationException ||
        error instanceof DuplicateResourceException ||
        error instanceof ResourceNotFoundException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Question creation');
      this.errorHandler.handleDatabaseError(error, 'Question creation');
    }
  }

  // READ - Get all questions for a survey
  async getQuestionsBySurveyId(surveyId: string) {
    try {
      // 1. Validate survey exists
      const survey = await this.surveyRepository.findOne({
        where: { id: surveyId },
      });

      if (!survey) {
        throw new ResourceNotFoundException('Survey', surveyId);
      }

      // 2. Get all questions for the survey
      const questions = await this.questionRepository.find({
        where: { surveyId, isActive: true },
        order: { orderIndex: 'ASC', createdAt: 'ASC' },
      });

      // 3. Get all sessions for the survey
      const sessions = await this.sessionRepository.find({
        where: { surveyId, isActive: true },
      });

      // Create session map for quick lookup
      const sessionMap = new Map(
        sessions.map(session => [session.id, session])
      );

      // 4. Get question statistics with session info
      const questionStats = await Promise.all(
        questions.map(async (question) => {
          const answerCount = await this.answerRepository.count({
            where: { questionId: question.id, isAnswered: true },
          });
          
          const session = sessionMap.get(question.sessionId);
          
          return {
            ...question,
            answerCount,
            sessionInfo: session ? {
              id: session.id,
              name: session.name,
              date: session.date,
              startTime: session.startTime,
              endTime: session.endTime,
              description: session.description,
            } : null,
          };
        }),
      );

      return {
        surveyInfo: {
          id: survey.id,
          title: survey.title,
          eventId: survey.eventId,
          startDate: survey.startDate,
          endDate: survey.endDate,
        },
        sessions: sessions.map(session => ({
          id: session.id,
          name: session.name,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          description: session.description,
        })),
        questions: questionStats,
        totalQuestions: questions.length,
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get questions by survey ID');
      this.errorHandler.handleDatabaseError(error, 'Questions retrieval');
    }
  }

  // Helper method to validate question type specific requirements
  private async validateQuestionTypeRequirements(createQuestionDto: CreateQuestionDto): Promise<void> {
    const { questionType, options, minRating, maxRating } = createQuestionDto;

    switch (questionType) {
      case QuestionType.DROPDOWN:
      case QuestionType.RADIO:
      case QuestionType.CHECKBOX:
        if (!options || options.length < 2) {
          throw new ValidationException(
            `${questionType} questions require at least 2 options`,
            [
              {
                field: 'options',
                questionType,
                required: 'At least 2 options',
                provided: options?.length || 0,
              },
            ],
          );
        }
        break;

      case QuestionType.RATING:
        if (!minRating || !maxRating) {
          throw new ValidationException(
            'Rating questions require both minRating and maxRating',
            [
              {
                field: 'ratingRange',
                questionType,
                required: 'minRating and maxRating',
                provided: { minRating, maxRating },
              },
            ],
          );
        }
        if (minRating >= maxRating) {
          throw new ValidationException(
            'minRating must be less than maxRating',
            [
              {
                field: 'ratingRange',
                questionType,
                minRating,
                maxRating,
                suggestion: `Use minRating: ${minRating} and maxRating: ${minRating + 1} or higher`,
              },
            ],
          );
        }
        break;

      case QuestionType.TEXT:
        // No additional validation needed
        break;

      default:
        throw new ValidationException(
          `Unsupported question type: ${questionType}`,
          [
            {
              field: 'questionType',
              provided: questionType,
              supported: Object.values(QuestionType),
            },
          ],
        );
    }
  }

  // SUBMIT - User submits an answer
  async submitAnswer(submitAnswerDto: SubmitAnswerDto, userId: string) {
    try {
      let { questionId, surveyId, sessionId, isDraft } = submitAnswerDto;
      
      // sessionId is now required - it should be the survey session ID
      if (!sessionId) {
        throw new ValidationException(
          'Session ID is required when submitting an answer',
          [{ field: 'sessionId', message: 'Must provide a valid session ID' }],
        );
      }

      // 1. Validate question exists
      const question = await this.questionRepository.findOne({
        where: { id: questionId, isActive: true },
      });

      if (!question) {
        throw new ResourceNotFoundException('Question', questionId);
      }

      // 2. Validate survey exists
      const survey = await this.surveyRepository.findOne({
        where: { id: surveyId },
      });

      if (!survey) {
        throw new ResourceNotFoundException('Survey', surveyId);
      }

      // 3. Validate session exists and belongs to survey
      const session = await this.sessionRepository.findOne({
        where: { 
          id: sessionId,
          surveyId: surveyId,
          isActive: true 
        },
      });

      if (!session) {
        throw new ValidationException(
          `Session with ID ${sessionId} not found or does not belong to survey ${surveyId}`,
          [{ field: 'sessionId', provided: sessionId, surveyId: surveyId }]
        );
      }

      // 4. Validate question belongs to the session
      if (question.sessionId !== sessionId) {
        throw new ValidationException(
          'Question does not belong to the specified session',
          [
            { 
              field: 'sessionId', 
              provided: sessionId,
              expected: question.sessionId,
              message: `This question belongs to session ${question.sessionId}`,
            }
          ],
        );
      }

      // 5. Check if user has already completed the survey
      if (!isDraft) {
        const isCompleted = await this.checkSurveyCompletion(surveyId, userId, sessionId);
        if (isCompleted) {
          throw new ConflictException(
            'Survey is already completed. No need to submit again.'
          );
        }
      }

      // 6. Validate answer based on question type (only if not draft or if finalizing)
      if (!isDraft) {
        this.validateAnswerByQuestionType(question, submitAnswerDto);
      }

      // 7. Check if user already answered this question
      const existingAnswer = await this.answerRepository.findOne({
        where: { questionId, userId, surveyId, sessionId },
      });

      let answer: SurveyAnswer;
      const isAnswered = isDraft ? false : true; // Draft = answering, Final = answered

      if (existingAnswer) {
        // Update existing answer
        existingAnswer.textAnswer = submitAnswerDto.textAnswer;
        existingAnswer.selectedOptions = submitAnswerDto.selectedOptions;
        existingAnswer.ratingAnswer = submitAnswerDto.ratingAnswer;
        existingAnswer.isAnswered = isAnswered;
        existingAnswer.updatedAt = new Date();

        answer = await this.answerRepository.save(existingAnswer);
      } else {
        // Create new answer
        const newAnswer = new SurveyAnswer();
        newAnswer.questionId = questionId;
        newAnswer.surveyId = surveyId;
        newAnswer.sessionId = sessionId;
        newAnswer.eventId = survey.eventId;
        newAnswer.userId = userId;
        newAnswer.textAnswer = submitAnswerDto.textAnswer;
        newAnswer.selectedOptions = submitAnswerDto.selectedOptions;
        newAnswer.ratingAnswer = submitAnswerDto.ratingAnswer;
        newAnswer.isAnswered = isAnswered;
        newAnswer.isActive = true;

        answer = await this.answerRepository.save(newAnswer);
      }

      return {
        ...answer,
        status: isDraft ? 'answering' : 'answered',
        questionInfo: {
          id: question.id,
          name: question.questionName,
          type: question.questionType,
        },
        sessionInfo: {
          id: session.id,
          name: session.name,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
        },
      };
    } catch (error: any) {
      if (
        error instanceof ValidationException ||
        error instanceof ResourceNotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Submit answer');
      this.errorHandler.handleDatabaseError(error, 'Answer submission');
    }
  }

  // BULK SUBMIT - User submits all answers at once
  async submitBulkAnswers(bulkSubmitDto: any, userId: string) {
    try {
      let { surveyId, sessionId, isDraft, answers } = bulkSubmitDto;

      // sessionId is now required
      if (!sessionId) {
        throw new ValidationException(
          'Session ID is required when submitting answers',
          [{ field: 'sessionId', message: 'Must provide a valid session ID' }],
        );
      }

      // Validate survey exists
      const survey = await this.surveyRepository.findOne({
        where: { id: surveyId },
      });

      if (!survey) {
        throw new ResourceNotFoundException('Survey', surveyId);
      }

      // Validate session exists and belongs to survey
      const session = await this.sessionRepository.findOne({
        where: { 
          id: sessionId,
          surveyId: surveyId,
          isActive: true 
        },
      });

      if (!session) {
        throw new ValidationException(
          `Session with ID ${sessionId} not found or does not belong to survey ${surveyId}`,
          [{ field: 'sessionId', provided: sessionId, surveyId: surveyId }]
        );
      }

      // Check if user has already completed the survey
      if (!isDraft) {
        const isCompleted = await this.checkSurveyCompletion(surveyId, userId, sessionId);
        if (isCompleted) {
          throw new ConflictException(
            'Survey is already completed. No need to submit again.'
          );
        }
      }

      // Process all answers
      const results = [];
      const errors = [];

      for (const answerData of answers) {
        try {
          const submitDto = {
            questionId: answerData.questionId,
            surveyId: surveyId,
            sessionId: sessionId,
            isDraft: isDraft,
            textAnswer: answerData.textAnswer,
            selectedOptions: answerData.selectedOptions,
            ratingAnswer: answerData.ratingAnswer,
          };

          const result = await this.submitAnswer(submitDto, userId);
          results.push({
            questionId: answerData.questionId,
            success: true,
            data: result,
          });
        } catch (error: any) {
          errors.push({
            questionId: answerData.questionId,
            success: false,
            error: error.message || 'Failed to submit answer',
          });
        }
      }

      return {
        surveyId,
        sessionId,
        sessionInfo: {
          id: session.id,
          name: session.name,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
        },
        totalAnswers: answers.length,
        successCount: results.length,
        errorCount: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
        status: isDraft ? 'answering' : 'answered',
      };
    } catch (error: any) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.errorHandler.logError(error, 'Bulk submit answers');
      this.errorHandler.handleDatabaseError(error, 'Bulk answer submission');
    }
  }

  // GET - User's survey completion summary
  async getUserSurveySummary(surveyId: string, userId: string) {
    try {
      // 1. Validate survey exists
      const survey = await this.surveyRepository.findOne({
        where: { id: surveyId },
      });

      if (!survey) {
        throw new ResourceNotFoundException('Survey', surveyId);
      }

      // 2. Get all active questions for the survey
      const questions = await this.questionRepository.find({
        where: { surveyId, isActive: true, status: QuestionStatus.ACTIVE },
        order: { orderIndex: 'ASC', createdAt: 'ASC' },
      });

      // 3. Get all sessions for the survey
      const sessions = await this.sessionRepository.find({
        where: { surveyId, isActive: true },
        order: { date: 'ASC', startTime: 'ASC' },
      });

      // Create session map for quick lookup
      const sessionMap = new Map(
        sessions.map(session => [session.id, session])
      );

      // 4. Get user's answers for this survey
      const userAnswers = await this.answerRepository.find({
        where: { surveyId, userId, isActive: true },
      });

      // 5. Create answer map for quick lookup
      const answerMap = new Map(
        userAnswers.map(answer => [answer.questionId, answer])
      );

      // 6. Build questions with answer status, session info, and vote counts
      const questionsWithStatus = await Promise.all(
        questions.map(async (question) => {
          const userAnswer = answerMap.get(question.id);
          const answerStatus = userAnswer 
            ? (userAnswer.isAnswered ? 'answered' : 'answering')
            : 'not_answered';

          // Get total vote count for this question
          const totalVotes = await this.answerRepository
            .createQueryBuilder('answer')
            .where('answer.questionId = :questionId', { questionId: question.id })
            .andWhere('answer.isAnswered = :isAnswered', { isAnswered: true })
            .andWhere('answer.isActive = :isActive', { isActive: true })
            .select('COUNT(DISTINCT answer.userId)', 'count')
            .getRawOne();

          const session = sessionMap.get(question.sessionId);

          return {
            id: question.id,
            questionName: question.questionName,
            description: question.description,
            questionType: question.questionType,
            isRequired: question.isRequired,
            orderIndex: question.orderIndex,
            options: question.options,
            minRating: question.minRating,
            maxRating: question.maxRating,
            ratingLabel: question.ratingLabel,
            sessionInfo: session ? {
              id: session.id,
              name: session.name,
              date: session.date,
              startTime: session.startTime,
              endTime: session.endTime,
              description: session.description,
            } : null,
            answerStatus,
            totalVotes: parseInt(totalVotes.count) || 0,
            userHasVoted: answerStatus === 'answered',
            userAnswer: userAnswer ? {
              textAnswer: userAnswer.textAnswer,
              selectedOptions: userAnswer.selectedOptions,
              ratingAnswer: userAnswer.ratingAnswer,
              answeredAt: userAnswer.updatedAt,
            } : null,
          };
        })
      );

      // 7. Get event information
      const event = await this.eventRepository.findOne({
        where: { id: survey.eventId },
      });

      // 8. Calculate statistics
      const totalQuestions = questions.length;
      const answeredQuestions = questionsWithStatus.filter(q => q.answerStatus === 'answered').length;
      const notAnsweredQuestions = questionsWithStatus.filter(q => q.answerStatus === 'not_answered').length;
      const answeringQuestions = questionsWithStatus.filter(q => q.answerStatus === 'answering').length;
      const completionPercentage = totalQuestions > 0 
        ? Math.round((answeredQuestions / totalQuestions) * 100) 
        : 0;

      // 9. Calculate session-wise statistics (only for sessions user has answered or is answering)
      const sessionStats = sessions
        .map(session => {
          const sessionQuestions = questionsWithStatus.filter(q => q.sessionInfo?.id === session.id);
          const sessionAnswered = sessionQuestions.filter(q => q.answerStatus === 'answered').length;
          const sessionAnswering = sessionQuestions.filter(q => q.answerStatus === 'answering').length;
          
          return {
            sessionId: session.id,
            sessionName: session.name,
            date: session.date,
            startTime: session.startTime,
            endTime: session.endTime,
            description: session.description,
            totalQuestions: sessionQuestions.length,
            answeredQuestions: sessionAnswered,
            answeringQuestions: sessionAnswering,
            completionPercentage: sessionQuestions.length > 0 
              ? Math.round((sessionAnswered / sessionQuestions.length) * 100) 
              : 0,
            status: sessionAnswered === sessionQuestions.length ? 'completed' : 
                    (sessionAnswered > 0 || sessionAnswering > 0) ? 'in_progress' : 'not_started',
          };
        })
        .filter(session => session.answeredQuestions > 0 || session.answeringQuestions > 0); // Show sessions where user has answered or is answering

      // 10. Build simplified info object with status
      const info = sessionStats.map(session => ({
        eventId: event?.id || null,
        eventName: event?.name || null,
        startDate: session.date,
        endDate: session.date,
        time: `${session.startTime} - ${session.endTime}`,
        trackTitle: null, // Default null for now
        sessionTitle: session.sessionName,
        url: null, // Default null
        status: session.status,
        answeredQuestions: session.answeredQuestions,
        answeringQuestions: session.answeringQuestions,
        totalQuestions: session.totalQuestions,
        completionPercentage: session.completionPercentage,
      }));

      return {
        info,
        completionStats: {
          totalQuestions,
          answeredQuestions,
          notAnsweredQuestions,
          answeringQuestions,
          completionPercentage,
          isCompleted: answeredQuestions === totalQuestions,
        },
        questions: questionsWithStatus,
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get user survey summary');
      this.errorHandler.handleDatabaseError(error, 'User survey summary');
    }
  }

  // Helper method to check if survey is completed
  private async checkSurveyCompletion(surveyId: string, userId: string, sessionId: string): Promise<boolean> {
    // Get all active questions for the survey
    const totalQuestions = await this.questionRepository.count({
      where: { surveyId, isActive: true, status: QuestionStatus.ACTIVE },
    });

    // Get user's answered questions (not draft) - check by userId only, not sessionId
    // This prevents duplicate submissions even with different sessionIds
    const answeredQuestions = await this.answerRepository
      .createQueryBuilder('answer')
      .where('answer.surveyId = :surveyId', { surveyId })
      .andWhere('answer.userId = :userId', { userId })
      .andWhere('answer.isAnswered = :isAnswered', { isAnswered: true })
      .andWhere('answer.isActive = :isActive', { isActive: true })
      .select('DISTINCT answer.questionId')
      .getRawMany();

    const uniqueAnsweredQuestions = answeredQuestions.length;

    // Survey is complete if all questions are answered
    return uniqueAnsweredQuestions >= totalQuestions && totalQuestions > 0;
  }

  // Helper method to validate answer based on question type
  private validateAnswerByQuestionType(
    question: SurveyQuestion,
    submitAnswerDto: SubmitAnswerDto,
  ): void {
    const { textAnswer, selectedOptions, ratingAnswer } = submitAnswerDto;

    switch (question.questionType) {
      case QuestionType.TEXT:
        if (!textAnswer || textAnswer.trim().length === 0) {
          throw new ValidationException(
            'Text answer is required for text questions',
            [{ field: 'textAnswer', questionType: question.questionType }],
          );
        }
        break;

      case QuestionType.DROPDOWN:
      case QuestionType.RADIO:
        if (!selectedOptions || selectedOptions.length !== 1) {
          throw new ValidationException(
            `${question.questionType} questions require exactly one option selected`,
            [{ field: 'selectedOptions', questionType: question.questionType }],
          );
        }
        // Validate option exists in question's valid options
        if (question.options && question.options.length > 0) {
          if (!question.options.includes(selectedOptions[0])) {
            throw new ValidationException(
              `Selected option "${selectedOptions[0]}" is not a valid option for this question`,
              [{ 
                field: 'selectedOptions', 
                selectedOption: selectedOptions[0],
                validOptions: question.options,
                questionName: question.questionName,
              }],
            );
          }
        }
        break;

      case QuestionType.CHECKBOX:
        if (!selectedOptions || selectedOptions.length === 0) {
          throw new ValidationException(
            'At least one option must be selected for checkbox questions',
            [{ field: 'selectedOptions', questionType: question.questionType }],
          );
        }
        // Validate all selected options exist in question's valid options
        if (question.options && question.options.length > 0) {
          const invalidOptions = selectedOptions.filter(
            opt => !question.options!.includes(opt)
          );
          if (invalidOptions.length > 0) {
            throw new ValidationException(
              `Invalid options selected: ${invalidOptions.join(', ')}. These options are not valid for this question.`,
              [{ 
                field: 'selectedOptions', 
                invalidOptions,
                validOptions: question.options,
                questionName: question.questionName,
              }],
            );
          }
        }
        break;

      case QuestionType.RATING:
        if (ratingAnswer === undefined || ratingAnswer === null) {
          throw new ValidationException(
            'Rating answer is required for rating questions',
            [{ field: 'ratingAnswer', questionType: question.questionType }],
          );
        }
        if (question.minRating && ratingAnswer < question.minRating) {
          throw new ValidationException(
            `Rating must be at least ${question.minRating}. You provided: ${ratingAnswer}`,
            [{ 
              field: 'ratingAnswer', 
              provided: ratingAnswer,
              minRating: question.minRating,
              maxRating: question.maxRating,
            }],
          );
        }
        if (question.maxRating && ratingAnswer > question.maxRating) {
          throw new ValidationException(
            `Rating must not exceed ${question.maxRating}. You provided: ${ratingAnswer}`,
            [{ 
              field: 'ratingAnswer', 
              provided: ratingAnswer,
              minRating: question.minRating,
              maxRating: question.maxRating,
            }],
          );
        }
        break;

      default:
        throw new ValidationException(
          `Unsupported question type: ${question.questionType}`,
          [{ field: 'questionType', provided: question.questionType }],
        );
    }
  }
}
