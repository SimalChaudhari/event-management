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

      const defaultStart = new Date();
      defaultStart.setFullYear(defaultStart.getFullYear() + 1);
      const defaultEnd = new Date(defaultStart.getTime());
      const defaultTime = '09:00';

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
          const images = item.imageUrl ? [item.imageUrl] : undefined;

          const defaultPrice = this.getDefaultPriceFromPricingOptions(
            item.pricingOptions,
          );

          const isPrivate = item.privateEvent === true;
          const eventData: Partial<Event> = {
            name,
            description: description ?? undefined,
            venue: venueName ?? undefined,
            location: venueName ?? undefined,
            startDate: defaultStart,
            startTime: defaultTime,
            endDate: defaultEnd,
            endTime: defaultTime,
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
            const hasChanges =
              event.name !== name ||
              (event.description ?? '') !== (description ?? '') ||
              (event.venue ?? '') !== (venueName ?? '') ||
              (event.courseCode ?? '') !== (item.courseCode ?? '') ||
              Number(event.price ?? 0) !== Number(defaultPrice ?? 0) ||
              Boolean(event.isPrivate) !== isPrivate ||
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
