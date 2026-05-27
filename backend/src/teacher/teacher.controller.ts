import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { TeacherService } from './teacher.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SubmitHomeworkDto } from './dto/submit-homework.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const homeworkUploadsDir = join(process.cwd(), 'uploads', 'homeworks');
if (!existsSync(homeworkUploadsDir)) {
  mkdirSync(homeworkUploadsDir, { recursive: true });
}

const roomPostUploadsDir = join(process.cwd(), 'uploads', 'room-posts');
if (!existsSync(roomPostUploadsDir)) {
  mkdirSync(roomPostUploadsDir, { recursive: true });
}

const homeworkUploadConfig = {
  storage: diskStorage({
    destination: (_req, _file, cb) => cb(null, homeworkUploadsDir),
    filename: (_req, file, cb) =>
      cb(null, `${randomUUID()}${extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
};

const roomPostUploadConfig = {
  storage: diskStorage({
    destination: (_req, _file, cb) => cb(null, roomPostUploadsDir),
    filename: (_req, file, cb) =>
      cb(null, `${randomUUID()}${extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
};

@UseGuards(JwtAuthGuard)
@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // ROOMS
  @Post('rooms')
  createRoom(@Body() dto: CreateRoomDto) {
    return this.teacherService.createRoom(dto);
  }

  @Get('rooms')
  getRooms() {
    return this.teacherService.getRooms();
  }

  @Get('rooms/year/:year')
  getRoomsByYear(@Param('year') year: string) {
    return this.teacherService.getRoomsByYear(year);
  }

  @Get('rooms/:id')
  getRoom(@Param('id') id: string) {
    return this.teacherService.getRoomById(id);
  }

  @Patch('rooms/:id')
  updateRoom(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.teacherService.updateRoom(id, dto);
  }

  @Delete('rooms/:id')
  deleteRoom(@Param('id') id: string) {
    return this.teacherService.deleteRoom(id);
  }

  // POSTS
  @Post('rooms/:id/posts')
  @UseInterceptors(FileInterceptor('file', roomPostUploadConfig))
  createPost(
    @Param('id') id: string,
    @Body() dto: CreatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.teacherService.createPost(id, dto, file);
  }

  @Patch('posts/:id')
  updatePost(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.teacherService.updatePost(id, dto);
  }

  @Delete('posts/:id')
  deletePost(@Param('id') id: string) {
    return this.teacherService.deletePost(id);
  }

  // COMMENTS
  @Get('posts/:postId/comments')
  getComments(@Param('postId') postId: string) {
    return this.teacherService.getComments(postId);
  }

  @Post('posts/:postId/comments')
  createComment(@Param('postId') postId: string, @Body() dto: CreateCommentDto) {
    return this.teacherService.createComment(postId, dto);
  }

  // HOMEWORKS
  @Get('homeworks/year/:year')
  getHomeworksByYear(@Param('year') year: string) {
    return this.teacherService.getHomeworksByYear(year);
  }

  @Post('rooms/:id/homeworks')
  createHomework(@Param('id') id: string, @Body() dto: CreateHomeworkDto) {
    return this.teacherService.createHomework(id, dto);
  }

  @Patch('homeworks/:id')
  updateHomework(@Param('id') id: string, @Body() dto: UpdateHomeworkDto) {
    return this.teacherService.updateHomework(id, dto);
  }

  @Delete('homeworks/:id')
  deleteHomework(@Param('id') id: string) {
    return this.teacherService.deleteHomework(id);
  }

  // HOMEWORK SUBMISSIONS
  @Get('homeworks/:homeworkId/submissions')
  getSubmissions(@Param('homeworkId') homeworkId: string) {
    return this.teacherService.getHomeworkSubmissions(homeworkId);
  }

  @Post('homeworks/:homeworkId/submit')
  @UseInterceptors(FileInterceptor('file', homeworkUploadConfig))
  submitHomework(
    @Param('homeworkId') homeworkId: string,
    @Body() dto: SubmitHomeworkDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.teacherService.submitHomework(homeworkId, dto, file);
  }

  @Get('homeworks/:homeworkId/submitted')
  hasSubmitted(
    @Param('homeworkId') homeworkId: string,
    @Query('studentName') studentName: string,
  ) {
    return this.teacherService.hasSubmitted(homeworkId, studentName);
  }
}
