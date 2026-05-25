import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';



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
updateRoom(
  @Param('id') id: string,
  @Body() dto: UpdateRoomDto,
) {
  return this.teacherService.updateRoom(id, dto);
}

@Delete('rooms/:id')
deleteRoom(@Param('id') id: string) {
  return this.teacherService.deleteRoom(id);
}

  // POSTS
  @Post('rooms/:id/posts')
  createPost(
    @Param('id') id: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.teacherService.createPost(id, dto);
  }

  @Patch('posts/:id')
updatePost(
  @Param('id') id: string,
  @Body() dto: UpdatePostDto,
) {
  return this.teacherService.updatePost(id, dto);
}

@Delete('posts/:id')
deletePost(@Param('id') id: string) {
  return this.teacherService.deletePost(id);
}

  // HOMEWORKS
  @Post('rooms/:id/homeworks')
  createHomework(
    @Param('id') id: string,
    @Body() dto: CreateHomeworkDto,
  ) {
    return this.teacherService.createHomework(id, dto);
  }

  @Patch('homeworks/:id')
updateHomework(
  @Param('id') id: string,
  @Body() dto: UpdateHomeworkDto,
) {
  return this.teacherService.updateHomework(id, dto);
}

@Delete('homeworks/:id')
deleteHomework(@Param('id') id: string) {
  return this.teacherService.deleteHomework(id);
}
}