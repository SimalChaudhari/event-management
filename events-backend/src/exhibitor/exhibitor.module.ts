import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exhibitor } from './exhibitor.entity';
import { ExhibitorLead } from './exhibitor-lead.entity';
import { ExhibitorView } from './exhibitor-view.entity';
import { ExhibitorRating } from './exhibitor-rating.entity';
import { BoothBanner } from './booth-banner.entity';
import { ExhibitorService } from './exhibitor.service';
import { ExhibitorController } from './exhibitor.controller';
import { ExhibitorUpdatePermissionGuard } from './exhibitor-update-permission.guard';
import { ErrorHandlerService } from 'utils/services/error-handler.service';
import { JwtModule } from '@nestjs/jwt';
import { EventModule } from '../event/event.module';
import { UserEntity } from '../user/users.entity';
import { Event } from '../event/event.entity';
import { EventStamp } from '../event/event-stamp.entity';
import { EventStampEvent } from '../event/event-stamp-event.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Exhibitor, ExhibitorLead, ExhibitorView, ExhibitorRating, BoothBanner, UserEntity, Event, EventStamp, EventStampEvent]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { },
        }),
        forwardRef(() => EventModule),
    ],
    providers: [ExhibitorService, ErrorHandlerService, ExhibitorUpdatePermissionGuard],
    controllers: [ExhibitorController],
    exports: [ExhibitorService],
})
export class ExhibitorModule {}
