import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exhibitor } from './exhibitor.entity';
import { ExhibitorService } from './exhibitor.service';
import { ExhibitorController } from './exhibitor.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Exhibitor])],
    providers: [ExhibitorService],
    controllers: [ExhibitorController],
    exports: [ExhibitorService],
})
export class ExhibitorModule {}
