import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  Req,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { OAuthAuthService } from './oauth-auth.service';
import { SSOSyncService } from './sso-sync.service';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';

@Controller('api/auth/oauth')
export class OAuthAuthController {
  constructor(
    private readonly oauthAuthService: OAuthAuthService,
    private readonly ssoSyncService: SSOSyncService,
  ) { }

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
      
      const result = await this.oauthAuthService.processOAuthAuthentication(body.code);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isNewUser: result.isNewUser,
      });
    } catch (error: any) {
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
      console.log('[OAuth Callback] Received params:', { hasCode: !!code, hasState: !!state, hasError: !!error });
      // Handle OAuth errors
      if (error) {
        const errorUrl = `iscaevential://auth?error=${encodeURIComponent(error)}&success=false`;
        console.warn('[OAuth Callback] OAuth error from provider:', error);
        console.log('[OAuth Callback] Redirecting to deep link (error):', errorUrl);
        const html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url='${errorUrl}'" /><title>Redirecting…</title><script>location.href='${errorUrl}';</script></head><body>
        <p>Redirecting to app… If nothing happens, <a href="${errorUrl}">tap here</a>.</p>
        </body></html>`;
        return response.status(HttpStatus.OK).type('text/html').send(html);
      }

      // Check if authorization code is present
      if (!code) {
        const errorUrl = `iscaevential://auth?error=${encodeURIComponent('Authorization code is missing')}&success=false`;
        console.warn('[OAuth Callback] Missing authorization code');
        console.log('[OAuth Callback] Redirecting to deep link (missing code):', errorUrl);
        const html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url='${errorUrl}'" /><title>Redirecting…</title><script>location.href='${errorUrl}';</script></head><body>
        <p>Redirecting to app… If nothing happens, <a href="${errorUrl}">tap here</a>.</p>
        </body></html>`;
        return response.status(HttpStatus.OK).type('text/html').send(html);
      }
      
      // Process the OAuth authentication
      console.log('[OAuth Callback] Processing OAuth authentication with code');
      const result = await this.oauthAuthService.processOAuthAuthentication(code);

      // Create mobile app redirect URL with tokens
      const mobileRedirectUrl = this.oauthAuthService.createMobileRedirectUrl(result);
      
      // Return HTML that triggers deep link instead of HTTP redirect (prevents clients from following non-HTTP protocols)
      console.log('[OAuth Callback] Redirecting to deep link (success):', mobileRedirectUrl);
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url='${mobileRedirectUrl}'" /><title>Redirecting…</title><script>location.href='${mobileRedirectUrl}';</script></head><body>
      <p>Redirecting to app… If nothing happens, <a href="${mobileRedirectUrl}">tap here</a>.</p>
      </body></html>`;
      return response.status(HttpStatus.OK).type('text/html').send(html);
    } catch (error: any) {
      const errorUrl = `iscaevential://auth?error=${encodeURIComponent(error.message || 'Failed to process OAuth callback')}&success=false`;
      console.error('[OAuth Callback] Exception while handling callback:', error?.message, error?.stack);
      console.log('[OAuth Callback] Redirecting to deep link (exception):', errorUrl);
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url='${errorUrl}'" /><title>Redirecting…</title><script>location.href='${errorUrl}';</script></head><body>
      <p>Redirecting to app… If nothing happens, <a href="${errorUrl}">tap here</a>.</p>
      </body></html>`;
      return response.status(HttpStatus.OK).type('text/html').send(html);
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

  /**
   * Manual SSO sync - Re-sync user's course registrations from external API
   * This can be called anytime to refresh events and registrations
   */
  @Post('sync')
  @UseGuards(JwtAuthGuard)
  async syncSSOData(
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestException('User ID not found in request');
      }

      const syncResult = await this.ssoSyncService.manualSync(userId);

      return response.status(HttpStatus.OK).json({
        success: true,
        message: syncResult.message,
        data: {
          eventsCreated: syncResult.eventsCreated,
          eventsUpdated: syncResult.eventsUpdated,
          registrationsCreated: syncResult.registrationsCreated,
          userInfo: syncResult.userInfo,
          events: syncResult.events,
          registrations: syncResult.registrations,
          errors: syncResult.errors,
        },
      });
    } catch (error: any) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Failed to sync SSO data',
      });
    }
  }
}
