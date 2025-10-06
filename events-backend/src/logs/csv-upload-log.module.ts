import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CsvUploadLogEntity } from './csv-upload-log.entity';
import { CsvUploadLogService } from './csv-upload-log.service';
import { CsvUploadLogController } from './csv-upload-log.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([CsvUploadLogEntity]),

    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {},
    }),
  ],
  providers: [CsvUploadLogService],
  controllers: [CsvUploadLogController],
  exports: [CsvUploadLogService],
})
export class CsvUploadLogModule {}

