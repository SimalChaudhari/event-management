import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CsvUploadLogEntity } from './csv-upload-log.entity';
import { CsvUploadLogService } from './csv-upload-log.service';
import { CsvUploadLogController } from './csv-upload-log.controller';
import { JwtAuthModule } from '../jwt/jwt-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CsvUploadLogEntity]),
    JwtAuthModule, // Import JwtAuthModule to use JwtAuthGuard
  ],
  providers: [CsvUploadLogService],
  controllers: [CsvUploadLogController],
  exports: [CsvUploadLogService],
})
export class CsvUploadLogModule {}

