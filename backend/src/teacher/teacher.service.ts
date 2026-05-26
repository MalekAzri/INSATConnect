import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SubmitHomeworkDto } from './dto/submit-homework.dto';

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}

  // ROOMS
  createRoom(dto: CreateRoomDto) {
    return this.prisma.room.create({ data: dto as any });
  }

  getRooms() {
    return this.prisma.room.findMany({
      include: {
        posts: { include: { comments: true } },
        homeworks: { include: { submissions: true } },
      },
    });
  }

  getRoomById(id: string) {
    return this.prisma.room.findUnique({
      where: { id },
      include: {
        posts: { include: { comments: true } },
        homeworks: { include: { submissions: true } },
      },
    });
  }

  updateRoom(id: string, dto: UpdateRoomDto) {
    return this.prisma.room.update({ where: { id }, data: dto });
  }

  deleteRoom(id: string) {
    return this.prisma.room.delete({ where: { id } });
  }

  // POSTS
  createPost(roomId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: { content: dto.content, type: dto.type ?? 'announcement', roomId },
      include: { comments: true },
    });
  }

  updatePost(id: string, dto: UpdatePostDto) {
    return this.prisma.post.update({ where: { id }, data: dto });
  }

  deletePost(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }

  // COMMENTS
  async getComments(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException(`Post ${postId} introuvable`);
    return this.prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });
  }

  createComment(postId: string, dto: CreateCommentDto) {
    return this.prisma.postComment.create({
      data: { content: dto.content, authorName: dto.authorName, postId },
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
      include: { submissions: true },
    });
  }

  updateHomework(id: string, dto: UpdateHomeworkDto) {
    return this.prisma.homework.update({
      where: { id },
      data: { ...dto, deadline: dto.deadline ? new Date(dto.deadline) : undefined },
    });
  }

  deleteHomework(id: string) {
    return this.prisma.homework.delete({ where: { id } });
  }

  // HOMEWORK SUBMISSIONS
  async getHomeworkSubmissions(homeworkId: string) {
    const hw = await this.prisma.homework.findUnique({ where: { id: homeworkId } });
    if (!hw) throw new NotFoundException(`Devoir ${homeworkId} introuvable`);
    return this.prisma.homeworkSubmission.findMany({
      where: { homeworkId },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async submitHomework(homeworkId: string, dto: SubmitHomeworkDto) {
    const hw = await this.prisma.homework.findUnique({ where: { id: homeworkId } });
    if (!hw) throw new NotFoundException(`Devoir ${homeworkId} introuvable`);
    const existing = await this.prisma.homeworkSubmission.findFirst({
      where: { homeworkId, studentName: dto.studentName },
    });
    if (existing) return existing;
    return this.prisma.homeworkSubmission.create({
      data: { studentName: dto.studentName, homeworkId },
    });
  }

  async hasSubmitted(homeworkId: string, studentName: string): Promise<boolean> {
    const existing = await this.prisma.homeworkSubmission.findFirst({
      where: { homeworkId, studentName },
    });
    return !!existing;
  }
}
