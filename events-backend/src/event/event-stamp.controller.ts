import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../jwt/roles.guard';
import { Roles } from '../jwt/roles.decorator';
import { EventStampService } from './event-stamp.service';
import { CreateEventStampDto, UpdateEventStampDto } from './event-stamp.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UserRole } from 'user/users.entity';

@Controller('api/event-stamps')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventStampController {
  constructor(private readonly eventStampService: EventStampService) {}

  @Post()
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/eventStamps',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async create(
    @Body() createEventStampDto: CreateEventStampDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    if (file) {
      createEventStampDto.image = `uploads/eventStamps/${file.filename}`;
    }
    return await this.eventStampService.create(createEventStampDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.User)
  async findAll() {
    return await this.eventStampService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.User)
  async findOne(@Param('id') id: string) {
    return await this.eventStampService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/eventStamps',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updateEventStampDto: UpdateEventStampDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    if (file) {
      updateEventStampDto.image = `uploads/eventStamps/${file.filename}`;
    }
    return await this.eventStampService.update(id, updateEventStampDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  async remove(@Param('id') id: string) {
    await this.eventStampService.remove(id);
    return { message: 'Event stamp deleted successfully' };
  }
}
