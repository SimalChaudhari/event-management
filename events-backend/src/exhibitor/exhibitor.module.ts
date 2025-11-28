import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exhibitor } from './exhibitor.entity';
import { ExhibitorService } from './exhibitor.service';
import { ExhibitorController } from './exhibitor.controller';
import { ErrorHandlerService } from 'utils/services/error-handler.service';
import { JwtModule } from '@nestjs/jwt';
import { EventModule } from '../event/event.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Exhibitor]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { },
        }),
        forwardRef(() => EventModule),
    ],
    providers: [ExhibitorService, ErrorHandlerService],
    controllers: [ExhibitorController],
    exports: [ExhibitorService],
})
export class ExhibitorModule {}
