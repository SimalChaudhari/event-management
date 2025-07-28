import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exhibitor } from './exhibitor.entity';
import { ExhibitorService } from './exhibitor.service';
import { ExhibitorController } from './exhibitor.controller';
import { ErrorHandlerService } from 'utils/services/error-handler.service';

@Module({
    imports: [TypeOrmModule.forFeature([Exhibitor])],
    providers: [ExhibitorService, ErrorHandlerService],
    controllers: [ExhibitorController],
    exports: [ExhibitorService],
})
export class ExhibitorModule {}
