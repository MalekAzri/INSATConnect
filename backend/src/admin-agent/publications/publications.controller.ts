import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { ListPublicationsQueryDto } from './dto/list-publications.query.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { PublicationsService } from './publications.service';

const uploadsDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}
// Configuration Multer pour les uploads de publications
const publicationUploadConfig = {
  storage: diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) =>
      cb(null, `${randomUUID()}${extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
};

@Controller('admin-agent/publications')
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', publicationUploadConfig))
  create(
    @Body() dto: CreatePublicationDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.publicationsService.create(dto, file);
  }

  @Get()
  findAll(@Query() query: ListPublicationsQueryDto) {
    return this.publicationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.publicationsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', publicationUploadConfig))
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePublicationDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.publicationsService.update(id, dto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.publicationsService.remove(id);
  }
}
