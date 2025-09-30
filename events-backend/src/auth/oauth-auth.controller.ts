import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { OAuthAuthService } from './oauth-auth.service';

@Controller('api/auth/oauth')
export class OAuthAuthController {
  constructor(private readonly oauthAuthService: OAuthAuthService) { }

  /**
   * Get OAuth authentication URL for frontend
   */
  @Get('auth-url')
  async getAuthUrl(
    @Res() response: Response,

    @Query('state') state?: string,
  ) {
    try {
      const authUrl = this.oauthAuthService.generateAuthUrl(state);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'Authentication URL generated successfully',
        authUrl: authUrl,
        state: state || '',
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to generate authentication URL',
      });
    }
  }

  /**
   * Direct redirect to Salesforce login
   */
  @Get('login')
  async initiateLogin(
    @Res() response: Response,
    @Query('state') state?: string,
  ) {
    try {
      const authUrl = this.oauthAuthService.generateAuthUrl(state);

      // Direct redirect to Salesforce
      return response.redirect(authUrl);
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to redirect to Salesforce login',
      });
    }
  }

  /**
   * Handle OAuth callback and exchange code for token
   */
  @Get('callback')
  async handleCallback(
    @Res() response: Response,
    @Query('code') code: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    console.log('OAuth callback received with code:', code ? 'present' : 'missing');
    try {
      if (error) {
        throw new BadRequestException(`OAuth error: ${error}`);
      }

      if (!code) {
        throw new BadRequestException('Authorization code is required');
      }

      const result = await this.oauthAuthService.processOAuthAuthentication(code);
      console.log('OAuth authentication result:', result)

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'OAuth authentication successful',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isNewUser: result.isNewUser,
        provider: 'oauth',
        loginMethod: 'sso',
        state: state || '',
        loginTimestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('OAuth callback error:', error.message);
      
      return response.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: error.message || 'OAuth authentication failed',
        errorCode: 'OAUTH_AUTHENTICATION_FAILED',
        state: state || '',
      });
    }
  }

  /**
   * Refresh access token using refresh token
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

  /**
   * SSO Login API - Exchange authorization code for tokens and user info
   */
  @Post('login')
  async ssoLogin(
    @Body() body: { code: string; state?: string },
    @Res() response: Response,
  ) {
    try {
      if (!body.code) {
        throw new BadRequestException('Authorization code is required');
      }

      const result = await this.oauthAuthService.processOAuthAuthentication(body.code);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'SSO login successful',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isNewUser: result.isNewUser,
        provider: 'oauth',
        loginMethod: 'sso',
      });
    } catch (error: any) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: error.message || 'SSO login failed',
        errorCode: 'SSO_LOGIN_FAILED',
      });
    }
  }

  /**
   * Get OAuth configuration for frontend
   */
  @Get('config')
  async getOAuthConfig(@Res() response: Response) {
    try {
      const config = {
        clientId: process.env.SALESFORCE_CLIENT_ID,
        instanceUrl: process.env.SALESFORCE_INSTANCE_URL || 'https://eservices-isca--fuat.sandbox.my.site.com',
        redirectUri: process.env.SALESFORCE_REDIRECT_URI,
        scope: process.env.SALESFORCE_SCOPE || 'id profile email openid',
        responseType: 'code',
        responseMode: 'query',
      };

      return response.status(HttpStatus.OK).json({
        success: true,
        message: 'OAuth configuration retrieved',
        config: config,
      });
    } catch (error: any) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to retrieve OAuth configuration',
      });
    }
  }
}
