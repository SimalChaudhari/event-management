import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { EngagementQnaController } from './engagement-qna.controller';
import { EngagementQnaService } from './engagement-qna.service';
import { EngagementQnaQuestion, EngagementQnaLike } from './engagement-qna.entity';
import { Engagement } from '../engagement/engagement.entity';
import { UserEntity } from '../user/users.entity';
import { RegisterEvent } from '../registerEvent/registerEvent.entity';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { EngagementModule } from '../engagement/engagement.module';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EngagementQnaQuestion,
      EngagementQnaLike,
      Engagement,
      UserEntity,
      RegisterEvent,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
    forwardRef(() => EngagementModule),
    UtilsModule,
  ],
  controllers: [EngagementQnaController],
  providers: [EngagementQnaService, ErrorHandlerService],
  exports: [EngagementQnaService],
})
export class EngagementQnaModule {}

