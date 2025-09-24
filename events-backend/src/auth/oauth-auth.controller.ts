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
  constructor(private readonly oauthAuthService: OAuthAuthService) {}

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
    try {
      if (error) {
        throw new BadRequestException(`OAuth error: ${error}`);
      }

      if (!code) {
        throw new BadRequestException('Authorization code is required');
      }

      const result = await this.oauthAuthService.processOAuthAuthentication(code);

      // Redirect to frontend with tokens as URL parameters
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/sso-success?` + new URLSearchParams({
        success: 'true',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: JSON.stringify(result.user),
        provider: 'oauth',
        loginMethod: 'sso',
        state: state || '',
        loginTimestamp: new Date().toISOString(),
      }).toString();

      return response.redirect(redirectUrl);
    } catch (error: any) {
      // Redirect to frontend error page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorUrl = `${frontendUrl}/auth/sso-error?` + new URLSearchParams({
        success: 'false',
        message: error.message || 'OAuth authentication failed',
        errorCode: 'OAUTH_AUTHENTICATION_FAILED',
        state: state || '',
      }).toString();

      return response.redirect(errorUrl);
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
   * Revoke access token
   */
  @Post('revoke')
  async revokeToken(
    @Body() body: { token: string },
    @Res() response: Response,
  ) {
    try {
      if (!body.token) {
        throw new BadRequestException('Token is required');
      }

      const success = await this.oauthAuthService.revokeToken(body.token);

      return response.status(HttpStatus.OK).json({
        success: success,
        message: success ? 'Token revoked successfully' : 'Failed to revoke token',
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to revoke token',
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
        clientId: process.env.AZURE_CLIENT_ID,
        tenantId: process.env.AZURE_TENANT_ID,
        redirectUri: process.env.AZURE_REDIRECT_URI,
        scope: 'openid profile email',
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
