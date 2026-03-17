import * as admin from 'firebase-admin';
import { GeneralNotificationType } from '../types/notification.types';

export class FirebaseUtil {
  private static fcmApp: admin.app.App | null = null;

  /**
   * Initialize Firebase Admin SDK
   * @returns Firebase app instance
   */
  static initializeFirebase(): admin.app.App | null {
    try {
      // Use a dedicated named app for FCM so it doesn't conflict
      // with other firebase-admin initializations (e.g. storage).
      const appName = 'event-isca-messaging';

      // If app already exists, just reuse it
      let existing: admin.app.App | undefined;
      for (const a of admin.apps) {
        if (a && a.name === appName) {
          existing = a;
          break;
        }
      }
      if (existing) {
        this.fcmApp = existing;
        return this.fcmApp;
      }

      // Prefer environment variables for production (no secrets in code)
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const privateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID;
      const clientId = process.env.FIREBASE_CLIENT_ID;

      const useEnvCreds =
        projectId &&
        clientEmail &&
        privateKey &&
        privateKeyId &&
        clientId;

      if (useEnvCreds) {
        const serviceAccount = {
          type: 'service_account',
          project_id: projectId,
          private_key_id: privateKeyId,
          private_key: privateKey,
          client_email: clientEmail,
          client_id: clientId,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url:
            'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
          universe_domain: 'googleapis.com',
        } as admin.ServiceAccount;
        this.fcmApp = admin.initializeApp(
          { credential: admin.credential.cert(serviceAccount) },
          appName,
        );
        return this.fcmApp;
      }

      // Fallback for local development only; production must use env vars
      if (process.env.NODE_ENV === 'production') {
        console.error(
          '❌ Firebase Admin: Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_PRIVATE_KEY_ID, FIREBASE_CLIENT_ID in production.',
        );
        return null;
      }

      const devServiceAccount = {
        type: 'service_account',
        project_id: 'event-isca',
        private_key_id: '18e18a0ce754d65b593d7a23ea829c5bee3c0aac',
        private_key:
          '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCczbptFHau5E/D\nqRYf/XFD+HYZCYRi1/M8miPXkhJy9kN4o8etmsNc5HiOALKGT8Zjjb4RGPhK+Lnw\nXkrK6rDedP+i3LfkRWXFpgjQUaTU+Isy65F4++6YzAiKNroz1H7CmK/XIvE7Ztvy\nX/eO35AjIHBkMMxB5dlmGjPXBmA9KAXqyjOwHf77zyEDNjx1uxde7BCAGfQr8WIM\nAz/W47aQQwnqdE3KN6JhmBsjpkYIQ/Kmhdx7daY4Yk1M9H40pphCZZeyaXsiDfzm\nuZq6Uarb4rA62gAPTESGAgHkFPjYj/dp6nt6M/Fm5sYAtoGOU3VUN9IcvHfHLsn8\njY/lvMdtAgMBAAECggEABGpgrRCt9OfV/S8GQflblqvo+3SCp1vobBT1HG1vGpCn\nvr5x8YgRp0yBvpHzdQfLEOOdbhLTbx0I82VcWtF4EJOf3UC05vczUfkGd4NNDng/\nRzxN+OezRNc+CFJZNPtvZGBzVy4TN/aCDBW6vWm7P9n6gD/FiLeFwzPKsOvrit1J\n3+ryXspdO1ClqInkUq2T9CXe7xou7YMj5ft36jZONr9XWNOC+e+V25qjxmfgKlXn\n2wD+holFAgY4XmjDpJhAmVWVgVoTS1T0/H7tZGXakWX6+qbV/9sOtS+PCGdTD6Xm\nBNqXN9DgWRCXciHhNdiUdQzAyFsxO/S0b0E2q7fscQKBgQDM+sVOZg1gV47hADKB\ndoJTlqowzBLm77T8H+cJp3L9zcVBQAQrtR4FBU1RV8Uod8aIS9JVCx3RufLajf6U\n7iy2gk/lEaFI93Bf3i1bTIcU9S3f9qlwZuGglM0a2pj94+DRGx8+evi10yDDxtSE\npd6eQ806lhWwI9mhYUMeMCPh6QKBgQDD1TPPneLXJLf3KQQG7yT6wHG4LEciXMFe\nn2s5fUx1MqKrTd1mMvwYypJQIucSBY5hsnW6Ip8N82kVBoT9RRp85FVj/C891Nq+\nMWlgVCoG2akKKXF1jX9wYCRvMRuCI14dz6VKHlwnrf/IR/yS5dmTNs+9LBLTr4xQ\nNy/SMhTi5QKBgF068eLmp87aBDJyVIZt0HkUXfQz3aUMAdVq7TqG3tZxcPZsl3kJ\nt82wy6njsdjmIXZ8hf4IQFfTq5GcY955Nf0M6CnYCvOVF5eDBj4wYIA3w9XJ6uck\n5BqVk3RTWKKhsu9o1p0kcVrB3HUvShnLF6YEUKQE/3hN1f6ArnZcjvWBAoGACN2j\nHdghB+pypa7mrsWu3+dMfrEKe2TFoFoJSa4BgyDKuoSo7FKMlTa+jwA1g9xaiNPC\nfq3Ik6IcdMY5yRmSzGqt7vvgy6TSTmAATEsjJ/I8s+gSaecBCP5hR+NqQmcFgMYA\nzq03MNiwxslzhtb/Faoal47iP1EoQg1tjc+UoH0CgYEAwlGB1sAXCi9FkBiUU2oz\nxos1GxairPnxkOfzxpvFiNV5LBWpPW80Iy1NZj5z3/jf6tStZKujLDda6xCzMu+g\n53Cd2WMOBNKo2CeKZsrITUutHIaBLLArL55ksJ3Z8QmInBa80kHaDYZ9+HEzDdHs\nQn6Cj1T2jVhaAchM8e1+9KM=\n-----END PRIVATE KEY-----\n',
        client_email:
          'firebase-adminsdk-fbsvc@event-isca.iam.gserviceaccount.com',
        client_id: '101497557548185792969',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url:
          'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url:
          'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40event-isca.iam.gserviceaccount.com',
        universe_domain: 'googleapis.com',
      };

      this.fcmApp = admin.initializeApp(
        {
          credential: admin.credential.cert(
            devServiceAccount as admin.ServiceAccount,
          ),
        },
        appName,
      );

      return this.fcmApp;
    } catch (error) {
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
    const app = this.getFirebaseApp();

    if (!app) {
      console.error('❌ Firebase messaging app not initialized');
      return;
    }

    // Do not log full token in production (security)
    if (process.env.NODE_ENV !== 'production') {
      const mask = deviceToken.length > 8 ? `...${deviceToken.slice(-6)}` : '***';
      console.log('📌 FirebaseUtil.sendPushNotification token:', mask);
    }

    const message = {
      token: deviceToken,
      notification: {
        title: notificationData.title,
        body: notificationData.body,
      },
      data: {
        ...notificationData.data,
        type: notificationData.type || GeneralNotificationType.GENERAL,
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

    // Use messaging instance from our dedicated app
    const messaging = (app as admin.app.App).messaging();
    await messaging.send(message);
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
        const mask =
          process.env.NODE_ENV === 'production'
            ? '***'
            : deviceToken.length > 8
              ? `...${deviceToken.slice(-6)}`
              : '***';
        console.error(`Failed to send to device ${mask}:`, error);
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
