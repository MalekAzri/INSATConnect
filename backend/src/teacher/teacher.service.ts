import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';



@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}


  // ROOMS
  createRoom(dto: CreateRoomDto) {
    return this.prisma.room.create({
      // cast to any to satisfy Prisma's generated types; ensure DTO contains required fields at runtime
      data: dto as any,
    });
  }

  getRooms() {
    return this.prisma.room.findMany({
      include: {
        posts: true,
        homeworks: true,
      },
    });
  }

  getRoomById(id: string) {
    return this.prisma.room.findUnique({
      where: { id },
      include: {
        posts: true,
        homeworks: true,
      },
    });
  }

  updateRoom(id: string, dto: UpdateRoomDto) {
  return this.prisma.room.update({
    where: { id },
    data: dto,
  });
}

deleteRoom(id: string) {
  return this.prisma.room.delete({
    where: { id },
  });
}

  

  // POSTS
  createPost(roomId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        content: dto.content,
        type: dto.type ?? 'announcement',
        roomId,
      },
    });
  }

  updatePost(id: string, dto: UpdatePostDto) {
  return this.prisma.post.update({
    where: { id },
    data: dto,
  });
}

deletePost(id: string) {
  return this.prisma.post.delete({
    where: { id },
  });
}

  // HOMEWORKS
  createHomework(roomId: string, dto: CreateHomeworkDto) {
    return this.prisma.homework.create({
      data: {
        title: dto.title,
        description: dto.description,
        deadline: new Date(dto.deadline),
        roomId,
      },
    });
  }

  updateHomework(id: string, dto: UpdateHomeworkDto) {
  return this.prisma.homework.update({
    where: { id },
    data: {
      ...dto,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
    },
  });
}

deleteHomework(id: string) {
  return this.prisma.homework.delete({
    where: { id },
  });
}
}