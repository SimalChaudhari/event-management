import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { Reflector, ModuleRef } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import { UserService } from '../user/users.service';

@Injectable()
export class JwtAuthGuard implements CanActivate, OnModuleInit {
    private jwtService!: JwtService;
    private userService!: UserService;

    constructor(
        private readonly moduleRef: ModuleRef,
        private readonly reflector: Reflector,
    ) {}

    onModuleInit() {
        // Get JwtService and UserService dynamically to avoid dependency injection issues
        this.jwtService = this.moduleRef.get(JwtService, { strict: false });
        this.userService = this.moduleRef.get(UserService, { strict: false });
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        
        if (isPublic) {
            return true;
        }

        // Get JwtService and UserService if not already initialized (lazy loading fallback)
        if (!this.jwtService) {
            this.jwtService = this.moduleRef.get(JwtService, { strict: false });
        }
        if (!this.userService) {
            this.userService = this.moduleRef.get(UserService, { strict: false });
        }

        const request: Request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
    
        if (!token) throw new UnauthorizedException('Token is required for authentication');

        try {
            const decoded = this.jwtService.verify(token,{ secret: process.env.JWT_SECRET });
              // Ensure the token is an access token by checking specific claims
              if (!decoded || !decoded.sub || !decoded.email) {
                throw new UnauthorizedException('Invalid access token');
            }
            
            // Verify that the user exists in the database
            const userId = decoded.sub || decoded.id;
            if (userId) {
                try {
                    await this.userService.getById(userId);
                } catch (error) {
                    throw new UnauthorizedException('User not found. Please login again.');
                }
            }
            
            request.user = decoded;
            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    private extractTokenFromHeader(request: Request): string | null {
        const [_, token] = request.headers.authorization?.split(' ') ?? [];
        return token || null;
    }
}
