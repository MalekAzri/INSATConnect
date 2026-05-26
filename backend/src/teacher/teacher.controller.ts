import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SubmitHomeworkDto } from './dto/submit-homework.dto';

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
  createPost(@Param('id') id: string, @Body() dto: CreatePostDto) {
    return this.teacherService.createPost(id, dto);
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
  submitHomework(@Param('homeworkId') homeworkId: string, @Body() dto: SubmitHomeworkDto) {
    return this.teacherService.submitHomework(homeworkId, dto);
  }

  @Get('homeworks/:homeworkId/submitted')
  hasSubmitted(
    @Param('homeworkId') homeworkId: string,
    @Query('studentName') studentName: string,
  ) {
    return this.teacherService.hasSubmitted(homeworkId, studentName);
  }
}
