import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, AuthProvider, UserRole } from '../user/users.entity';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';

@Injectable()
export class OAuthAuthService {
  private readonly salesforceConfig = {
    clientId: process.env.SALESFORCE_CLIENT_ID || '',
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET || '',
    redirectUri: process.env.SALESFORCE_REDIRECT_URI || 'https://events.isca.org.sg:5000/api/auth/oauth/callback',
    scope: process.env.SALESFORCE_SCOPE || 'id profile email openid',
    instanceUrl: process.env.SALESFORCE_INSTANCE_URL || 'https://eservices-isca--fuat.sandbox.my.site.com',
    authorizationUrl: `${process.env.SALESFORCE_INSTANCE_URL || 'https://eservices-isca--fuat.sandbox.my.site.com'}/event/services/oauth2/authorize`,
    tokenUrl: `${process.env.SALESFORCE_INSTANCE_URL || 'https://eservices-isca--fuat.sandbox.my.site.com'}/event/services/oauth2/token`,
    userInfoUrl: `${process.env.SALESFORCE_INSTANCE_URL || 'https://eservices-isca--fuat.sandbox.my.site.com'}/event/services/oauth2/userinfo`,
  };


  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  /**
   * Generate OAuth 2.0 authorization URL
   */
  generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.salesforceConfig.clientId,
      response_type: 'code',
      redirect_uri: this.salesforceConfig.redirectUri,
      scope: this.salesforceConfig.scope,
      state: state || this.generateState(),
    });

    return `${this.salesforceConfig.authorizationUrl}?${params.toString()}`;
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
      console.log('Token exchange data:', tokenData)
      console.log('Token URL:', this.salesforceConfig.tokenUrl)

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

      console.log('Salesforce token response:', response.data);

      if (!access_token) {
        throw new UnauthorizedException('Failed to obtain access token');
      }

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        idToken: id_token,
      };
    } catch (error: any) {
      console.error('OAuth token exchange error:', error.response?.data || error.message);
      console.error('Full error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
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

      console.log('Salesforce user info response:', response.data);

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
      console.error('OAuth user info error:', error.response?.data || error.message);
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

      if (!user) {
        // Create new user entry
        console.log(`Creating new user for email: ${userInfo.email}`);
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
        console.log(`New user created with ID: ${user.id}`);
      } else {
        // Update existing user
        console.log(`User exists in database: ${user.email}, updating SSO info`);
        user.authProvider = AuthProvider.OAUTH;
        user.socialId = userInfo.id;
        user.isVerify = true;
        if (userInfo.firstName) user.firstName = userInfo.firstName;
        if (userInfo.lastName) user.lastName = userInfo.lastName;
        await this.userRepository.save(user);
        console.log(`Existing user updated with ID: ${user.id}`);
      }

      // Generate our own JWT tokens
      const jwtAccessToken = this.generateAccessToken(user);
      const jwtRefreshToken = this.generateRefreshToken(user);

      // Store both Salesforce tokens and our JWT tokens with user
      user.refreshToken = jwtRefreshToken;
      user.socialAccessToken = tokens.accessToken;
      user.socialRefreshToken = tokens.refreshToken;
      await this.userRepository.save(user);

      const isNewUser = user.id === undefined;
      
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
      console.error('OAuth authentication error:', error);
      throw new UnauthorizedException('OAuth authentication failed');
    }
  }


  /**
   * Revoke access token
   */
  async revokeToken(token: string): Promise<boolean> {
    try {
      const revokeUrl = `${this.salesforceConfig.instanceUrl}/event/services/oauth2/revoke`;
      
      await axios.post(revokeUrl, new URLSearchParams({
        token: token,
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return true;
    } catch (error: any) {
      console.error('OAuth token revocation error:', error.response?.data || error.message);
      return false;
    }
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const tokenData = {
        client_id: this.salesforceConfig.clientId,
        client_secret: this.salesforceConfig.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
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

      const { access_token, refresh_token } = response.data;

      return {
        accessToken: access_token,
        refreshToken: refresh_token || refreshToken,
      };
    } catch (error: any) {
      console.error('OAuth token refresh error:', error.response?.data || error.message);
      throw new UnauthorizedException('Failed to refresh access token');
    }
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
}
