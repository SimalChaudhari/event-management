import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { OAuthAuthService } from './oauth-auth.service';

@Controller('api/auth/oauth')
export class OAuthAuthController {
  constructor(private readonly oauthAuthService: OAuthAuthService) { }

  /**
   * Step 1: Get Salesforce authorization URL
   * Flutter app calls this to get the URL to open in browser
   */
  @Get('auth-url')
  async getAuthUrl(
    @Res() response: Response,
    @Query('state') state?: string,
  ) {
    try {
      const authUrl = this.oauthAuthService.generateAuthUrl(state);
      console.log('Generated authorization URL:', authUrl);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Authorization URL generated successfully',
        authUrl: authUrl,
        state: state || '',
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to generate authorization URL',
      });
    }
  }

  /**
   * Step 2: Exchange authorization code for tokens
   * Flutter app sends the code received from Salesforce callback (iscaevential://auth?code=xxxxx)
   * Backend exchanges code with Salesforce and returns JWT tokens
   */
  @Post('exchange')
  async exchangeCode(
    @Body() body: { code: string; state?: string },
    @Res() response: Response,
  ) {
    try {
      if (!body.code) {
        throw new BadRequestException('Authorization code is required');
      }

      console.log('Exchanging authorization code for tokens...');
      
      const result = await this.oauthAuthService.processOAuthAuthentication(body.code);
      
      console.log('OAuth authentication successful for user:', result.user.email);
      console.log('User saved to database with ID:', result.user.id);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isNewUser: result.isNewUser,
      });
    } catch (error: any) {
      console.error('OAuth exchange error:', error.message);
      
      return response.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: error.message || 'Failed to exchange authorization code',
      });
    }
  }

  /**
   * Web callback endpoint for SSO redirect
   * This handles the redirect from Salesforce after user enters email/password
   * After processing, redirects to mobile app with tokens
   */
  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() response: Response,
  ) {
    try {
      // Handle OAuth errors
      if (error) {
        console.error('OAuth callback error:', error);
        const errorUrl = `iscaevential://auth?error=${encodeURIComponent(error)}&success=false`;
        return response.redirect(errorUrl);
      }

      // Check if authorization code is present
      if (!code) {
        const errorUrl = `iscaevential://auth?error=${encodeURIComponent('Authorization code is missing')}&success=false`;
        return response.redirect(errorUrl);
      }

      console.log('Processing OAuth callback with code:', code);
      
      // Process the OAuth authentication
      const result = await this.oauthAuthService.processOAuthAuthentication(code);
      
      console.log('OAuth authentication successful for user:', result.user.email);

      // Create mobile app redirect URL with tokens
      const mobileRedirectUrl = this.oauthAuthService.createMobileRedirectUrl(result);
      console.log('Redirecting to mobile app with URL:', mobileRedirectUrl);
      
      // Redirect to mobile app
      return response.redirect(mobileRedirectUrl);
    } catch (error: any) {
      console.error('OAuth callback error:', error.message);
      
      const errorUrl = `iscaevential://auth?error=${encodeURIComponent(error.message || 'Failed to process OAuth callback')}&success=false`;
      return response.redirect(errorUrl);
    }
  }

  /**
   * Refresh JWT access token using refresh token
   */
  @Post('refresh')
  async refreshToken(
    @Body() body: { refreshToken: string },
    @Res() response: Response,
  ) {
    try {
      if (!body.refreshToken) {
        throw new BadRequestException('Refresh token is required');
      }

      const result = await this.oauthAuthService.refreshAccessToken(body.refreshToken);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error: any) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: error.message || 'Failed to refresh token',
      });
    }
  }
}
