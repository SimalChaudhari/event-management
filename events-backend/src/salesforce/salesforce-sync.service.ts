import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import * as bcrypt from 'bcrypt';
import { Event, EventType } from '../event/event.entity';
import { UserEntity, UserRole } from '../user/users.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { Status, Type } from '../registerEvent/registerEvent.dto';
import { SalesforceService } from './salesforce.service';
import { SalesforceSyncSetting } from './salesforce-sync-setting.entity';
import { SalesforceSyncSettingsDto, UpdateSalesforceSyncSettingsDto } from './salesforce.dto';

export interface SalesforceSyncEventsResult {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  existing: number;
  errors: string[];
}

export interface SalesforceSyncRegistrationsResult {
  success: boolean;
  message: string;
  accountId: string;
  usersCreated: number;
  registrationsCreated: number;
  registrationsExisting: number;
  errors: string[];
}

const SALESFORCE_SYNC_CRON_JOB_NAME = 'salesforce-sync-events';
const DEFAULT_CRON_SCHEDULE = '0 */6 * * *'; // Every 6 hours

@Injectable()
export class SalesforceSyncService implements OnModuleInit {
  private readonly logger = new Logger(SalesforceSyncService.name);

  constructor(
    private readonly salesforceService: SalesforceService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RegisterEvent)
    private readonly registerEventRepository: Repository<RegisterEvent>,
    @InjectRepository(SalesforceSyncSetting)
    private readonly syncSettingRepository: Repository<SalesforceSyncSetting>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const setting = await this.getOrCreateSetting();
      if (setting.enabled) {
        this.registerCronJob(setting.cronSchedule);
        this.logger.log(`Salesforce event sync cron registered: ${setting.cronSchedule}`);
      }
    } catch (err) {
      this.logger.warn('Could not init Salesforce sync cron from settings', err);
    }
  }

  private async getOrCreateSetting(): Promise<SalesforceSyncSetting> {
    let setting = await this.syncSettingRepository.findOne({ where: {} });
    if (!setting) {
      setting = this.syncSettingRepository.create({
        enabled: false,
        cronSchedule: DEFAULT_CRON_SCHEDULE,
      });
      setting = await this.syncSettingRepository.save(setting);
    }
    return setting;
  }

  private registerCronJob(cronSchedule: string): void {
    try {
      this.schedulerRegistry.deleteCronJob(SALESFORCE_SYNC_CRON_JOB_NAME);
    } catch {
      // ignore if not exists
    }
    const job = new CronJob(cronSchedule, () => {
      this.logger.log('Running scheduled Salesforce event sync');
      this.syncEvents().catch((err) => this.logger.error('Scheduled sync failed', err));
    });
    this.schedulerRegistry.addCronJob(SALESFORCE_SYNC_CRON_JOB_NAME, job);
    job.start();
  }

  async getSyncSettings(): Promise<SalesforceSyncSettingsDto> {
    const setting = await this.getOrCreateSetting();
    return {
      enabled: setting.enabled,
      cronSchedule: setting.cronSchedule,
      updatedAt: setting.updatedAt?.toISOString(),
    };
  }

  async updateSyncSettings(dto: UpdateSalesforceSyncSettingsDto): Promise<SalesforceSyncSettingsDto> {
    const setting = await this.getOrCreateSetting();
    if (dto.enabled !== undefined) setting.enabled = dto.enabled;
    if (dto.cronSchedule !== undefined) {
      const trimmed = dto.cronSchedule.trim();
      if (trimmed) setting.cronSchedule = trimmed;
    }
    const saved = await this.syncSettingRepository.save(setting);
    try {
      this.schedulerRegistry.deleteCronJob(SALESFORCE_SYNC_CRON_JOB_NAME);
    } catch {
      // ignore
    }
    if (saved.enabled) {
      this.registerCronJob(saved.cronSchedule);
      this.logger.log(`Salesforce sync cron updated: ${saved.cronSchedule}`);
    }
    return {
      enabled: saved.enabled,
      cronSchedule: saved.cronSchedule,
      updatedAt: saved.updatedAt?.toISOString(),
    };
  }

  /**
   * Sync events from Salesforce EventInfo to local database.
   * Uses eventCode = courseInstanceId for matching.
   */
  async syncEvents(): Promise<SalesforceSyncEventsResult> {
    const result: SalesforceSyncEventsResult = {
      success: false,
      message: '',
      created: 0,
      updated: 0,
      existing: 0,
      errors: [],
    };

    try {
      const items = await this.salesforceService.getEventInfo();
      if (!items.length) {
        result.success = true;
        result.message = 'No events returned from Salesforce.';
        return result;
      }

      for (const item of items) {
        try {
          const eventCode = item.courseInstanceId;
          let event = await this.eventRepository.findOne({
            where: { eventCode },
          });

          const name =
            item.courseDisplayName || item.courseName || item.courseCode || 'Event';
          const description =
            item.description || item.outline || null;
          const venueName = item.venue?.name || null;
          const salesforceImageUrl = item.imageUrl?.trim() || null;
          const images = salesforceImageUrl ? [salesforceImageUrl] : undefined;

          const defaultPrice = this.getDefaultPriceFromPricingOptions(
            item.pricingOptions,
          );

          const { startDate, endDate } = this.resolveEventDates(
            item.courseStartDate,
            item.courseEndDate,
          );
          const { startTime, endTime } = this.resolveEventTimes(
            item.courseStartTime,
            item.courseEndTime,
          );

          const isPrivate = item.privateEvent === true;
          const eventData: Partial<Event> = {
            name,
            description: description ?? undefined,
            venue: venueName ?? undefined,
            location: venueName ?? undefined,
            startDate,
            endDate,
            ...(startTime ? { startTime } : {}),
            ...(endTime ? { endTime } : {}),
            type: venueName && venueName.toLowerCase().includes('e-learning')
              ? EventType.Virtual
              : EventType.Physical,
            price: defaultPrice,
            currency: 'SGD',
            images,
            courseCode: item.courseCode ?? undefined,
            isPrivate,
            salesforcePricingOptions: item.pricingOptions?.length
              ? item.pricingOptions.map((p) => ({
                  id: p.id,
                  name: p.name,
                  courseInstance: p.courseInstance,
                  baseValue: Number(p.baseValue),
                  defaultValue: Number(p.defaultValue),
                }))
              : undefined,
          };

          if (!event) {
            event = this.eventRepository.create({
              ...eventData,
              eventCode,
            });
            await this.eventRepository.save(event);
            result.created++;
          } else {
            const pricingOptsJson = JSON.stringify(
              item.pricingOptions?.map((p) => ({
                id: p.id,
                name: p.name,
                courseInstance: p.courseInstance,
                baseValue: Number(p.baseValue),
                defaultValue: Number(p.defaultValue),
              })) ?? [],
            );
            const existingPricingOptsJson = JSON.stringify(
              event.salesforcePricingOptions ?? [],
            );
            const incomingImagesJson = JSON.stringify(images ?? []);
            const existingImagesJson = JSON.stringify(event.images ?? []);
            const hasChanges =
              event.name !== name ||
              (event.description ?? '') !== (description ?? '') ||
              (event.venue ?? '') !== (venueName ?? '') ||
              (event.courseCode ?? '') !== (item.courseCode ?? '') ||
              this.formatDateForCompare(event.startDate) !==
                this.formatDateForCompare(startDate) ||
              this.formatDateForCompare(event.endDate) !==
                this.formatDateForCompare(endDate) ||
              (startTime != null &&
                this.formatTimeForCompare(event.startTime) !==
                  this.formatTimeForCompare(startTime)) ||
              (endTime != null &&
                this.formatTimeForCompare(event.endTime) !==
                  this.formatTimeForCompare(endTime)) ||
              Number(event.price ?? 0) !== Number(defaultPrice ?? 0) ||
              Boolean(event.isPrivate) !== isPrivate ||
              existingImagesJson !== incomingImagesJson ||
              existingPricingOptsJson !== pricingOptsJson;
            if (hasChanges) {
              Object.assign(event, eventData);
              await this.eventRepository.save(event);
              result.updated++;
            } else {
              result.existing++;
            }
          }
        } catch (err: any) {
          result.errors.push(
            `Event ${item.courseInstanceId}: ${err?.message || String(err)}`,
          );
        }
      }

      result.success = true;
      result.message = `Synced events: ${result.created} created, ${result.updated} updated, ${result.existing} unchanged.`;
      this.logger.log(result.message);
      return result;
    } catch (err: any) {
      result.message = err?.message || 'Salesforce event sync failed';
      result.errors.push(result.message);
      this.logger.error(result.message, err?.stack);
      return result;
    }
  }

  /**
   * Sync registrations for a Salesforce account (by accountId).
   * Creates users if they don't exist; creates RegisterEvent linked to local Event (by eventCode = courseInstance.id).
   */
  async syncRegistrationsForAccount(
    accountId: string,
  ): Promise<SalesforceSyncRegistrationsResult> {
    const result: SalesforceSyncRegistrationsResult = {
      success: false,
      message: '',
      accountId,
      usersCreated: 0,
      registrationsCreated: 0,
      registrationsExisting: 0,
      errors: [],
    };

    try {
      const registrations =
        await this.salesforceService.getEventRegistrations(accountId);
      if (!registrations.length) {
        result.success = true;
        result.message = `No registrations found for account ${accountId}.`;
        return result;
      }

      for (const reg of registrations) {
        try {
          const eventCode = reg.courseInstance?.id;
          if (!eventCode) {
            result.errors.push(
              `Registration ${reg.regNo}: missing courseInstance.id`,
            );
            continue;
          }

          const event = await this.eventRepository.findOne({
            where: { eventCode },
          });
          if (!event) {
            result.errors.push(
              `Registration ${reg.regNo}: event not found for courseInstance ${eventCode}. Run event sync first.`,
            );
            continue;
          }

          let user = await this.userRepository.findOne({
            where: { email: reg.email },
          });

          if (!user) {
            const nameParts = (reg.name || 'User').trim().split(/\s+/);
            const firstName = nameParts[0] || 'User';
            const lastName = nameParts.slice(1).join(' ') || firstName;
            const randomPassword = await bcrypt.hash(
              `sf-${Date.now()}-${Math.random().toString(36)}`,
              10,
            );
            user = this.userRepository.create({
              firstName,
              lastName,
              email: reg.email,
              password: randomPassword,
              mobile: reg.contactNo ?? undefined,
              company: reg.company ?? undefined,
              role: UserRole.User,
              isVerify: true,
              isSalesforce: true,
            });
            await this.userRepository.save(user);
            result.usersCreated++;
          }

          const existingReg = await this.registerEventRepository.findOne({
            where: { externalRegistrationId: reg.id },
          });

          if (existingReg) {
            result.registrationsExisting++;
            continue;
          }

          const newReg = this.registerEventRepository.create({
            userId: user.id,
            eventId: event.id,
            type: Type.Attendee,
            status: this.mapRegistrationStatus(reg.registrationStatus),
            isCreatedByAdmin: true,
            isRegister: true,
            externalRegistrationId: reg.id,
            externalRegistrationName: reg.regNo,
          });
          await this.registerEventRepository.save(newReg);
          result.registrationsCreated++;
        } catch (err: any) {
          result.errors.push(
            `Registration ${reg.regNo}: ${err?.message || String(err)}`,
          );
        }
      }

      result.success = true;
      result.message = `Account ${accountId}: ${result.usersCreated} users created, ${result.registrationsCreated} registrations created, ${result.registrationsExisting} already existing.`;
      this.logger.log(result.message);
      return result;
    } catch (err: any) {
      result.message = err?.message || 'Salesforce registration sync failed';
      result.errors.push(result.message);
      this.logger.error(result.message, err?.stack);
      return result;
    }
  }

  /**
   * Map Salesforce courseStartDate / courseEndDate (DD/MM/YYYY) to event start/end dates.
   */
  private resolveEventDates(
    courseStartDate?: string | null,
    courseEndDate?: string | null,
  ): { startDate: Date; endDate: Date } {
    const fallbackStart = new Date();
    fallbackStart.setFullYear(fallbackStart.getFullYear() + 1);
    const fallbackEnd = new Date(fallbackStart.getTime());

    const parsedStart = this.parseSalesforceEventDate(courseStartDate);
    const parsedEnd = this.parseSalesforceEventDate(courseEndDate);

    const startDate = parsedStart ?? parsedEnd ?? fallbackStart;
    const endDate = parsedEnd ?? parsedStart ?? fallbackEnd;

    if (endDate.getTime() < startDate.getTime()) {
      return { startDate, endDate: startDate };
    }

    return { startDate, endDate };
  }

  /** Parse Salesforce EventInfo date strings (DD/MM/YYYY). */
  private parseSalesforceEventDate(
    dateStr?: string | null,
  ): Date | undefined {
    if (!dateStr?.trim()) return undefined;

    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr.trim());
    if (!match) return undefined;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;

    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return undefined;
    }

    return date;
  }

  private formatDateForCompare(date: Date | string | undefined): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  /**
   * Map Salesforce courseStartTime / courseEndTime to event start/end times (HH:mm).
   */
  private resolveEventTimes(
    courseStartTime?: string | null,
    courseEndTime?: string | null,
  ): { startTime?: string; endTime?: string } {
    const parsedStart = this.parseSalesforceEventTime(courseStartTime);
    const parsedEnd = this.parseSalesforceEventTime(courseEndTime);

    return {
      startTime: parsedStart ?? parsedEnd,
      endTime: parsedEnd ?? parsedStart,
    };
  }

  /** Parse Salesforce EventInfo time strings (e.g. "8:30 AM") to HH:mm. */
  private parseSalesforceEventTime(timeStr?: string | null): string | undefined {
    if (!timeStr?.trim()) return undefined;

    const trimmed = timeStr.trim();
    const h24 = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/i.exec(trimmed);
    if (h24) {
      return `${Number(h24[1]).toString().padStart(2, '0')}:${h24[2]}`;
    }

    const h12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(trimmed);
    if (!h12) return undefined;

    let hours = Number(h12[1]);
    const minutes = h12[2];
    const meridiem = h12[3].toUpperCase();

    if (meridiem === 'PM' && hours !== 12) hours += 12;
    else if (meridiem === 'AM' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  private formatTimeForCompare(time?: string | null): string {
    if (!time) return '';
    return this.parseSalesforceEventTime(time) ?? time.trim().slice(0, 5);
  }

  /**
   * Use "Non Member" pricing option as event default price; fallback to first option with a value.
   */
  private getDefaultPriceFromPricingOptions(
    options: Array<{ name: string; baseValue: number; defaultValue: number }> | undefined,
  ): number | undefined {
    if (!options?.length) return undefined;
    const nonMember = options.find(
      (p) => p.name?.toLowerCase().replace(/\s+/g, ' ') === 'non member',
    );
    if (nonMember != null) {
      const val = nonMember.defaultValue ?? nonMember.baseValue;
      return Number(val);
    }
    const withValue = options.find(
      (p) => (p.defaultValue ?? p.baseValue) != null && Number(p.defaultValue ?? p.baseValue) > 0,
    );
    if (withValue != null)
      return Number(withValue.defaultValue ?? withValue.baseValue);
    return undefined;
  }

  private mapRegistrationStatus(status: string): Status {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return Status.Sucesss;
      case 'cancelled':
      case 'withdrawn':
        return Status.Withdraw;
      default:
        return Status.Sucesss;
    }
  }

}
