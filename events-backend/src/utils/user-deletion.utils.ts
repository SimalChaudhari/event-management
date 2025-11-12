// src/utils/user-deletion.utils.ts
import { QueryRunner } from 'typeorm';
import * as fs from 'fs';
import path from 'path';
import { ChatMessage, ChatParticipant, ChatThread } from '../chat/chat.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { FavoriteEvent } from '../favorite-event/favorite-event.entity';
import { EventAgenda } from '../agenda/agenda.entity';
import { EventSpeaker } from '../event/event-speaker.entity';
import { ScheduledPushNotificationDelivery } from '../scheduled-push-notification/scheduled-push-notification-delivery.entity';
import {
  AdvertNotificationRead,
  NotificationHistory,
  PushNotification,
  UserPermissions,
} from '../settings/setting.entity';
import {
  EngagementQnaLike,
  EngagementQnaQuestion,
} from '../engagement-qna/engagement-qna.entity';
import { QnaQuestion, QnaLike } from '../qna/qna.entity';
import { ExhibitorStamp } from '../attendance/exhibitor-stamp.entity';
import {
  Poll,
  PollVote,
  UserPollSession,
} from '../polling/polling.entity';
import { AddressEntity } from '../user/address.entity';
import { SpeakerProfile } from '../user/speaker-profile.entity';
import { UserEntity } from '../user/users.entity';
import { ErrorHandlerService } from './services/error-handler.service';

export interface UserDeletionOptions {
  includePollData?: boolean; // Include poll-related deletions (for speakers)
  errorContext?: string; // Context for error messages (e.g., 'User deletion', 'Speaker deletion')
  profilePictureContext?: string; // Context for profile picture deletion error messages
}

/**
 * Delete all user-related data from the database
 * @param queryRunner TypeORM QueryRunner instance
 * @param userId User ID to delete
 * @param options Deletion options
 */
export async function deleteUserRelatedData(
  queryRunner: QueryRunner,
  userId: string,
  options: UserDeletionOptions = {},
): Promise<string | null> {
  const {
    includePollData = false,
    errorContext = 'User deletion',
    profilePictureContext = 'User Profile Picture Deletion',
  } = options;

  // Get user to retrieve profile picture path
  const user = await queryRunner.manager.findOne(UserEntity, {
    where: { id: userId },
  });

  if (!user) {
    return null;
  }

  const profilePicturePath = user.profilePicture
    ? path.resolve(user.profilePicture)
    : null;

  // Remove programme session speaker join entries
  await queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from('programme_session_speakers')
    .where('"speakerId" = :id', { id: userId })
    .execute();

  // Clear chat related data
  await queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(ChatMessage)
    .where('senderID = :id OR receiverID = :id', { id: userId })
    .execute();

  await queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(ChatParticipant)
    .where('userID = :id', { id: userId })
    .execute();

  await queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(ChatThread)
    .where('userID = :id OR receiverID = :id', { id: userId })
    .execute();

  // Engagement QnA dependencies
  await queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(EngagementQnaLike)
    .where('userId = :id', { id: userId })
    .execute();

  await queryRunner.manager
    .createQueryBuilder()
    .update(EngagementQnaQuestion)
    .set({ answeredBy: null })
    .where('answeredBy = :id', { id: userId })
    .execute();

  await queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(EngagementQnaQuestion)
    .where('askedById = :id', { id: userId })
    .execute();

  // QnA (regular) dependencies
  // Update answeredBy to null for questions where user answered
  // Do this first before deleting questions
  await queryRunner.manager
    .createQueryBuilder()
    .update(QnaQuestion)
    .set({ answeredBy: null })
    .where('answeredBy = :id', { id: userId })
    .execute();

  // Delete questions where user asked (askedById)
  // This will cascade delete QnaLike for those questions
  await queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(QnaQuestion)
    .where('askedById = :id', { id: userId })
    .execute();

  // Delete questions where user is the speaker (speakerId)
  // This will cascade delete QnaLike for those questions
  await queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(QnaQuestion)
    .where('speakerId = :id', { id: userId })
    .execute();

  // Delete QnaLike where user liked questions on other questions
  // (Likes on questions the user asked/speaker for are already deleted by cascade above)
  await queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(QnaLike)
    .where('userId = :id', { id: userId })
    .execute();

  // Poll related data (only for speakers)
  if (includePollData) {
    // Delete UserPollSession (this will cascade delete UserPollVote)
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(UserPollSession)
      .where('userId = :id OR speakerId = :id', { id: userId })
      .execute();

    // Delete Polls where speaker is the speaker or creator
    // This will cascade delete PollOption and PollVote for those polls
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(Poll)
      .where('speakerId = :id OR createdById = :id', { id: userId })
      .execute();

    // Delete PollVote where user voted on polls they didn't create/own
    // (Polls where user is creator/speaker are already deleted above)
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(PollVote)
      .where('userId = :id', { id: userId })
      .execute();
  }

  // Notification & permissions data
  await queryRunner.manager.delete(UserPermissions, { userId });
  await queryRunner.manager.delete(PushNotification, { userId });
  await queryRunner.manager.delete(NotificationHistory, { userId });
  await queryRunner.manager.delete(AdvertNotificationRead, {
    userId,
  });
  await queryRunner.manager.delete(ScheduledPushNotificationDelivery, {
    userId,
  });

  // Event & registration related data
  await queryRunner.manager.delete(RegisterEvent, { userId });
  await queryRunner.manager.delete(FavoriteEvent, { userId });
  await queryRunner.manager.delete(EventSpeaker, { speakerId: userId });
  await queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(EventAgenda)
    .where('userId = :id OR createdBy = :id', { id: userId })
    .execute();

  await queryRunner.manager.delete(AddressEntity, { userId });
  await queryRunner.manager.delete(SpeakerProfile, { userId });
  await queryRunner.manager.delete(ExhibitorStamp, { attendeeId: userId });

  // Remove the user record (cascades handle remaining relations)
  await queryRunner.manager.delete(UserEntity, { id: userId });

  return profilePicturePath;
}

/**
 * Delete profile picture from filesystem
 * @param profilePicturePath Path to the profile picture
 * @param userId User ID
 * @param errorHandler Error handler service
 * @param context Context for error messages
 */
export async function deleteProfilePicture(
  profilePicturePath: string | null,
  userId: string,
  errorHandler: ErrorHandlerService,
  context: string = 'Profile Picture Deletion',
): Promise<void> {
  if (profilePicturePath) {
    try {
      if (fs.existsSync(profilePicturePath)) {
        fs.unlinkSync(profilePicturePath);
      }
    } catch (fileError) {
      errorHandler.logError(fileError, context, userId);
    }
  }
}

