import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaCategory } from './agenda-category.entity';
import { EventAgenda } from './agenda.entity';
import { AgendaCategoryService } from './agenda-category.service';
import { AgendaCategoryController } from './agenda-category.controller';
import { ErrorHandlerService } from '../utils/services/error-handler.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgendaCategory, EventAgenda]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
  ],
  controllers: [AgendaCategoryController],
  providers: [AgendaCategoryService, ErrorHandlerService],
  exports: [AgendaCategoryService],
})
export class AgendaCategoryModule {}
