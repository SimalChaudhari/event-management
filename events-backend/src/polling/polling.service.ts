// src/polling/polling.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { QuizQuestion, QuizOption, UserQuizAttempt, UserQuizAnswer } from './polling.entity';
import { CreateQuizQuestionDto, UpdateQuizQuestionDto, SubmitAnswerDto } from './polling.dto';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { ResourceNotFoundException, ValidationException } from '../utils/exceptions/custom-exceptions';
import { Event } from 'event/event.entity';
import { Speaker } from 'speaker/speaker.entity';
import {  Not, In } from 'typeorm';
import { PollType, ExternalPlatform } from './polling.entity';

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
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Speaker)
    private speakerRepository: Repository<Speaker>,
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

      // Speaker validation
      if (createDto.speakerId) {
        const speaker = await this.speakerRepository.findOne({
          where: { id: createDto.speakerId }
        });
        if (!speaker) {
          throw new ResourceNotFoundException('Speaker', createDto.speakerId);
        }
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
      question.speakerId = createDto.speakerId; // नया field
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

  async getQuizQuestionById(id: string) {
    try {
      const question = await this.quizQuestionRepository.findOne({
        where: { id },
        relations: ['options', 'event', 'createdBy', 'speaker'], // speaker relation add करें
      });

      if (!question) {
        throw new ResourceNotFoundException('Quiz Question', id);
      }

      return {
        id: question.id,
        question: question.question,
        description: question.description,
        eventId: question.eventId,
        eventName: question.event?.name,
        speakerId: question.speakerId,
        speakerInfo: question.speaker ? {
          id: question.speaker.id,
          name: question.speaker.name,
          companyName: question.speaker.companyName,
          position: question.speaker.position,
          email: question.speaker.email,
          mobile: question.speaker.mobile,
          location: question.speaker.location,
          description: question.speaker.description,
          speakerProfile: question.speaker.speakerProfile,
        } : null,
        isActive: question.isActive,
        allowMultipleSelection: question.allowMultipleSelection,
        hasCorrectAnswer: question.hasCorrectAnswer,
        showCorrectAnswer: question.showCorrectAnswer,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        createdBy: {
          id: question.createdBy?.id,
          name: `${question.createdBy?.firstName} ${question.createdBy?.lastName}`,
        },
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

      // Speaker validation add करें
      if (updateDto.speakerId !== undefined) {
        if (updateDto.speakerId) {
          const speaker = await this.speakerRepository.findOne({
            where: { id: updateDto.speakerId }
          });
          if (!speaker) {
            throw new ResourceNotFoundException('Speaker', updateDto.speakerId);
          }
        }
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

      // Update question fields (with speakerId)
      const fieldsToUpdate: any = {};
      if (updateDto.question !== undefined) fieldsToUpdate.question = updateDto.question;
      if (updateDto.description !== undefined) fieldsToUpdate.description = updateDto.description;
      if (updateDto.isActive !== undefined) fieldsToUpdate.isActive = updateDto.isActive;
      if (updateDto.allowMultipleSelection !== undefined) fieldsToUpdate.allowMultipleSelection = updateDto.allowMultipleSelection;
      if (updateDto.speakerId !== undefined) fieldsToUpdate.speakerId = updateDto.speakerId; // नया field

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

      // Return updated question with speaker info
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

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }

  // =============== USER QUIZ RESULTS APIs ===============

  async getUserQuizResultBySpeakerAndEvent(userId: string, speakerId: string, eventId: string) {
    try {
      // Get quiz attempt for specific user, speaker, and event
      const attempt = await this.userQuizAttemptRepository.findOne({
        where: { 
          userId, 
          speakerId, 
          eventId 
        },
        relations: ['answers', 'event', 'speaker', 'user'],
        order: { createdAt: 'DESC' } // Get latest attempt if multiple
      });

      if (!attempt) {
        return {
          hasAttempt: false,
          message: 'No quiz attempt found for this user, speaker, and event'
        };
      }

      // Get all questions for this speaker and event
      const allQuestions = await this.quizQuestionRepository.find({
        where: { 
          eventId, 
          speakerId, 
          isActive: true 
        },
        relations: ['options'],
        order: { createdAt: 'ASC' }
      });

      // Map questions with user answers
      const questionsDetails = allQuestions.map(question => {
        const userAnswer = attempt.answers.find(a => a.questionId === question.id);
        const correctOptions = question.options.filter(opt => opt.isCorrectAnswer);
        const selectedOptions = userAnswer ? 
          question.options.filter(opt => userAnswer.selectedOptionIds.includes(opt.id)) : [];

        return {
          questionId: question.id,
          question: question.question,
          description: question.description,
          options: question.options.map(option => ({
            id: option.id,
            optionText: option.optionText,
            isCorrect: option.isCorrectAnswer,
            isSelected: userAnswer ? userAnswer.selectedOptionIds.includes(option.id) : false,
          })),
          userAnswer: userAnswer ? {
            selectedOptions: selectedOptions.map(opt => ({
              id: opt.id,
              optionText: opt.optionText,
            })),
            isCorrect: userAnswer.isCorrect,
            answeredAt: userAnswer.answeredAt,
          } : null,
          correctAnswer: {
            correctOptions: correctOptions.map(opt => ({
              id: opt.id,
              optionText: opt.optionText,
            })),
          },
          status: userAnswer ? (userAnswer.isCorrect ? 'Correct' : 'Wrong') : 'Not Answered',
        };
      });

      return {
        hasAttempt: true,
        attempt: {
          id: attempt.id,
          isCompleted: attempt.isCompleted,
          startedAt: attempt.createdAt,
          completedAt: attempt.completedAt,
        },
        user: {
          id: attempt.user?.id,
          name: `${attempt.user?.firstName} ${attempt.user?.lastName}`,
          email: attempt.user?.email
        },
        event: {
          id: attempt.event?.id,
          name: attempt.event?.name,
        },
        speaker: {
          id: attempt.speaker?.id,
          name: attempt.speaker?.name,
          companyName: attempt.speaker?.companyName,
          position: attempt.speaker?.position,
          email: attempt.speaker?.email,
          mobile: attempt.speaker?.mobile,
          speakerProfile: attempt.speaker?.speakerProfile,
        },
        performance: {
          totalQuestions: attempt.totalQuestions,
          answeredQuestions: attempt.answeredQuestions,
          correctAnswers: attempt.correctAnswers,
          wrongAnswers: attempt.answeredQuestions - attempt.correctAnswers,
          unanswered: attempt.totalQuestions - attempt.answeredQuestions,
          scorePercentage: attempt.scorePercentage,
          grade: this.calculateGrade(attempt.scorePercentage),
          scoreText: `${attempt.correctAnswers}/${attempt.totalQuestions}`,
        },
        questionsDetails: questionsDetails,
        summary: {
          quizType: "Speaker Quiz",
          status: attempt.isCompleted ? 'Completed' : 'In Progress',
          timeTaken: attempt.completedAt && attempt.createdAt ? 
            Math.round((new Date(attempt.completedAt).getTime() - new Date(attempt.createdAt).getTime()) / 60000) + ' minutes' : null,
        }
      };

    } catch (error: any) {
      this.errorHandler.logError(error, 'Get user quiz result by speaker and event');
      this.errorHandler.handleDatabaseError(error, 'User quiz result retrieval');
    }
  }

  async getAllUsersQuizResultsBySpeakerAndEvent(speakerId: string, eventId: string) {
  try {
    // Get all quiz attempts for specific speaker and event
    const attempts = await this.userQuizAttemptRepository.find({
      where: { 
        speakerId, 
        eventId 
      },
      relations: ['answers', 'event', 'speaker', 'user'],
      order: { createdAt: 'DESC' }
    });

    if (attempts.length === 0) {
      return {
        hasResults: false,
        message: 'No quiz attempts found for this speaker and event',
        speakerInfo: null,
        eventInfo: null,
        totalUsers: 0,
        completedAttempts: 0,
        inProgressAttempts: 0,
        results: []
      };
    }

    // Get speaker and event info from first attempt
    const firstAttempt = attempts[0];
    
    const speakerInfo = firstAttempt.speaker ? {
      id: firstAttempt.speaker.id,
      name: firstAttempt.speaker.name,
      companyName: firstAttempt.speaker.companyName,
      position: firstAttempt.speaker.position,
      email: firstAttempt.speaker.email,
      mobile: firstAttempt.speaker.mobile,
      speakerProfile: firstAttempt.speaker.speakerProfile,
    } : null;

    const eventInfo = firstAttempt.event ? {
      id: firstAttempt.event.id,
      name: firstAttempt.event.name,
    } : null;

    // Map all user results
    const results = attempts.map(attempt => ({
      user: {
        id: attempt.user?.id,
        name: `${attempt.user?.firstName} ${attempt.user?.lastName}`,
        email: attempt.user?.email
      },
      attempt: {
        id: attempt.id,
        isCompleted: attempt.isCompleted,
        startedAt: attempt.createdAt,
        completedAt: attempt.completedAt,
      },
      performance: {
        totalQuestions: attempt.totalQuestions,
        answeredQuestions: attempt.answeredQuestions,
        correctAnswers: attempt.correctAnswers,
        wrongAnswers: attempt.answeredQuestions - attempt.correctAnswers,
        unanswered: attempt.totalQuestions - attempt.answeredQuestions,
        scorePercentage: attempt.scorePercentage,
        grade: this.calculateGrade(attempt.scorePercentage),
        scoreText: `${attempt.correctAnswers}/${attempt.totalQuestions}`,
      },
      status: attempt.isCompleted ? 'Completed' : 'In Progress',
      timeTaken: attempt.completedAt && attempt.createdAt ? 
        Math.round((new Date(attempt.completedAt).getTime() - new Date(attempt.createdAt).getTime()) / 60000) + ' minutes' : null,
    }));

    // Calculate summary statistics
    const completedAttempts = attempts.filter(a => a.isCompleted);
    const totalScore = completedAttempts.reduce((sum, a) => sum + a.scorePercentage, 0);
    const averageScore = completedAttempts.length > 0 ? Math.round(totalScore / completedAttempts.length) : 0;
    const highestScore = completedAttempts.length > 0 ? Math.max(...completedAttempts.map(a => a.scorePercentage)) : 0;
    const lowestScore = completedAttempts.length > 0 ? Math.min(...completedAttempts.map(a => a.scorePercentage)) : 0;

    return {
      hasResults: true,
      speakerInfo,
      eventInfo,
      totalUsers: attempts.length,
      completedAttempts: completedAttempts.length,
      inProgressAttempts: attempts.length - completedAttempts.length,
      summary: {
        averageScore,
        highestScore,
        lowestScore,
        averageGrade: this.calculateGrade(averageScore),
        passedUsers: completedAttempts.filter(a => a.scorePercentage >= 60).length,
        failedUsers: completedAttempts.filter(a => a.scorePercentage < 60).length,
      },
      results: results.sort((a, b) => b.performance.scorePercentage - a.performance.scorePercentage) // Sort by score descending
    };

  } catch (error: any) {
    this.errorHandler.logError(error, 'Get all users quiz results by speaker and event');
    return {
      hasResults: false,
      message: 'Error retrieving quiz results',
      speakerInfo: null,
      eventInfo: null,
      totalUsers: 0,
      completedAttempts: 0,
      inProgressAttempts: 0,
      results: []
    };
  }
}

  // =============== SIMPLIFIED QUIZ APIs ===============
  async getQuizForSpeaker(speakerId: string, eventId: string, userId: string) {
    try {
      // Validate event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId }
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', eventId);
      }

      // Validate speaker exists
      const speaker = await this.speakerRepository.findOne({
        where: { id: speakerId }
      });
      if (!speaker) {
        throw new ResourceNotFoundException('Speaker', speakerId);
      }

      // Check if user has existing incomplete attempt
      let attempt = await this.userQuizAttemptRepository.findOne({
        where: { 
          eventId, 
          speakerId, 
          userId, 
          isCompleted: false 
        },
        relations: ['answers']
      });

      // If no attempt, create new one
      if (!attempt) {
        attempt = await this.createNewAttempt(eventId, speakerId, userId);
      }

      // Get current question
      const currentQuestion = await this.getCurrentQuestionForAttempt(attempt);

      if (!currentQuestion) {
        throw new ValidationException('No questions available for this speaker');
      }

      // Get progress
      const progress = await this.getQuizProgress(attempt);

      return {
        attemptId: attempt.id,
        speaker: {
          name: speaker.name,
          company: speaker.companyName,
          position: speaker.position,
          profile: speaker.speakerProfile
        },
        currentQuestion,
        progress
      };

    } catch (error: any) {
      if (error instanceof ResourceNotFoundException || error instanceof ValidationException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Get quiz for speaker');
      this.errorHandler.handleDatabaseError(error, 'Speaker quiz retrieval');
    }
  }

  async submitAnswerAndGetNext(submitDto: SubmitAnswerDto, userId: string) {
    try {
      // Early validation
      if (!submitDto.attemptId) {
        throw new ValidationException('attemptId is required');
      }

      if (!submitDto.questionId) {
        throw new ValidationException('questionId is required');
      }

      if (!Array.isArray(submitDto.selectedOptions)) {
        throw new ValidationException('selectedOptions must be an array');
      }

      if (submitDto.selectedOptions.length === 0) {
        throw new ValidationException('At least one option must be selected');
      }

      // Get attempt with current answers
      const attempt = await this.userQuizAttemptRepository.findOne({
        where: { 
          id: submitDto.attemptId, 
          userId, 
          isCompleted: false 
        },
        relations: ['answers']
      });

      if (!attempt) {
        throw new ResourceNotFoundException('Active Quiz Attempt', submitDto.attemptId);
      }

      // Validate question
      const question = await this.quizQuestionRepository.findOne({
        where: { 
          id: submitDto.questionId,
          eventId: attempt.eventId,
          speakerId: attempt.speakerId,
          isActive: true 
        },
        relations: ['options']
      });

      if (!question) {
        throw new ResourceNotFoundException('Quiz Question', submitDto.questionId);
      }

      // Validate options
      const validOptionIds = question.options.map(opt => opt.id);
      const invalidOptions = submitDto.selectedOptions.filter(optId => !validOptionIds.includes(optId));
      
      if (invalidOptions.length > 0) {
        throw new ValidationException(`Invalid option IDs: ${invalidOptions.join(', ')}`);
      }

      // ✅ SAVE CURRENT ANSWER FIRST
      await this.saveQuizAnswer(submitDto, question);

      // ✅ NOW CHECK IF QUIZ IS COMPLETE
      // Get updated attempt with all answers including the one we just saved
      const updatedAttempt = await this.userQuizAttemptRepository.findOne({
        where: { id: submitDto.attemptId },
        relations: ['answers']
      });

      // ✅ FIX: Add null check
      if (!updatedAttempt) {
        throw new ResourceNotFoundException('Quiz Attempt', submitDto.attemptId);
      }

      // Get total questions for this speaker
      const totalQuestions = await this.quizQuestionRepository.count({
        where: { 
          eventId: attempt.eventId,
          speakerId: attempt.speakerId,
          isActive: true 
        }
      });

      const answeredQuestions = updatedAttempt.answers.length;

      // ✅ CHECK IF ALL QUESTIONS ARE ANSWERED
      if (answeredQuestions >= totalQuestions) {
        // Quiz is complete - don't try to get next question
        const finalResult = await this.completeQuizAutomatically(updatedAttempt);
        
        return {
          saved: true,
          nextQuestion: null,
          isLastQuestion: true,
          completed: true,
          score: finalResult.score,
          progress: finalResult.progress
        };
      }

      // ✅ GET NEXT QUESTION ONLY IF QUIZ IS NOT COMPLETE
      const nextQuestion = await this.getNextQuestionForAttempt(updatedAttempt);
      
      // ✅ FIX: Use existing getQuizProgress method
      const progress = await this.getQuizProgress(updatedAttempt);

      if (!nextQuestion) {
        // No more questions but total count says there should be more
        // Complete anyway
        const finalResult = await this.completeQuizAutomatically(updatedAttempt);
        
        return {
          saved: true,
          nextQuestion: null,
          isLastQuestion: true,
          completed: true,
          score: finalResult.score,
          progress: finalResult.progress
        };
      }

      return {
        saved: true,
        nextQuestion,
        progress,
        isLastQuestion: (answeredQuestions + 1) >= totalQuestions,
        completed: false
      };

    } catch (error: any) {
      if (error instanceof ResourceNotFoundException || error instanceof ValidationException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Submit answer and get next');
      this.errorHandler.handleDatabaseError(error, 'Answer submission');
    }
  }

  // =============== HELPER METHODS ===============

  private async createNewAttempt(eventId: string, speakerId: string, userId: string) {
    try {
      // Count total questions for this speaker
      const totalQuestions = await this.quizQuestionRepository.count({
        where: { eventId, speakerId, isActive: true }
      });

      if (totalQuestions === 0) {
        throw new ValidationException('No active questions found for this speaker');
      }

      // Create new attempt
      const attempt = new UserQuizAttempt();
      attempt.eventId = eventId;
      attempt.speakerId = speakerId;
      attempt.userId = userId;
      attempt.totalQuestions = totalQuestions;
      attempt.answeredQuestions = 0;
      attempt.correctAnswers = 0;
      attempt.scorePercentage = 0;

      return await this.userQuizAttemptRepository.save(attempt);

    } catch (error: any) {
      this.errorHandler.logError(error, 'Create new attempt');
      throw error;
    }
  }

  private async getCurrentQuestionForAttempt(attempt: UserQuizAttempt) {
    try {
      // Get all answered question IDs
      const answeredQuestionIds = attempt.answers?.map(a => a.questionId) || [];
      
      // Find first unanswered question
      const question = await this.quizQuestionRepository.findOne({
        where: { 
          eventId: attempt.eventId,
          speakerId: attempt.speakerId,
          isActive: true,
          ...(answeredQuestionIds.length > 0 ? { id: Not(In(answeredQuestionIds)) } : {})
        },
        relations: ['options'],
        order: { createdAt: 'ASC' }
      });

      if (!question) return null;

      return {
        id: question.id,
        text: question.question,
        description: question.description,
        allowMultiple: question.allowMultipleSelection,
        options: question.options.map(opt => ({
          id: opt.id,
          text: opt.optionText
        }))
      };

    } catch (error: any) {
      this.errorHandler.logError(error, 'Get current question for attempt');
      return null;
    }
  }

  private async getNextQuestionForAttempt(attempt: UserQuizAttempt) {
    try {
      // Refresh attempt to get latest answers
      const updatedAttempt = await this.userQuizAttemptRepository.findOne({
        where: { id: attempt.id },
        relations: ['answers']
      });

      if (!updatedAttempt) return null;

      return await this.getCurrentQuestionForAttempt(updatedAttempt);

    } catch (error: any) {
      this.errorHandler.logError(error, 'Get next question for attempt');
      return null;
    }
  }

  private async saveQuizAnswer(submitDto: SubmitAnswerDto, question: QuizQuestion) {
    try {
      // ✅ Validate inputs
      if (!submitDto.attemptId || !submitDto.questionId) {
        throw new ValidationException('attemptId and questionId are required');
      }

      // Check if answer already exists
      let userAnswer = await this.userQuizAnswerRepository.findOne({
        where: { 
          attemptId: submitDto.attemptId,
          questionId: submitDto.questionId
        }
      });

      // Calculate if answer is correct
      const correctOptionIds = question.options
        .filter(opt => opt.isCorrectAnswer)
        .map(opt => opt.id);
      
      const isCorrect = correctOptionIds.length === submitDto.selectedOptions.length &&
                       correctOptionIds.every(optId => submitDto.selectedOptions.includes(optId));

      if (userAnswer) {
        // Update existing answer
        userAnswer.selectedOptionIds = submitDto.selectedOptions;
        userAnswer.isCorrect = isCorrect;
        userAnswer.answeredAt = new Date();
        await this.userQuizAnswerRepository.save(userAnswer);
      } else {
        // ✅ Create new answer using create method for safety
        const newAnswer = this.userQuizAnswerRepository.create({
          attemptId: submitDto.attemptId,
          questionId: submitDto.questionId,
          selectedOptionIds: submitDto.selectedOptions,
          isCorrect: isCorrect
        });
        
        await this.userQuizAnswerRepository.save(newAnswer);
      }

    } catch (error: any) {
      console.error('❌ Error saving quiz answer:', error);
      throw new ValidationException(`Failed to save answer: ${error.message}`);
    }
  }

  private async getQuizProgress(attempt: UserQuizAttempt) {
    try {
      const answeredCount = attempt.answers?.length || 0;
      const totalQuestions = attempt.totalQuestions || 0;
      
      return {
        current: answeredCount + 1,
        total: totalQuestions,
        answered: answeredCount,
        remaining: Math.max(0, totalQuestions - answeredCount)
      };
    } catch (error: any) {
      return {
        current: 1,
        total: attempt.totalQuestions || 0,
        answered: 0,
        remaining: attempt.totalQuestions || 0
      };
    }
  }

  private async completeQuizAutomatically(attempt: UserQuizAttempt) {
    try {
      // Get all answers for final calculation
      const allAnswers = await this.userQuizAnswerRepository.find({
        where: { attemptId: attempt.id }
      });

      const correctAnswers = allAnswers.filter(a => a.isCorrect).length;
      const totalQuestions = attempt.totalQuestions;
      const answeredQuestions = allAnswers.length;
      
      // ✅ Calculate percentage safely
      const percentage = totalQuestions > 0 ? 
        Math.round((correctAnswers / totalQuestions) * 100) : 0;
      
      // Update attempt as completed
      await this.userQuizAttemptRepository.update(
        { id: attempt.id },
        {
          isCompleted: true,
          completedAt: new Date(),
          answeredQuestions: answeredQuestions,
          correctAnswers: correctAnswers,
          scorePercentage: percentage
        }
      );

      return {
        score: {
          correct: correctAnswers,
          total: totalQuestions,
          answered: answeredQuestions,
          percentage: percentage,
          grade: this.calculateGrade(percentage)
        },
        progress: {
          current: totalQuestions,
          total: totalQuestions,
          answered: answeredQuestions,
          remaining: 0
        }
      };

    } catch (error: any) {
      console.error('❌ Error completing quiz:', error);
      throw new ValidationException(`Failed to complete quiz: ${error.message}`);
    }
  }

  // Create External Poll
  async createExternalPoll(createDto: {
    question: string;
    description?: string;
    externalUrl: string;
    platform: ExternalPlatform;
    eventId: string;
    speakerId?: string;
    createdById: string;
  }) {
    try {
      // Validate event exists
      const event = await this.eventRepository.findOne({
        where: { id: createDto.eventId }
      });
      if (!event) {
        throw new ResourceNotFoundException('Event', createDto.eventId);
      }

      // Speaker validation
      if (createDto.speakerId) {
        const speaker = await this.speakerRepository.findOne({
          where: { id: createDto.speakerId }
        });
        if (!speaker) {
          throw new ResourceNotFoundException('Speaker', createDto.speakerId);
        }
      }

      // Create external poll question
      const question = new QuizQuestion();
      question.question = createDto.question;
      question.description = createDto.description;
      question.eventId = createDto.eventId;
      question.speakerId = createDto.speakerId;
      question.createdById = createDto.createdById;
      question.pollType = PollType.EXTERNAL;
      question.externalUrl = createDto.externalUrl;
      question.platform = createDto.platform;
      question.allowMultipleSelection = false; // Not applicable for external
      question.hasCorrectAnswer = false; // External platform handles this
      question.showCorrectAnswer = false;

      const savedQuestion = await this.quizQuestionRepository.save(question);

      return {
        ...savedQuestion,
        options: [], // External polls don't have options in our system
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException || error instanceof ValidationException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Create external poll');
      this.errorHandler.handleDatabaseError(error, 'External poll creation');
    }
  }

  // Get Mixed Polls (Internal + External) by Speaker and Event
  async getMixedPollsBySpeakerAndEvent(speakerId: string, eventId: string) {
    try {
      const questions = await this.quizQuestionRepository.find({
        where: { 
          speakerId: speakerId,
          eventId: eventId 
        },
        relations: ['options', 'event', 'createdBy', 'speaker'],
        order: { createdAt: 'DESC' },
      });

      // If no questions found, return empty structure
      if (!questions || questions.length === 0) {
        return {
          speakerInfo: null,
          eventInfo: null,
          totalPolls: 0,
          internalPolls: 0,
          externalPolls: 0,
          polls: []
        };
      }

      // Speaker and event info from first question
      const firstQuestion = questions[0];
      
      const speakerInfo = firstQuestion.speaker ? {
        id: firstQuestion.speaker.id,
        name: firstQuestion.speaker.name,
        companyName: firstQuestion.speaker.companyName,
        position: firstQuestion.speaker.position,
        email: firstQuestion.speaker.email,
        mobile: firstQuestion.speaker.mobile,
        location: firstQuestion.speaker.location,
        speakerProfile: firstQuestion.speaker.speakerProfile,
      } : null;

      const eventInfo = firstQuestion.event ? {
        id: firstQuestion.event.id,
        name: firstQuestion.event.name,
      } : null;

      // Separate internal and external polls
      const internalPolls = questions.filter(q => q.pollType === PollType.INTERNAL);
      const externalPolls = questions.filter(q => q.pollType === PollType.EXTERNAL);

      // Format polls data
      const pollsData = questions.map(question => {
        const baseData = {
          id: question.id,
          question: question.question,
          description: question.description,
          pollType: question.pollType,
          isActive: question.isActive,
          isLive: question.isLive,
          createdAt: question.createdAt,
          createdBy: {
            id: question.createdBy?.id,
            name: `${question.createdBy?.firstName} ${question.createdBy?.lastName}`,
          },
        };

        if (question.pollType === PollType.INTERNAL) {
          return {
            ...baseData,
            allowMultipleSelection: question.allowMultipleSelection,
            hasCorrectAnswer: question.hasCorrectAnswer,
            showCorrectAnswer: question.showCorrectAnswer,
            options: question.options.map(option => ({
              id: option.id,
              optionText: option.optionText,
              isCorrectAnswer: option.isCorrectAnswer,
            })),
            totalOptions: question.options.length,
            correctAnswers: question.options.filter(opt => opt.isCorrectAnswer).length,
          };
        } else {
          return {
            ...baseData,
            externalUrl: question.externalUrl,
            platform: question.platform,
          };
        }
      });

      return {
        speakerInfo,
        eventInfo,
        totalPolls: questions.length,
        internalPolls: internalPolls.length,
        externalPolls: externalPolls.length,
        polls: pollsData
      };

    } catch (error: any) {
      this.errorHandler.logError(error, 'Get mixed polls by speaker and event');
      return {
        speakerInfo: null,
        eventInfo: null,
        totalPolls: 0,
        internalPolls: 0,
        externalPolls: 0,
        polls: []
      };
    }
  }

  // Toggle Poll Live Status
  async togglePollLive(questionId: string) {
    try {
      const question = await this.quizQuestionRepository.findOne({
        where: { id: questionId }
      });

      if (!question) {
        throw new ResourceNotFoundException('Poll', questionId);
      }

      question.isLive = !question.isLive;
      await this.quizQuestionRepository.save(question);

      return {
        id: question.id,
        isLive: question.isLive,
        pollType: question.pollType,
        message: question.isLive ? 'Poll is now live' : 'Poll is no longer live'
      };
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      this.errorHandler.logError(error, 'Toggle poll live status');
      this.errorHandler.handleDatabaseError(error, 'Poll status toggle');
    }
  }

  // Get Live Polls for Event/Speaker
  async getLivePolls(eventId?: string, speakerId?: string) {
    try {
      const whereConditions: any = { 
        isActive: true, 
        isLive: true 
      };

      if (eventId) whereConditions.eventId = eventId;
      if (speakerId) whereConditions.speakerId = speakerId;

      const livePolls = await this.quizQuestionRepository.find({
        where: whereConditions,
        relations: ['options', 'event', 'speaker'],
        order: { createdAt: 'DESC' },
      });

      return livePolls.map(poll => {
        const baseData = {
          id: poll.id,
          question: poll.question,
          description: poll.description,
          pollType: poll.pollType,
          eventInfo: poll.event ? {
            id: poll.event.id,
            name: poll.event.name,
          } : null,
          speakerInfo: poll.speaker ? {
            id: poll.speaker.id,
            name: poll.speaker.name,
            companyName: poll.speaker.companyName,
            position: poll.speaker.position,
          } : null,
          isLive: poll.isLive,
          createdAt: poll.createdAt,
        };

        if (poll.pollType === PollType.INTERNAL) {
          return {
            ...baseData,
            allowMultipleSelection: poll.allowMultipleSelection,
            options: poll.options.map(option => ({
              id: option.id,
              optionText: option.optionText,
              // Don't show correct answers in live poll
            })),
          };
        } else {
          return {
            ...baseData,
            externalUrl: poll.externalUrl,
            platform: poll.platform,
          };
        }
      });
    } catch (error: any) {
      this.errorHandler.logError(error, 'Get live polls');
      return [];
    }
  }
} 