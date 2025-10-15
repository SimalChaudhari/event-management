import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, AuthProvider, UserRole } from '../user/users.entity';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { SSOSyncService } from './sso-sync.service';

@Injectable()
export class OAuthAuthService {
  private readonly salesforceConfig = {
    clientId: process.env.SALESFORCE_CLIENT_ID || '',
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET || '',
    redirectUri: process.env.SALESFORCE_REDIRECT_URI || 'https://events.isca.org.sg:5000/api/auth/oauth/callback',
    mobileRedirectUri: 'iscaevential://auth',
    scope: process.env.SALESFORCE_SCOPE || 'id profile email openid',
    instanceUrl: process.env.SALESFORCE_INSTANCE_URL || 'https://eservices-isca--fuat.sandbox.my.site.com',
    authorizationUrl: `${process.env.SALESFORCE_INSTANCE_URL || 'https://eservices-isca--fuat.sandbox.my.site.com'}/services/oauth2/authorize`,
    tokenUrl: `${process.env.SALESFORCE_INSTANCE_URL || 'https://eservices-isca--fuat.sandbox.my.site.com'}/services/oauth2/token`,
    userInfoUrl: `${process.env.SALESFORCE_INSTANCE_URL || 'https://eservices-isca--fuat.sandbox.my.site.com'}/services/oauth2/userinfo`,
  };


  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
    private ssoSyncService: SSOSyncService,
  ) {}

  /**
   * Generate OAuth 2.0 authorization URL
   */
  generateAuthUrl(state?: string): string {
    // Use the exact URL provided by the user
    // const baseUrl = 'https://eservices-isca--fuat.sandbox.my.site.com/services/oauth2/authorize';
    const baseUrl = 'https://eservices-isca--fuat.sandbox.my.site.com/event/services/oauth2/authorize';
    const params = new URLSearchParams({
      client_id: '3MVG9yj3UGaUlj7luLykaRo9nVJl.l_EnrdUAU2iNLQuRwfFhLcJ5jZ9XbU6KSg7gc6wDDYZ.YGe6W7aesNCZ',
      response_type: 'code',
      redirect_uri: 'https://events.isca.org.sg:5000/api/auth/oauth/callback',
      scope: 'openid profile email api refresh_token',
      state: state || this.generateState(),
    });

    const authUrl = `${baseUrl}?${params.toString()}`;
    
    return authUrl;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    idToken: string;
  }> {
    try {
      const tokenData = {
        client_id: this.salesforceConfig.clientId,
        client_secret: this.salesforceConfig.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.salesforceConfig.redirectUri,
      };

      const response = await axios.post(
        this.salesforceConfig.tokenUrl,
        new URLSearchParams(tokenData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, id_token } = response.data;

      if (!access_token) {
        throw new UnauthorizedException('Failed to obtain access token');
      }

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        idToken: id_token,
      };
    } catch (error: any) {
      // Provide more specific error messages
      if (error.response?.data?.error === 'invalid_grant') {
        throw new UnauthorizedException('Invalid authorization code. The code may have expired or already been used. Please try logging in again.');
      } else if (error.response?.data?.error === 'invalid_client') {
        throw new UnauthorizedException('Invalid client credentials. Please check your Salesforce Connected App configuration.');
      } else if (error.response?.data?.error === 'redirect_uri_mismatch') {
        throw new UnauthorizedException('Redirect URI mismatch. Please check your Salesforce Connected App callback URL.');
      }
      
      throw new UnauthorizedException('Failed to exchange authorization code for token');
    }
  }

  /**
   * Get user information from Salesforce API
   */
  async getUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
  }> {
    try {
      const response = await axios.get(this.salesforceConfig.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const { user_id, email, given_name, family_name, name } = response.data;

      if (!email) {
        throw new UnauthorizedException('Email not found in user profile');
      }

      return {
        id: user_id,
        email: email,
        firstName: given_name || '',
        lastName: family_name || '',
        displayName: name || '',
      };
    } catch (error: any) {
      throw new UnauthorizedException('Failed to retrieve user information');
    }
  }

  /**
   * Process OAuth authentication and create/update user
   */
  async processOAuthAuthentication(code: string): Promise<{
    message: string;
    user: Partial<UserEntity>;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForToken(code);
      
      // Get user information
      const userInfo = await this.getUserInfo(tokens.accessToken);

      // Check if user exists in database
      let user = await this.userRepository.findOne({
        where: { email: userInfo.email },
      });

      let isNewUser = false;

      if (!user) {
        // Create new user entry
        user = this.userRepository.create({
          email: userInfo.email,
          firstName: userInfo.firstName || 'OAuth',
          lastName: userInfo.lastName || 'User',
          mobile: '',
          authProvider: AuthProvider.OAUTH,
          socialId: userInfo.id,
          isVerify: true,
          password: '',
          role: UserRole.User,
        });
        await this.userRepository.save(user);
        isNewUser = true;
      } else {
        // Update existing user
        user.authProvider = AuthProvider.OAUTH;
        user.socialId = userInfo.id;
        user.isVerify = true;
        if (userInfo.firstName) user.firstName = userInfo.firstName;
        if (userInfo.lastName) user.lastName = userInfo.lastName;
        await this.userRepository.save(user);
      }

      // Generate our own JWT tokens
      const jwtAccessToken = this.generateAccessToken(user);
      const jwtRefreshToken = this.generateRefreshToken(user);

     
      // Store both Salesforce tokens and our JWT tokens with user
      user.refreshToken = jwtRefreshToken;
      user.socialAccessToken = tokens.accessToken;
      user.socialRefreshToken = tokens.refreshToken;
      await this.userRepository.save(user);

      // 🔄 AUTOMATIC SSO SYNC: Fetch and sync user's course registrations
      try {
        await this.ssoSyncService.syncSSOUserData(user.id);
      } catch (syncError: any) {
        // Don't fail login if sync fails - continue with login
      }
      
      return {
        message: isNewUser ? 'New user created and logged in successfully' : 'Existing user logged in successfully',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile,
          isVerify: user.isVerify,
          role: user.role,
          authProvider: user.authProvider,
          socialId: user.socialId,
        },
        accessToken: jwtAccessToken,
        refreshToken: jwtRefreshToken,
        isNewUser: isNewUser,
      };
    } catch (error: any) {
      throw new UnauthorizedException('OAuth authentication failed');
    }
  }


  /**
   * Refresh JWT access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify and decode the refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      // Get user from database
      const user = await this.userRepository.findOne({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Update refresh token in database
      user.refreshToken = newRefreshToken;
      await this.userRepository.save(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error: any) {
      throw new UnauthorizedException('Failed to refresh access token');
    }
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateAccessToken(user: UserEntity): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      { expiresIn: '10d', secret: process.env.JWT_SECRET },
    );
  }

  private generateRefreshToken(user: UserEntity): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      { expiresIn: '30d', secret: process.env.REFRESH_TOKEN_SECRET },
    );
  }

  /**
   * Create mobile app redirect URL with authentication tokens
   */
  createMobileRedirectUrl(result: {
    message: string;
    user: Partial<UserEntity>;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }): string {
    const params = new URLSearchParams({
      success: 'true',
      message: result.message,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      isNewUser: result.isNewUser.toString(),
      userId: result.user.id?.toString() || '',
      email: result.user.email || '',
      firstName: result.user.firstName || '',
      lastName: result.user.lastName || '',
    });

    const redirectUrl = `${this.salesforceConfig.mobileRedirectUri}?${params.toString()}`;
    return redirectUrl;
  }

  /**
   * Revoke Salesforce access token (SSO logout)
   * This logs the user out from Salesforce SSO
   */
  async revokeSalesforceToken(accessToken: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const revokeUrl = `${this.salesforceConfig.instanceUrl}/services/oauth2/revoke`;
      
      await axios.post(
        revokeUrl,
        new URLSearchParams({
          token: accessToken,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        success: true,
        message: 'SSO session revoked successfully',
      };
    } catch (error: any) {
      console.error('Failed to revoke Salesforce token:', error.response?.data || error.message);
      // Don't throw error - even if revocation fails, we want to continue with local logout
      return {
        success: false,
        message: 'Failed to revoke SSO session, but local logout will proceed',
      };
    }
  }
}
