import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CsvUploadLogEntity } from './csv-upload-log.entity';
import { CsvUploadLogService } from './csv-upload-log.service';
import { CsvUploadLogController } from './csv-upload-log.controller';
import { JwtAuthModule } from '../jwt/jwt-auth.module';
import { FilterModule } from '../service/filter.module';
import { UtilsModule } from '../utils/utils.module';
import { ErrorHandlerService } from '../utils/services/error-handler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CsvUploadLogEntity]),
    JwtAuthModule, // Import JwtAuthModule to use JwtAuthGuard
    FilterModule, // Import FilterModule for pagination
    UtilsModule, // Import UtilsModule for ErrorHandlerService
  ],
  providers: [CsvUploadLogService, ErrorHandlerService],
  controllers: [CsvUploadLogController],
  exports: [CsvUploadLogService],
})
export class CsvUploadLogModule {}

