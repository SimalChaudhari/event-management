import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTemplateController } from './email-template.controller';
import { EmailTemplateService } from './email-template.service';
import { EmailTemplate } from './email-template.entity';
import { JwtModule } from '@nestjs/jwt';
import { ErrorHandlerService } from '../utils/services/error-handler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailTemplate]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
  ],
  controllers: [EmailTemplateController],
  providers: [EmailTemplateService, ErrorHandlerService],
  exports: [EmailTemplateService],
})
export class EmailTemplateModule {}

