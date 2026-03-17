import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/users.entity';
import { PushNotification } from '../settings/setting.entity';
import { FirebaseUtil } from '../utils/firebase.util';

@Injectable()
export class ChatNotificationService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(PushNotification)
    private pushNotificationRepository: Repository<PushNotification>
  ) {}

  /**
   * Send push notification when a chat message is received
   * @param senderId - ID of the user who sent the message
   * @param receiverId - ID of the user who received the message
   * @param message - The message content
   * @param messageType - Type of message (text, image, etc.)
   */
  async sendChatNotification(
    senderId: string,
    receiverId: string,
    message: string,
    messageType: string = 'text'
  ): Promise<void> {
    try {
      // Get sender information
      const sender = await this.userRepository.findOne({
        where: { id: senderId },
        select: ['id', 'firstName', 'lastName', 'email']
      });

      if (!sender) {
        console.log('❌ Sender not found for chat notification');
        return;
      }

      // Get receiver's device tokens
      const receiverTokens = await this.getUserDeviceTokens(receiverId);
      
      if (receiverTokens.length === 0) {
        console.log(`📱 No device tokens found for user ${receiverId}`);
        return;
      }

      // Create notification content
      const senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Someone';
      const notificationTitle = `New message from ${senderName}`;
      const notificationBody = this.formatMessageBody(message, messageType);

      // Send push notification to all receiver's devices
      for (const deviceToken of receiverTokens) {
        try {
          console.log(
            '📨 Sending chat push to token',
            deviceToken,
            'for user',
            receiverId,
          );
          await FirebaseUtil.sendPushNotification(deviceToken, {
            title: notificationTitle,
            body: notificationBody,
            data: {
              type: 'chat',
              senderId: senderId,
              receiverId: receiverId,
              message: message,
              messageType: messageType,
              senderName: senderName,
              timestamp: new Date().toISOString()
            }
          }, 'android'); // You can determine platform from device token if needed
        } catch (error: any) {
          const code = error?.errorInfo?.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/third-party-auth-error'
          ) {
            console.warn(
              `🧹 Cleaning up invalid token for user ${receiverId}:`,
              deviceToken,
              'code:',
              code,
            );
            await this.pushNotificationRepository.delete({
              userId: receiverId,
              deviceToken,
            });
          } else {
            console.error(
              `❌ Failed to send chat notification to token ${deviceToken}:`,
              error,
            );
          }
        }
      }

      console.log(`📱 Chat notification sent to user ${receiverId} from ${senderName}`);
      
    } catch (error) {
      console.error('❌ Error sending chat notification:', error);
    }
  }

  /**
   * Send push notification for group chat messages
   * @param senderId - ID of the user who sent the message
   * @param receiverIds - Array of user IDs who received the message
   * @param message - The message content
   * @param groupName - Name of the group/thread
   * @param messageType - Type of message
   */
  async sendGroupChatNotification(
    senderId: string,
    receiverIds: string[],
    message: string,
    groupName: string,
    messageType: string = 'text'
  ): Promise<void> {
    try {
      // Get sender information
      const sender = await this.userRepository.findOne({
        where: { id: senderId },
        select: ['id', 'firstName', 'lastName', 'email']
      });

      if (!sender) {
        console.log('❌ Sender not found for group chat notification');
        return;
      }

      const senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Someone';
      const notificationTitle = `${senderName} in ${groupName}`;
      const notificationBody = this.formatMessageBody(message, messageType);

      // Send to all receivers
      for (const receiverId of receiverIds) {
        if (receiverId === senderId) continue; // Don't send to sender

        const receiverTokens = await this.getUserDeviceTokens(receiverId);
        
        for (const deviceToken of receiverTokens) {
          try {
            await FirebaseUtil.sendPushNotification(deviceToken, {
              title: notificationTitle,
              body: notificationBody,
              data: {
                type: 'group_chat',
                senderId: senderId,
                receiverId: receiverId,
                message: message,
                messageType: messageType,
                senderName: senderName,
                groupName: groupName,
                timestamp: new Date().toISOString()
              }
            }, 'android');
          } catch (error: any) {
            const code = error?.errorInfo?.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/third-party-auth-error'
            ) {
              console.warn(
                `🧹 Cleaning up invalid token for user ${receiverId}:`,
                deviceToken,
                'code:',
                code,
              );
              await this.pushNotificationRepository.delete({
                userId: receiverId,
                deviceToken,
              });
            } else {
              console.error(
                `❌ Failed to send group chat notification to token ${deviceToken}:`,
                error,
              );
            }
          }
        }
      }

      console.log(`📱 Group chat notification sent to ${receiverIds.length} users from ${senderName}`);
      
    } catch (error) {
      console.error('❌ Error sending group chat notification:', error);
    }
  }

  /**
   * Get user's device tokens for push notifications
   * @param userId - User ID
   * @returns Array of device tokens
   */
  private async getUserDeviceTokens(userId: string): Promise<string[]> {
    try {
      const deviceTokens = await this.pushNotificationRepository.find({
        where: { 
          userId: userId,
          isActive: true 
        },
        select: ['deviceToken', 'platform']
      });
      
      if (deviceTokens.length === 0) {
        console.log(`⚠️  No device tokens found for user ${userId}. User needs to register device token.`);
        return [];
      }
      // Skip empty tokens and dedupe so same FCM token from multiple rows gets one send
      const valid = deviceTokens
        .map((t) => t.deviceToken)
        .filter((t): t is string => t != null && String(t).trim() !== '');
      return [...new Set(valid)];
    } catch (error) {
      console.error('❌ Error getting user device tokens:', error);
      return [];
    }
  }

  /**
   * Format message body for notification
   * @param message - Original message
   * @param messageType - Type of message
   * @returns Formatted message body
   */
  private formatMessageBody(message: string, messageType: string): string {
    switch (messageType) {
      case 'image':
        return '📷 Sent a photo';
      case 'video':
        return '🎥 Sent a video';
      case 'audio':
        return '🎵 Sent an audio message';
      case 'file':
        return '📄 Sent a file';
      case 'location':
        return '📍 Sent a location';
      default:
        // Truncate long messages
        return message.length > 100 ? message.substring(0, 100) + '...' : message;
    }
  }

  /**
   * Send typing indicator notification (optional)
   * @param senderId - ID of the user typing
   * @param receiverId - ID of the user receiving the indicator
   * @param isTyping - Whether user is typing or stopped
   */
  async sendTypingNotification(
    senderId: string,
    receiverId: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      const sender = await this.userRepository.findOne({
        where: { id: senderId },
        select: ['firstName', 'lastName']
      });

      if (!sender) return;

      const senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Someone';
      const notificationTitle = isTyping ? `${senderName} is typing...` : '';
      
      // Only send typing notifications, not stop typing
      if (isTyping) {
        const receiverTokens = await this.getUserDeviceTokens(receiverId);
        
        for (const deviceToken of receiverTokens) {
          try {
            await FirebaseUtil.sendPushNotification(deviceToken, {
              title: notificationTitle,
              body: '',
              data: {
                type: 'typing',
                senderId: senderId,
                receiverId: receiverId,
                isTyping: isTyping,
                senderName: senderName,
                timestamp: new Date().toISOString()
              }
            }, 'android');
          } catch (error: any) {
            const code = error?.errorInfo?.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/third-party-auth-error'
            ) {
              console.warn(
                `🧹 Cleaning up invalid token for user ${receiverId}:`,
                deviceToken,
                'code:',
                code,
              );
              await this.pushNotificationRepository.delete({
                userId: receiverId,
                deviceToken,
              });
            } else {
              console.error(
                `❌ Failed to send typing notification to token ${deviceToken}:`,
                error,
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error sending typing notification:', error);
    }
  }
}
