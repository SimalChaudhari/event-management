import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from './email-template.entity';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto, RenderEmailTemplateDto } from './email-template.dto';

@Injectable()
export class EmailTemplateService {
  constructor(
    @InjectRepository(EmailTemplate)
    private emailTemplateRepo: Repository<EmailTemplate>,
  ) {}

  async createTemplate(dto: CreateEmailTemplateDto): Promise<EmailTemplate> {
    // Check if template name already exists
    const existingTemplate = await this.emailTemplateRepo.findOne({
      where: { name: dto.name },
    });

    if (existingTemplate) {
      throw new BadRequestException('Template name already exists');
    }

    const template = this.emailTemplateRepo.create({
      ...dto,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      type: dto.type || 'custom',
    });

    return this.emailTemplateRepo.save(template);
  }

  async getAllTemplates(): Promise<EmailTemplate[]> {
    return this.emailTemplateRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getTemplateById(id: string): Promise<EmailTemplate> {
    const template = await this.emailTemplateRepo.findOne({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    return template;
  }

  async getTemplateByName(name: string): Promise<EmailTemplate> {
    const template = await this.emailTemplateRepo.findOne({
      where: { name },
    });

    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    return template;
  }

  async getTemplatesByType(type: string): Promise<EmailTemplate[]> {
    return this.emailTemplateRepo.find({
      where: { type: type as any },
      order: { createdAt: 'DESC' },
    });
  }

  async updateTemplate(id: string, dto: UpdateEmailTemplateDto): Promise<EmailTemplate> {
    const template = await this.getTemplateById(id);

    // Check if name is being updated and if new name already exists
    if (dto.name && dto.name !== template.name) {
      const existingTemplate = await this.emailTemplateRepo.findOne({
        where: { name: dto.name },
      });

      if (existingTemplate) {
        throw new BadRequestException('Template name already exists');
      }
    }

    Object.assign(template, dto);
    return this.emailTemplateRepo.save(template);
  }

  async deleteTemplate(id: string): Promise<{ message: string }> {
    const template = await this.getTemplateById(id);
    await this.emailTemplateRepo.remove(template);
    return { message: 'Email template deleted successfully' };
  }

  async renderTemplate(dto: RenderEmailTemplateDto): Promise<{ subject: string; body: string }> {
    const template = await this.getTemplateById(dto.templateId);

    if (!template.isActive) {
      throw new BadRequestException('Template is not active');
    }

    let subject = template.subject;
    let body = template.body;

    // Replace variables in subject and body
    if (dto.variables && typeof dto.variables === 'object') {
      Object.keys(dto.variables).forEach((key) => {
        const value = dto.variables?.[key] || '';
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, String(value));
        body = body.replace(regex, String(value));
      });
    }

    return { subject, body };
  }

  async getActiveTemplates(): Promise<EmailTemplate[]> {
    return this.emailTemplateRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getTemplateByType(type: string): Promise<EmailTemplate | null> {
    return this.emailTemplateRepo.findOne({
      where: { type: type as any, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async sendEmailWithTemplate(
    templateType: string,
    recipientEmail: string,
    variables: Record<string, any>,
    emailService: any,
  ): Promise<void> {
    try {
      const template = await this.getTemplateByType(templateType);
      
      if (!template) {
        console.warn(`No active template found for type: ${templateType}`);
        return;
      }

      let subject = template.subject;
      let body = template.body;

      // Replace variables in subject and body
      if (variables && typeof variables === 'object') {
        Object.keys(variables).forEach((key) => {
          const value = variables[key] || '';
          const regex = new RegExp(`{{${key}}}`, 'g');
          subject = subject.replace(regex, String(value));
          body = body.replace(regex, String(value));
        });
      }

      // Send email using EmailService
      await emailService.sendEmail(recipientEmail, subject, body);
    } catch (error) {
      console.error(`Failed to send email with template ${templateType}:`, error);
      // Don't throw error as email sending failure shouldn't break the main flow
    }
  }
}

