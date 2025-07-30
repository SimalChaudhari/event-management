// src/polling/polling.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QuizQuestion, QuizOption, UserQuizAttempt, UserQuizAnswer } from './polling.entity';
import { CreateQuizQuestionDto, UpdateQuizQuestionDto, StartQuizDto, SubmitQuizDto } from './polling.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { ResourceNotFoundException, ValidationException } from '../utils/exceptions/custom-exceptions';
import { UserEntity } from 'user/users.entity';
import { Event } from 'event/event.entity';

@Injectable()
export class PollingService {
  constructor(
    @InjectRepository(QuizQuestion)
    private quizQuestionRepository: Repository<QuizQuestion>,
    @InjectRepository(QuizOption)
    private quizOptionRepository: Repository<QuizOption>,
    @InjectRepository(UserQuizAttempt)
    private userQuizAttemptRepository: Repository<UserQuizAttempt>,
    @InjectRepository(UserQuizAnswer)
    private userQuizAnswerRepository: Repository<UserQuizAnswer>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    private errorHandler: ErrorHandlerService,
  ) {}

  // =============== ADMIN QUESTION MANAGEMENT ===============

  async createQuizQuestion(createDto: CreateQuizQuestionDto, createdById: string) {
    try {
      // Validate event exists
      const event = await this.eventRepository.findOne({
        where: { id: createDto.eventId }
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', createDto.eventId);
      }

      // Validate correct answers
      const correctAnswerCount = createDto.options.filter(opt => opt.isCorrectAnswer).length;
      if (correctAnswerCount === 0) {
        throw new ValidationException('At least one correct answer must be specified');
      }
      if (!createDto.allowMultipleSelection && correctAnswerCount > 1) {
        throw new ValidationException('Only one correct answer allowed when multiple selection is disabled');
      }

      // Create question
      const question = new QuizQuestion();
      question.question = createDto.question;
      question.description = createDto.description;
      question.eventId = createDto.eventId;
      question.createdById = createdById;
      question.allowMultipleSelection = createDto.allowMultipleSelection || false;

      const savedQuestion = await this.quizQuestionRepository.save(question);

      // Create options
      const optionPromises = createDto.options.map(async (optionDto) => {
        const option = new QuizOption();
        option.optionText = optionDto.optionText;
        option.questionId = savedQuestion.id;
        option.isCorrectAnswer = optionDto.isCorrectAnswer;
        return await this.quizOptionRepository.save(option);
      });

      const savedOptions = await Promise.all(optionPromises);

      return {
        ...savedQuestion,
        options: savedOptions,
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException || error instanceof ValidationException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Create quiz question');
      this.errorHandler.handleDatabaseError(error, 'Quiz question creation');
    }
  }

  async getAllQuizQuestions() {
    try {
      const questions = await this.quizQuestionRepository.find({
        relations: ['options', 'event', 'createdBy'],
        order: { createdAt: 'DESC' },
      });

      return questions.map(question => ({
        id: question.id,
        question: question.question,
        description: question.description,
        eventId: question.eventId,
        eventName: question.event?.name,
        isActive: question.isActive,
        allowMultipleSelection: question.allowMultipleSelection,
        hasCorrectAnswer: question.hasCorrectAnswer,
        showCorrectAnswer: question.showCorrectAnswer,
        createdAt: question.createdAt,
        createdBy: {
          id: question.createdBy?.id,
          name: `${question.createdBy?.firstName} ${question.createdBy?.lastName}`,
        },
        options: question.options.map(option => ({
          id: option.id,
          optionText: option.optionText,
          isCorrectAnswer: option.isCorrectAnswer,
        })),
        totalOptions: question.options.length,
        correctAnswers: question.options.filter(opt => opt.isCorrectAnswer).length,
      }));
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get all quiz questions');
      this.errorHandler.handleDatabaseError(error, 'Quiz questions retrieval');
    }
  }

  async getQuizQuestionsByEvent(eventId: string) {
    try {
      const questions = await this.quizQuestionRepository.find({
        where: { eventId, isActive: true },
        relations: ['options'],
        order: { createdAt: 'ASC' },
      });

      return questions.map(question => ({
        id: question.id,
        question: question.question,
        description: question.description,
        allowMultipleSelection: question.allowMultipleSelection,
        options: question.options.map(option => ({
          id: option.id,
          optionText: option.optionText,
          // Don't show correct answers when fetching questions for quiz
        })),
      }));
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get quiz questions by event');
      this.errorHandler.handleDatabaseError(error, 'Event quiz questions retrieval');
    }
  }

  async getQuizQuestionById(id: string) {
    try {
      const question = await this.quizQuestionRepository.findOne({
        where: { id },
        relations: ['options', 'event', 'createdBy'],
      });

      if (!question) {
        throw new ResourceNotFoundException('Quiz Question', id);
      }

      return {
        ...question,
        options: question.options.map(option => ({
          id: option.id,
          optionText: option.optionText,
          isCorrectAnswer: option.isCorrectAnswer,
        })),
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get quiz question by ID');
      this.errorHandler.handleDatabaseError(error, 'Quiz question retrieval');
    }
  }

  async updateQuizQuestion(id: string, updateDto: UpdateQuizQuestionDto) {
    try {
      const question = await this.quizQuestionRepository.findOne({
        where: { id },
        relations: ['options'],
      });

      if (!question) {
        throw new ResourceNotFoundException('Quiz Question', id);
      }

      // Validate correct answers if options are being updated
      if (updateDto.options) {
        const correctAnswerCount = updateDto.options.filter(opt => opt.isCorrectAnswer).length;
        if (correctAnswerCount === 0) {
          throw new ValidationException('At least one correct answer must be specified');
        }
        if (updateDto.allowMultipleSelection === false && correctAnswerCount > 1) {
          throw new ValidationException('Only one correct answer allowed when multiple selection is disabled');
        }
      }

      // Update question fields (without options)
      const fieldsToUpdate: any = {};
      if (updateDto.question !== undefined) fieldsToUpdate.question = updateDto.question;
      if (updateDto.description !== undefined) fieldsToUpdate.description = updateDto.description;
      if (updateDto.isActive !== undefined) fieldsToUpdate.isActive = updateDto.isActive;
      if (updateDto.allowMultipleSelection !== undefined) fieldsToUpdate.allowMultipleSelection = updateDto.allowMultipleSelection;

      if (Object.keys(fieldsToUpdate).length > 0) {
        await this.quizQuestionRepository.update({ id }, fieldsToUpdate);
      }

      // Handle options separately if provided
      if (updateDto.options && updateDto.options.length > 0) {
        // First delete existing options
        const existingOptions = await this.quizOptionRepository.find({
          where: { questionId: id }
        });

        if (existingOptions.length > 0) {
          await this.quizOptionRepository.remove(existingOptions);
        }

        // Wait a moment to ensure deletion is complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create new options one by one
        const savedOptions = [];
        for (const optionDto of updateDto.options) {
          const option = new QuizOption();
          option.optionText = optionDto.optionText;
          option.questionId = id;
          option.isCorrectAnswer = optionDto.isCorrectAnswer;
          
          const savedOption = await this.quizOptionRepository.save(option);
          savedOptions.push(savedOption);
        }
      }

      // Return updated question
      return await this.getQuizQuestionById(id);

    } catch (error: any) {
      if (error instanceof ResourceNotFoundException || error instanceof ValidationException) {
        throw error;
      }
      console.error('Update Quiz Question Error:', error);
      this.errorHandler.logError(error, 'Update quiz question');
      this.errorHandler.handleDatabaseError(error, 'Quiz question update');
    }
  }

  async deleteQuizQuestion(id: string) {
    try {
      const question = await this.quizQuestionRepository.findOne({
        where: { id },
        relations: ['options']
      });

      if (!question) {
        throw new ResourceNotFoundException('Quiz Question', id);
      }

      // Use transaction to ensure all deletions happen atomically
      return await this.quizQuestionRepository.manager.transaction(async manager => {
        
        // 1. Delete all user answers related to this question
        const userAnswersToDelete = await manager.find(UserQuizAnswer, {
          where: { questionId: id }
        });
        
        if (userAnswersToDelete.length > 0) {
          await manager.remove(UserQuizAnswer, userAnswersToDelete);
          console.log(`Deleted ${userAnswersToDelete.length} user answers for question ${id}`);
        }

        // 2. Find and update quiz attempts that included this question
        const affectedAttempts = await manager
          .createQueryBuilder(UserQuizAttempt, 'attempt')
          .innerJoin(UserQuizAnswer, 'answer', 'answer.attemptId = attempt.id')
          .where('answer.questionId = :questionId', { questionId: id })
          .getMany();

        // Update attempt statistics for affected attempts
        for (const attempt of affectedAttempts) {
          const remainingAnswers = await manager.find(UserQuizAnswer, {
            where: { attemptId: attempt.id }
          });
          
          const correctAnswers = remainingAnswers.filter(answer => answer.isCorrect).length;
          const totalAnswers = remainingAnswers.length;
          
          attempt.answeredQuestions = totalAnswers;
          attempt.correctAnswers = correctAnswers;
          attempt.totalQuestions = Math.max(0, attempt.totalQuestions - 1);
          attempt.scorePercentage = attempt.totalQuestions > 0 ? 
            Math.round((correctAnswers / attempt.totalQuestions) * 100) : 0;
          
          await manager.save(UserQuizAttempt, attempt);
        }

        // 3. Delete all options (cascade should handle this, but doing explicitly for safety)
        const optionsToDelete = await manager.find(QuizOption, {
          where: { questionId: id }
        });
        
        if (optionsToDelete.length > 0) {
          await manager.remove(QuizOption, optionsToDelete);
          console.log(`Deleted ${optionsToDelete.length} options for question ${id}`);
        }

        // 4. Finally delete the question itself
        await manager.remove(QuizQuestion, question);
        console.log(`Deleted question ${id}`);

        return { 
          message: 'Quiz question and all related data deleted successfully',
          deletedData: {
            question: 1,
            options: optionsToDelete.length,
            userAnswers: userAnswersToDelete.length,
            affectedAttempts: affectedAttempts.length
          }
        };
      });

    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      console.error('Delete Quiz Question Error:', error);
      this.errorHandler.logError(error, 'Delete quiz question');
      this.errorHandler.handleDatabaseError(error, 'Quiz question deletion');
    }
  }

  // Additional method: Delete all questions for an event
  async deleteAllQuizQuestionsForEvent(eventId: string) {
    try {
      const questions = await this.quizQuestionRepository.find({
        where: { eventId }
      });

      if (questions.length === 0) {
        return { message: 'No questions found for this event' };
      }

      let totalDeleted = {
        questions: 0,
        options: 0,
        userAnswers: 0,
        affectedAttempts: 0
      };

      // Delete each question (which will trigger cascade deletes)
      for (const question of questions) {
        const result = await this.deleteQuizQuestion(question.id);
        if (result.deletedData) {
          totalDeleted.questions += result.deletedData.question;
          totalDeleted.options += result.deletedData.options;
          totalDeleted.userAnswers += result.deletedData.userAnswers;
          totalDeleted.affectedAttempts += result.deletedData.affectedAttempts;
        }
      }

      return {
        message: `All quiz questions for event deleted successfully`,
        deletedData: totalDeleted
      };

    } catch (error: any) {
      console.error('Delete All Quiz Questions Error:', error);
      this.errorHandler.logError(error, 'Delete all quiz questions for event');
      this.errorHandler.handleDatabaseError(error, 'Bulk quiz question deletion');
    }
  }

  // =============== USER QUIZ FUNCTIONALITY ===============

  async startQuiz(startQuizDto: StartQuizDto, userId: string) {
    try {
      // Check if event exists
      const event = await this.eventRepository.findOne({
        where: { id: startQuizDto.eventId }
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', startQuizDto.eventId);
      }

      // Check if user already has a completed attempt
      const completedAttempt = await this.userQuizAttemptRepository.findOne({
        where: { 
          eventId: startQuizDto.eventId, 
          userId, 
          isCompleted: true 
        }
      });

      if (completedAttempt) {
        throw new ValidationException('You have already completed this quiz');
      }

      // Check if user has an incomplete attempt
      const existingAttempt = await this.userQuizAttemptRepository.findOne({
        where: { 
          eventId: startQuizDto.eventId, 
          userId, 
          isCompleted: false 
        }
      });

      if (existingAttempt) {
        // Return existing attempt with questions
        return await this.getQuizForUser(startQuizDto.eventId, existingAttempt.id);
      }

      // Get all questions for this event
      const questions = await this.getQuizQuestionsByEvent(startQuizDto.eventId);

      if (questions.length === 0) {
        throw new ValidationException('No active questions found for this event');
      }

      // Create new attempt
      const attempt = new UserQuizAttempt();
      attempt.eventId = startQuizDto.eventId;
      attempt.userId = userId;
      attempt.totalQuestions = questions.length;

      const savedAttempt = await this.userQuizAttemptRepository.save(attempt);

      return {
        attemptId: savedAttempt.id,
        eventId: startQuizDto.eventId,
        eventName: event.name,
        totalQuestions: questions.length,
        isCompleted: false,
        questions: questions
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException || error instanceof ValidationException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Start quiz');
      this.errorHandler.handleDatabaseError(error, 'Quiz start');
    }
  }

  async submitQuiz(submitQuizDto: SubmitQuizDto, userId: string) {
    try {
      // Get active attempt
      const attempt = await this.userQuizAttemptRepository.findOne({
        where: { 
          eventId: submitQuizDto.eventId, 
          userId, 
          isCompleted: false 
        }
      });

      if (!attempt) {
        throw new ValidationException('No active quiz attempt found. Please start the quiz first.');
      }

      // Get all questions for validation
      const questions = await this.quizQuestionRepository.find({
        where: { eventId: submitQuizDto.eventId, isActive: true },
        relations: ['options']
      });

      // Validate all questions are answered
      const questionIds = questions.map(q => q.id);
      const answeredQuestionIds = submitQuizDto.answers.map(a => a.questionId);
      const missingQuestions = questionIds.filter(qId => !answeredQuestionIds.includes(qId));

      if (missingQuestions.length > 0) {
        throw new ValidationException(`Please answer all questions. Missing: ${missingQuestions.length} questions`);
      }

      let correctAnswersCount = 0;

      // Process each answer
      const answerPromises = submitQuizDto.answers.map(async (answerDto) => {
        const question = questions.find(q => q.id === answerDto.questionId);
        if (!question) {
          throw new ValidationException(`Invalid question ID: ${answerDto.questionId}`);
        }

        // Validate option IDs
        const validOptionIds = question.options.map(opt => opt.id);
        const invalidOptions = answerDto.selectedOptionIds.filter(optId => !validOptionIds.includes(optId));
        if (invalidOptions.length > 0) {
          throw new ValidationException(`Invalid option IDs for question: ${invalidOptions.join(', ')}`);
        }

        // Check if answer is correct
        const correctOptionIds = question.options
          .filter(opt => opt.isCorrectAnswer)
          .map(opt => opt.id);
        
        const isCorrect = correctOptionIds.length === answerDto.selectedOptionIds.length &&
                         correctOptionIds.every(optId => answerDto.selectedOptionIds.includes(optId));

        if (isCorrect) {
          correctAnswersCount++;
        }

        // Save answer
        const userAnswer = new UserQuizAnswer();
        userAnswer.attemptId = attempt.id;
        userAnswer.questionId = answerDto.questionId;
        userAnswer.selectedOptionIds = answerDto.selectedOptionIds;
        userAnswer.isCorrect = isCorrect;

        return await this.userQuizAnswerRepository.save(userAnswer);
      });

      await Promise.all(answerPromises);

      // Update attempt as completed
      attempt.isCompleted = true;
      attempt.completedAt = new Date();
      attempt.answeredQuestions = submitQuizDto.answers.length;
      attempt.correctAnswers = correctAnswersCount;
      attempt.scorePercentage = questions.length > 0 ? 
        Math.round((correctAnswersCount / questions.length) * 100) : 0;

      await this.userQuizAttemptRepository.save(attempt);

      // Return results
      return await this.getQuizResults(attempt.id);
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException || error instanceof ValidationException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Submit quiz');
      this.errorHandler.handleDatabaseError(error, 'Quiz submission');
    }
  }

  async getQuizResults(attemptId: string) {
    try {
      const attempt = await this.userQuizAttemptRepository.findOne({
        where: { id: attemptId },
        relations: ['answers', 'event', 'user']
      });

      if (!attempt) {
        throw new ResourceNotFoundException('Quiz Attempt', attemptId);
      }

      // Get questions with answers
      const questions = await this.quizQuestionRepository.find({
        where: { eventId: attempt.eventId, isActive: true },
        relations: ['options'],
        order: { createdAt: 'ASC' }
      });

      const questionResults = questions.map(question => {
        const userAnswer = attempt.answers.find(a => a.questionId === question.id);
        const selectedOptions = userAnswer ? 
          question.options.filter(opt => userAnswer.selectedOptionIds.includes(opt.id)) : [];
        const correctOptions = question.options.filter(opt => opt.isCorrectAnswer);

        return {
          questionId: question.id,
          question: question.question,
          description: question.description,
          userAnswer: userAnswer ? {
            selectedOptions: selectedOptions.map(opt => ({
              id: opt.id,
              optionText: opt.optionText
            })),
            isCorrect: userAnswer.isCorrect,
            answeredAt: userAnswer.answeredAt
          } : null,
          correctAnswer: {
            correctOptions: correctOptions.map(opt => ({
              id: opt.id,
              optionText: opt.optionText
            }))
          },
          allOptions: question.options.map(opt => ({
            id: opt.id,
            optionText: opt.optionText,
            isCorrect: opt.isCorrectAnswer,
            isSelected: userAnswer ? userAnswer.selectedOptionIds.includes(opt.id) : false
          }))
        };
      });

      return {
        attempt: {
          id: attempt.id,
          eventId: attempt.eventId,
          eventName: attempt.event?.name,
          userId: attempt.userId,
          userName: `${attempt.user?.firstName} ${attempt.user?.lastName}`,
          isCompleted: attempt.isCompleted,
          completedAt: attempt.completedAt,
        },
        summary: {
          totalQuestions: attempt.totalQuestions,
          answeredQuestions: attempt.answeredQuestions,
          correctAnswers: attempt.correctAnswers,
          scorePercentage: attempt.scorePercentage,
          grade: this.calculateGrade(attempt.scorePercentage),
        },
        questionResults,
        completedAt: attempt.completedAt,
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get quiz results');
      this.errorHandler.handleDatabaseError(error, 'Quiz results retrieval');
    }
  }

  // Helper methods
  private async getQuizForUser(eventId: string, attemptId: string) {
    const questions = await this.getQuizQuestionsByEvent(eventId);
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    
    return {
      attemptId: attemptId,
      eventId: eventId,
      eventName: event?.name,
      totalQuestions: questions.length,
      isCompleted: false,
      questions: questions
    };
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }
} 