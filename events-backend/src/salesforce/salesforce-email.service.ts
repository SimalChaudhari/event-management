import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { Event } from '../event/event.entity';
import { UserEntity } from '../user/users.entity';
import { EmailService } from '../service/email.service';
import {
  EmailTemplateUtils,
  UserQRCodeEmailData,
} from '../utils/email-templates.utils';

export interface SendRegistrationEmailsResult {
  success: boolean;
  message: string;
  eventName: string;
  totalEligible: number;
  sentWithCredentials: number;
  sentWithQROnly: number;
  failed: number;
  errors: string[];
}

@Injectable()
export class SalesforceEmailService {
  private readonly logger = new Logger(SalesforceEmailService.name);

  constructor(
    @InjectRepository(RegisterEvent)
    private readonly registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Send registration confirmation emails to Salesforce-registered users for an event.
   * - Group 1 (isSalesforce=true, no prior account): login details + QR code
   * - Group 2 (existing Evential account): QR code + login instructions (normal/SSO)
   */
  async sendRegistrationEmailsForEvent(
    eventId: string,
  ): Promise<SendRegistrationEmailsResult> {
    const result: SendRegistrationEmailsResult = {
      success: false,
      message: '',
      eventName: '',
      totalEligible: 0,
      sentWithCredentials: 0,
      sentWithQROnly: 0,
      failed: 0,
      errors: [],
    };

    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      select: ['id', 'name', 'startDate'],
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    result.eventName = event.name;

    const registrations = await this.registerEventRepository.find({
      where: {
        eventId,
        isRegister: true,
        externalRegistrationId: Not(IsNull()),
      },
      relations: ['user'],
    });

    const eligible = registrations.filter((r) => r.user?.email);
    result.totalEligible = eligible.length;

    if (eligible.length === 0) {
      result.success = true;
      result.message = `No Salesforce-registered users found for ${event.name}.`;
      return result;
    }

    for (const reg of eligible) {
      const user = reg.user!;
      try {
        let tempPassword: string | undefined;

        if (user.isSalesforce) {
          tempPassword = this.generateTempPassword();
          user.password = await bcrypt.hash(tempPassword, 10);
          await this.userRepository.save(user);
        }

        const payload: UserQRCodeEmailData = {
          email: user.email,
          firstName: user.firstName || 'Participant',
          lastName: user.lastName || '',
          salutation: user.salutation ?? undefined,
          eventName: event.name,
          eventStartDate: event.startDate,
          showCredentials: !!user.isSalesforce,
          password: tempPassword,
        };

        const mailOptions = EmailTemplateUtils.getUserQRCodeEmailOptions(payload);
        await (this.emailService as any).transporter.sendMail(mailOptions);

        if (user.isSalesforce) {
          result.sentWithCredentials++;
        } else {
          result.sentWithQROnly++;
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push(`${user.email}: ${err?.message || String(err)}`);
        this.logger.warn(`Failed to send registration email to ${user.email}`, err);
      }
    }

    result.success = true;
    result.message = `Sent ${result.sentWithCredentials + result.sentWithQROnly} emails for ${event.name} (${result.sentWithCredentials} with credentials, ${result.sentWithQROnly} with QR only).`;
    if (result.failed > 0) {
      result.message += ` ${result.failed} failed.`;
    }
    this.logger.log(result.message);
    return result;
  }

  private generateTempPassword(length = 12): string {
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < length; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  }
}
