import * as admin from 'firebase-admin';

export class FirebaseUtil {
  private static fcmApp: admin.app.App | null = null;

  /**
   * Initialize Firebase Admin SDK
   * @returns Firebase app instance
   */
  static initializeFirebase(): admin.app.App | null {
    try {
      // Check if Firebase is already initialized
      if (!admin.apps.length) {
        const serviceAccount = {
          type: 'service_account',
          project_id: 'react-native-apps-11b65',
          private_key_id: 'dd2c7c805236e973476b8e7e5c3af727940be4ee',
          private_key:
            '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDImYtFCZiOQn/R\nLIY6e9w7QtLBegHjRwhhpsScXrYMsdsfxVOy54yx6NxuZrQR1MkjkTe/xLMDdHct\nF93lO6Q2+cOoDhS9rRdvMXQb7CkzofSVJnZcPGS/ZrDTlgjFNZEwUrbvK+UpaWWN\nJRS5qBNp5QI9eD5YYwBgfFp9m4nGThIUYpFK9oOdwCS+qgnrTfnYcqKXL8wtbhNY\n4soZQU1T9QAKRoyd6P2pF1XD8ZV4qTC9nURUpRcEzkxaRNF55FHvGUfLnGYlya4c\n8iWL2hAP1jCJhdkQwbI/htUbIsmvuT0AtAW58iuPhkRUXE/fX9uPnUi/vn6isJ1W\nlZQa8EE/AgMBAAECggEADGG3Ksc5Wd/j6M2BPtSMrEG8etcPjRpCJljh/i7gY280\n8cSUcntVVVk6Becj9TfM7yY+/9YMdfRMiNrWG5iZ/boJPXMaYkzFS1viPqOjNWh+\njW2Rf7GgnFR31KTdnLfo4sfa5RoGAToxW6FuzTjWc0JV6Dpm9Witn3GoL47tVZvk\nXxyzIDlzSEQWUcQZD1s5SSdVBIdiVZn/bMupEPLTlNMr+FyB4ErlikOqX1HifvYK\nAd7rvYIKmKrOmgFE8N4xjHA4jo92NKto4+mBx3XIZMjS5kw06P+iFju8WX9UQ44Q\nxg2rMhoPywBlYvKB2U5qL7rkjPpEZyx3TZt8vpCn4QKBgQDnHfCuwZO/E9011wH8\nX0wvOh9DrmkQegicMHKRUk6pAwGRz2r9GMMPe6o5Z7EGiJP1n2lBIZVQUsdOV7gJ\nBzIxeTSSxMZO7fl6ok3OYVsjCkzpEjUlBr1U//RZNHkXmps7vL8KeiVcOdNG6lUD\nu8zoIpz0E3Zq+18UnihvMwGfoQKBgQDeMnzW3YTYs9JAirS7R13Xdm1kK7el9pA2\ni801FB7gYAHiF8RvlY2v1MV9oYXbYsOwj2+UAD8o5rKKvKjM/vLnmc0k6HVHYWUh\nAtFK7B/GZGXZSf8FM0Fa/TJxcbXvdKAsOo1bX4gsSVYFKn8m2sTBx574MIcl8mId\nxiQRx6m03wKBgHBiArM3thxoEF0p2/FYdbdRT/qdSMGWVbF9bXh0yYMtzwmUDrZb\n4B4bSD75yP8gUrJRfeEJ741Lc1cJGJhrQ2EDSylDPhsLZRDY83SzqplzXMrI68bB\nbDd07uChv3BW4b0+nrb9hkU+aRpGwGg8XftTOXcGL8L90NI5xfesmdGBAoGAEFd+\nPv9DyfxPtld9O1jgWfxnxzo/44Di0mAt032LV8031j0RQXOqXAg2DitXAO+enNmv\nxx7NhmCROQrvD0Sg8M+q+s/t8DYFjgv7AJulKp4vr291xhgi8mI014sZamcVcKtN\nwi6ggUFThkW93Emytt3Ln01SY0QUW0Q7WuNoY9kCgYEAzl0TKFASqLupBKkPwjFL\nRZxTnYX/CC2vnAqmvvbMsrszkEuBR5l6c1RiKY0yPJmIvx/xKRLuZ6MByZO1kT6k\ng+3z0WYNLQJXU2X3DcphQiC2kiugsc97S6yswddroYWrt7i/5t/mg2lr2bNNpuvL\nKEKGdAWBSUj7GQ2sJ+j2jTE=\n-----END PRIVATE KEY-----\n',
          client_email:
            'firebase-adminsdk-fbsvc@react-native-apps-11b65.iam.gserviceaccount.com',
          client_id: '112164696025317365926',
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url:
            'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url:
            'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40react-native-apps-11b65.iam.gserviceaccount.com',
          universe_domain: 'googleapis.com',
        };

        this.fcmApp = admin.initializeApp({
          credential: admin.credential.cert(
            serviceAccount as admin.ServiceAccount,
          ),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });

      } else {
        this.fcmApp = admin.apps[0];
        console.log('🔥 Firebase Admin SDK already initialized');
      }

      return this.fcmApp;
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      console.log('📝 Make sure to set FIREBASE_* environment variables');
      return null;
    }
  }

  /**
   * Get Firebase app instance
   * @returns Firebase app instance or null
   */
  static getFirebaseApp(): admin.app.App | null {
    if (!this.fcmApp) {
      this.fcmApp = this.initializeFirebase();
    }
    return this.fcmApp;
  }

  /**
   * Send push notification using FCM
   * @param deviceToken - Device token to send notification to
   * @param notificationData - Notification data
   * @param platform - Platform (android/ios)
   * @returns Promise<void>
   */
  static async sendPushNotification(
    deviceToken: string,
    notificationData: {
      title: string;
      body: string;
      data?: any;
      type?: string;
    },
    platform: string = 'android',
  ): Promise<void> {
    try {
      const app = this.getFirebaseApp();

      if (!app) {
        console.log('⚠️ Firebase not initialized, using mock notification');
        console.log(`📱 Mock notification to ${platform} device:`, {
          token: deviceToken.substring(0, 20) + '...',
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data,
        });
        return;
      }

      const message = {
        token: deviceToken,
        notification: {
          title: notificationData.title,
          body: notificationData.body,
        },
        data: {
          ...notificationData.data,
          type: notificationData.type || 'general',
          timestamp: new Date().toISOString(),
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#FF6B6B',
            sound: 'default',
            channelId: 'default_channel',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ FCM notification sent successfully:`, response);
    } catch (error) {
      console.error(`❌ Failed to send FCM notification:`, error);

      // If FCM fails, fallback to mock for development
      console.log(`📱 Fallback mock notification to ${platform} device:`, {
        token: deviceToken.substring(0, 20) + '...',
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data,
      });
    }
  }

  /**
   * Send push notification to multiple devices
   * @param deviceTokens - Array of device tokens
   * @param notificationData - Notification data
   * @param platform - Platform (android/ios)
   * @returns Promise<number> - Number of successful sends
   */
  static async sendPushNotificationToMultiple(
    deviceTokens: string[],
    notificationData: {
      title: string;
      body: string;
      data?: any;
      type?: string;
    },
    platform: string = 'android',
  ): Promise<number> {
    let successCount = 0;

    for (const deviceToken of deviceTokens) {
      try {
        await this.sendPushNotification(
          deviceToken,
          notificationData,
          platform,
        );
        successCount++;
      } catch (error) {
        console.error(`Failed to send to device ${deviceToken}:`, error);
      }
    }

    return successCount;
  }

  /**
   * Validate Firebase configuration
   * @returns boolean - true if configuration is valid
   */
  static validateConfiguration(): boolean {
    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_CLIENT_ID',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName],
    );

    if (missingVars.length > 0) {
      console.error('❌ Missing Firebase environment variables:', missingVars);
      return false;
    }

    console.log('✅ Firebase configuration is valid');
    return true;
  }

  /**
   * Get Firebase project info
   * @returns object with project information
   */
  static getProjectInfo(): { projectId: string; isInitialized: boolean } {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID || 'Not set',
      isInitialized: !!this.fcmApp,
    };
  }
}
