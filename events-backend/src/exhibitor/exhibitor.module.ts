import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exhibitor } from './exhibitor.entity';
import { UserEntity } from '../user/users.entity';
import { ExhibitorService } from './exhibitor.service';
import { ExhibitorController } from './exhibitor.controller';
import { ErrorHandlerService } from 'utils/services/error-handler.service';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from 'service/email.service';

@Module({
    imports: [TypeOrmModule.forFeature([Exhibitor, UserEntity]),
    JwtModule.register({
        secret: process.env.JWT_SECRET,
        signOptions: { },
      }),
],
    providers: [ExhibitorService, ErrorHandlerService, EmailService],
    controllers: [ExhibitorController],
    exports: [ExhibitorService],
})
export class ExhibitorModule {}
