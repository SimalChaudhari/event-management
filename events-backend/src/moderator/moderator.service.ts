import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Moderator } from './moderator.entity';
import { ModeratorEvent } from './moderator-event.entity';
import { CreateModeratorDto, UpdateModeratorDto, AssignModeratorToEventDto, AssignMultipleEventsDto } from './moderator.dto';
import { Event } from '../event/event.entity';
import { EmailService } from '../service/email.service';
import { UserEntity, UserRole } from '../user/users.entity';
import { PasswordUtils } from '../utils/password.utils';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ModeratorService {
  constructor(
    @InjectRepository(Moderator)
    private moderatorRepository: Repository<Moderator>,
    @InjectRepository(ModeratorEvent)
    private moderatorEventRepository: Repository<ModeratorEvent>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {}

  // Create a new moderator
  async createModerator(createModeratorDto: CreateModeratorDto): Promise<Moderator> {
    // Check if email already exists in moderator table
    const existingModerator = await this.moderatorRepository.findOne({
      where: { email: createModeratorDto.email },
    });

    if (existingModerator) {
      throw new ConflictException('Email already exists');
    }

    // Check if email already exists in user table
    const existingUser = await this.userRepository.findOne({
      where: { email: createModeratorDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists in user system');
    }

    // Create moderator record
    const moderator = this.moderatorRepository.create(createModeratorDto);
    const savedModerator = await this.moderatorRepository.save(moderator);

    // Create user account for moderator
    const user = this.userRepository.create({
      email: createModeratorDto.email,
      firstName: createModeratorDto.name.split(' ')[0] || createModeratorDto.name,
      lastName: createModeratorDto.name.split(' ').slice(1).join(' ') || '',
      mobile: createModeratorDto.mobile || '',
      role: UserRole.Moderator,
      isVerify: true,
      password: await PasswordUtils.hashPassword('Moderator@123'), // Default password
    });

    await this.userRepository.save(user);

    return savedModerator;
  }

  // Get all moderators
  async getAllModerators(): Promise<Moderator[]> {
    return await this.moderatorRepository.find({
      relations: ['moderatorEvents', 'moderatorEvents.event'],
      order: { createdAt: 'DESC' },
    });
  }

  // Get moderator by ID
  async getModeratorById(id: string): Promise<Moderator> {
    const moderator = await this.moderatorRepository.findOne({
      where: { id },
      relations: ['moderatorEvents', 'moderatorEvents.event'],
    });

    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${id} not found`);
    }

    return moderator;
  }

  // Update a moderator
  async updateModerator(id: string, updateModeratorDto: UpdateModeratorDto): Promise<Moderator> {
    const moderator = await this.moderatorRepository.findOne({
      where: { id },
    });

    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${id} not found`);
    }

    // Check email uniqueness if updating email
    if (updateModeratorDto.email && updateModeratorDto.email !== moderator.email) {
      const existingModerator = await this.moderatorRepository.findOne({
        where: { email: updateModeratorDto.email },
      });

      if (existingModerator) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(moderator, updateModeratorDto);
    return await this.moderatorRepository.save(moderator);
  }

  // Delete a moderator
  async deleteModerator(id: string): Promise<{ message: string }> {
    const moderator = await this.moderatorRepository.findOne({
      where: { id },
    });

    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${id} not found`);
    }

    await this.moderatorRepository.remove(moderator);
    return { message: 'Moderator deleted successfully' };
  }

  // Assign moderator to event
  async assignModeratorToEvent(assignDto: AssignModeratorToEventDto): Promise<ModeratorEvent> {
    // Verify moderator exists
    const moderator = await this.moderatorRepository.findOne({
      where: { id: assignDto.moderatorId },
    });

    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${assignDto.moderatorId} not found`);
    }

    // Verify event exists
    const event = await this.eventRepository.findOne({
      where: { id: assignDto.eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${assignDto.eventId} not found`);
    }

    // Check if assignment already exists
    const existingAssignment = await this.moderatorEventRepository.findOne({
      where: {
        moderatorId: assignDto.moderatorId,
        eventId: assignDto.eventId,
      },
    });

    if (existingAssignment) {
      throw new ConflictException('Moderator already assigned to this event');
    }

    const moderatorEvent = this.moderatorEventRepository.create(assignDto);
    return await this.moderatorEventRepository.save(moderatorEvent);
  }

  // Assign moderator to multiple events
  async assignModeratorToMultipleEvents(assignDto: AssignMultipleEventsDto): Promise<ModeratorEvent[]> {
    // Verify moderator exists
    const moderator = await this.moderatorRepository.findOne({
      where: { id: assignDto.moderatorId },
    });

    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${assignDto.moderatorId} not found`);
    }

    const createdAssignments: ModeratorEvent[] = [];

    for (const eventId of assignDto.eventIds) {
      // Verify event exists
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });

      if (!event) {
        continue; // Skip if event not found
      }

      // Check if assignment already exists
      const existingAssignment = await this.moderatorEventRepository.findOne({
        where: {
          moderatorId: assignDto.moderatorId,
          eventId: eventId,
        },
      });

      if (!existingAssignment) {
        const moderatorEvent = this.moderatorEventRepository.create({
          moderatorId: assignDto.moderatorId,
          eventId: eventId,
        });
        const saved = await this.moderatorEventRepository.save(moderatorEvent);
        createdAssignments.push(saved);
      }
    }

    // Send email notification to moderator if any assignments were created
    if (createdAssignments.length > 0) {
      try {
        const assignedEvents = await Promise.all(
          createdAssignments.map(async (assignment) => {
            const event = await this.eventRepository.findOne({
              where: { id: assignment.eventId },
            });
            return event;
          })
        );

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        // Generate access token for moderator
        const accessToken = this.jwtService.sign({
          sub: moderator.id,
          email: moderator.email,
          name: moderator.name,
          role: 'moderator',
          type: 'access'
        }, {
          secret: process.env.JWT_SECRET,
          expiresIn: '30d' // Token valid for 30 days
        });

        const moderatorLandingUrl = `${baseUrl}/moderator/${moderator.id}?token=${accessToken}`;

        await this.emailService.sendModeratorAssignmentEmail(
          moderator.email,
          moderator.name,
          assignedEvents,
          moderatorLandingUrl,
          accessToken
        );
      } catch (error) {
        console.error('Error sending email notification:', error);
        // Don't throw error - assignment was successful, email is just a notification
      }
    }

    return createdAssignments;
  }

  // Remove moderator from event
  async removeModeratorFromEvent(moderatorId: string, eventId: string): Promise<{ message: string }> {
    const moderatorEvent = await this.moderatorEventRepository.findOne({
      where: {
        moderatorId,
        eventId,
      },
    });

    if (!moderatorEvent) {
      throw new NotFoundException('Assignment not found');
    }

    await this.moderatorEventRepository.remove(moderatorEvent);
    return { message: 'Moderator removed from event successfully' };
  }

  // Get all events for a moderator
  async getModeratorEvents(moderatorId: string): Promise<Event[]> {
    const moderator = await this.moderatorRepository.findOne({
      where: { id: moderatorId },
      relations: ['moderatorEvents', 'moderatorEvents.event'],
    });

    if (!moderator) {
      throw new NotFoundException(`Moderator with ID ${moderatorId} not found`);
    }

    return moderator.moderatorEvents.map((me) => me.event);
  }

  // Get all moderators for an event
  async getEventModerators(eventId: string): Promise<Moderator[]> {
    const moderatorEvents = await this.moderatorEventRepository.find({
      where: { eventId },
      relations: ['moderator'],
    });

    return moderatorEvents.map((me) => me.moderator);
  }
}
