import { Module, forwardRef, Global } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserModule } from '../user/users.module';

@Global() // Make this module global so JwtAuthGuard and JwtService are available everywhere
@Module({
  imports: [
    NestJwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
    forwardRef(() => UserModule),
  ],
  providers: [JwtAuthGuard],
  exports: [JwtAuthGuard], // Export JwtAuthGuard (JwtService is automatically available from NestJwtModule.register)
})
export class JwtAuthModule {}

