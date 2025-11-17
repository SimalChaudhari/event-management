// src/app.controller.ts
import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { join } from 'path';

@Controller()  // This will handle the root (/) route
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()  // Respond to GET requests on '/'
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('sso-test')  // Direct access to SSO test page
  getSSOTestPage(@Res() res: Response) {
    return res.sendFile(join(__dirname, '..', 'public', 'sso-test.html'));
  }

  @Get('api/auth/sso/config')  // Get SSO configuration
  getSSOConfig() {
    return {
      success: true,
      config: {
        googleClientId: process.env.GOOGLE_CLIENT_ID || '228913853292-k6a5fut1gfmg5kjkgorcph25356c0r5b.apps.googleusercontent.com',
        facebookAppId: process.env.FACEBOOK_APP_ID || '1234567890',
        linkedinClientId: process.env.LINKEDIN_CLIENT_ID || '7731wous76ey71',
        appleClientId: process.env.APPLE_CLIENT_ID || 'YOUR_APPLE_CLIENT_ID',
      }
    };
  }

  @Get('tools/push-notification-tester')
  getPushNotificationTester(@Res() res: Response) {
    const filePath = join(process.cwd(), 'tools', 'push-notification-tester.html');
    return res.sendFile(filePath);
  }

}
