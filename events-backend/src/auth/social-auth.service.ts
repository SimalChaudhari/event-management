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
      const response = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
      );

      const { id, name, email, picture } = response.data;

      if (!email) {
        throw new BadRequestException('Email is required from Facebook');
      }

      let user = await this.userRepository.findOne({
        where: { email },
      });

      const [firstName, lastName] = name.split(' ');

      if (!user) {
        // Create new user
        user = this.userRepository.create({
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          profilePicture: picture?.data?.url,
          authProvider: AuthProvider.FACEBOOK,
          socialId: id,
          isVerify: true,
        });
      } else {
        // Update existing user
        user.authProvider = AuthProvider.FACEBOOK;
        user.socialId = id;
        user.isVerify = true;
        if (picture?.data?.url) user.profilePicture = picture.data.url;
      }

      const refreshToken = this.generateRefreshToken(user);
      user.refreshToken = refreshToken;
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
        },
        accessToken: this.generateAccessToken(user),
        refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Facebook authentication failed');
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
      const response = await axios.get(
        'https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const { id, firstName, lastName, profilePicture } = response.data;

      // Get email from LinkedIn
      const emailResponse = await axios.get(
        'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const email = emailResponse.data.elements[0]['handle~'].emailAddress;

      let user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user) {
        // Create new user
        user = this.userRepository.create({
          email,
          firstName: firstName.localized.en_US || '',
          lastName: lastName.localized.en_US || '',
          profilePicture: profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
          authProvider: AuthProvider.LINKEDIN,
          socialId: id,
          isVerify: true,
        });
      } else {
        // Update existing user
        user.authProvider = AuthProvider.LINKEDIN;
        user.socialId = id;
        user.isVerify = true;
        if (profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier) {
          user.profilePicture = profilePicture['displayImage~'].elements[0].identifiers[0].identifier;
        }
      }

      const refreshToken = this.generateRefreshToken(user);
      user.refreshToken = refreshToken;
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
        },
        accessToken: this.generateAccessToken(user),
        refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('LinkedIn authentication failed');
    }
  }
}