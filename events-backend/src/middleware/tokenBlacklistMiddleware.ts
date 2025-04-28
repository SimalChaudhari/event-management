import { Injectable, NestMiddleware } from '@nestjs/common';
import { AuthService } from 'auth/auth.service';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TokenBlacklistMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token && await this.authService.isTokenBlacklisted(token)) {
        return res.status(401).json({
          success: false,
          message: 'Token is no longer valid. Please login again.',
        });
      }
    }
    next();
  }
}