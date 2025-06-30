import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, AuthProvider, UserRole } from '../user/users.entity';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

@Injectable()
export class SocialAuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
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

  async googleLogin(idToken: string) {

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
  
      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const { email, given_name, family_name, picture, sub } = payload;

      let user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user) {
        // Create new user
        user = this.userRepository.create({
          email : email,
          role: UserRole.User, // Set default role if not provide
          firstName: given_name || '',
          lastName: family_name || '',
          profilePicture: picture,
          password: '',
          authProvider: AuthProvider.GOOGLE,
          socialId: sub,
          isVerify: true, // Google users are pre-verified
        });
      } else {
        // Update existing user with Google info
        user.authProvider = AuthProvider.GOOGLE;
        user.socialId = sub;
        user.isVerify = true;
        if (picture) user.profilePicture = picture;
      }

      const refreshToken = this.generateRefreshToken(user);
      user.refreshToken = refreshToken;
      await this.userRepository.save(user);

      return {
        message: 'Google login successful',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profilePicture: user.profilePicture,
          isVerify: user.isVerify,
        },
        accessToken: this.generateAccessToken(user),
        refreshToken,
      };
    } catch (error) {
        console.log(error,"%%%%%error%%%%%%");
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  async facebookLogin(accessToken: string) {
    try {
      // Validate access token
      if (!accessToken) {
        throw new BadRequestException('Facebook access token is required');
      }

      // Get user data from Facebook Graph API (without email first)
      const response = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,picture.type(large)&access_token=${accessToken}`
      );

      const { id, name, picture } = response.data;

      // Validate required fields
      if (!id) {
        throw new BadRequestException('Facebook user ID is required');
      }

      if (!name) {
        throw new BadRequestException('Name is required from Facebook');
      }

      // Try to get email separately (if user has granted permission)
      let email = null;
      try {
        const emailResponse = await axios.get(
          `https://graph.facebook.com/me?fields=email&access_token=${accessToken}`
        );
        email = emailResponse.data.email;
      } catch (emailError) {
        console.log('Email permission not granted or not available');
      }

      // Check if user already exists (by Facebook ID first)
      let user = await this.userRepository.findOne({
        where: { socialId: id, authProvider: AuthProvider.FACEBOOK },
      });

      // If not found by social ID, try email
      if (!user && email) {
        user = await this.userRepository.findOne({
          where: { email },
        });
      }

      // Split name into first and last name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      if (!user) {
        // Create new user with fallback email if not available
        const userEmail = email || `fb_${id}@facebook.com`;
        
        user = this.userRepository.create({
          email: userEmail,
          firstName,
          lastName,
          profilePicture: picture?.data?.url || null,
          authProvider: AuthProvider.FACEBOOK,
          socialId: id,
          isVerify: true,
          password: '', // Empty password for social login
          role: UserRole.User, // Set default role
        });
      } else {
        // Update existing user with Facebook info
        user.authProvider = AuthProvider.FACEBOOK;
        user.socialId = id;
        user.isVerify = true;
        if (picture?.data?.url) {
          user.profilePicture = picture.data.url;
        }
        // Update name if not already set
        if (!user.firstName && firstName) {
          user.firstName = firstName;
        }
        if (!user.lastName && lastName) {
          user.lastName = lastName;
        }
        // Update email if available and not a fallback email
        if (email && !user.email.includes('@facebook.com')) {
          user.email = email;
        }
      }

      // Generate tokens
      const refreshToken = this.generateRefreshToken(user);
      user.refreshToken = refreshToken;
      
      // Save user
      await this.userRepository.save(user);

      return {
        message: 'Facebook login successful',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profilePicture: user.profilePicture,
          isVerify: user.isVerify,
          role: user.role,
        },
        accessToken: this.generateAccessToken(user),
        refreshToken,
      };
    } catch (error:any) {
      console.error('Facebook login error:', error);
      
      // Handle specific Facebook API errors
      if (error.response?.data?.error) {
        const fbError = error.response.data.error;
        if (fbError.code === 190) {
          throw new UnauthorizedException('Invalid Facebook access token');
        } else if (fbError.code === 200) {
          throw new BadRequestException('Facebook permissions not granted. Please grant email permission.');
        }
      }
      
      // Handle axios errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new UnauthorizedException('Unable to connect to Facebook. Please try again.');
      }
      
      throw new UnauthorizedException('Facebook authentication failed. Please try again.');
    }
  }

  async appleLogin(identityToken: string) {
    try {
      // Verify Apple ID token (you'll need to implement JWT verification)
      // For now, we'll decode it to get user info
      const decoded = this.jwtService.decode(identityToken) as any;
      
      if (!decoded || !decoded.email) {
        throw new UnauthorizedException('Invalid Apple token');
      }

      const { email, sub } = decoded;

      let user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user) {
        // Create new user
        user = this.userRepository.create({
          email,
          firstName: 'Apple', // Apple doesn't provide name in token
          lastName: 'User',
          authProvider: AuthProvider.APPLE,
          socialId: sub,
          isVerify: true,
        });
      } else {
        // Update existing user
        user.authProvider = AuthProvider.APPLE;
        user.socialId = sub;
        user.isVerify = true;
      }

      const refreshToken = this.generateRefreshToken(user);
      user.refreshToken = refreshToken;
      await this.userRepository.save(user);

      return {
        message: 'Apple login successful',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profilePicture: user.profilePicture,
          isVerify: user.isVerify,
        },
        accessToken: this.generateAccessToken(user),
        refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Apple authentication failed');
    }
  }

  async linkedinLogin(accessToken: string) {
    try {
      // Validate access token
      if (!accessToken) {
        throw new BadRequestException('LinkedIn access token is required');
      }

      // Get user data from LinkedIn API
      const userResponse = await axios.get(
        'https://api.linkedin.com/v2/me',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      const { id, firstName, lastName, profilePicture } = userResponse.data;

      // Get email from LinkedIn API (requires additional permission)
      let email = null;
      try {
        const emailResponse = await axios.get(
          'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0'
            }
          }
        );
        
        if (emailResponse.data.elements && emailResponse.data.elements.length > 0) {
          email = emailResponse.data.elements[0]['handle~'].emailAddress;
        }
      } catch (emailError) {
        console.log('Email permission not granted or not available');
      }

      // Validate required fields
      if (!id) {
        throw new BadRequestException('LinkedIn user ID is required');
      }

      if (!firstName || !lastName) {
        throw new BadRequestException('Name is required from LinkedIn');
      }

      // Check if user already exists (by LinkedIn ID first)
      let user = await this.userRepository.findOne({
        where: { socialId: id, authProvider: AuthProvider.LINKEDIN },
      });

      // If not found by social ID, try email
      if (!user && email) {
        user = await this.userRepository.findOne({
          where: { email },
        });
      }

      // Extract name components
      const firstNameValue = firstName.localized?.en_US || firstName || '';
      const lastNameValue = lastName.localized?.en_US || lastName || '';

      if (!user) {
        // Create new user with fallback email if not available
        const userEmail = email || `li_${id}@linkedin.com`;
        
        user = this.userRepository.create({
          email: userEmail,
          firstName: firstNameValue,
          lastName: lastNameValue,
          profilePicture: profilePicture?.displayImage || null,
          authProvider: AuthProvider.LINKEDIN,
          socialId: id,
          isVerify: true,
          password: '', // Empty password for social login
          role: UserRole.User, // Set default role
        });
      } else {
        // Update existing user with LinkedIn info
        user.authProvider = AuthProvider.LINKEDIN;
        user.socialId = id;
        user.isVerify = true;
        if (profilePicture?.displayImage) {
          user.profilePicture = profilePicture.displayImage;
        }
        // Update name if not already set
        if (!user.firstName && firstNameValue) {
          user.firstName = firstNameValue;
        }
        if (!user.lastName && lastNameValue) {
          user.lastName = lastNameValue;
        }
        // Update email if available and not a fallback email
        if (email && !user.email.includes('@linkedin.com')) {
          user.email = email;
        }
      }

      // Generate tokens
      const refreshToken = this.generateRefreshToken(user);
      user.refreshToken = refreshToken;
      
      // Save user
      await this.userRepository.save(user);

      return {
        message: 'LinkedIn login successful',
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profilePicture: user.profilePicture,
          isVerify: user.isVerify,
          role: user.role,
        },
        accessToken: this.generateAccessToken(user),
        refreshToken,
      };
    } catch (error: any) {
      console.error('LinkedIn login error:', error);
      
      // Handle specific LinkedIn API errors
      if (error.response?.data?.error) {
        const liError = error.response.data.error;
        if (liError.code === 401) {
          throw new UnauthorizedException('Invalid LinkedIn access token');
        } else if (liError.code === 403) {
          throw new BadRequestException('LinkedIn permissions not granted. Please grant required permissions.');
        }
      }
      
      // Handle axios errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new UnauthorizedException('Unable to connect to LinkedIn. Please try again.');
      }
      
      throw new UnauthorizedException('LinkedIn authentication failed. Please try again.');
    }
  }

}
