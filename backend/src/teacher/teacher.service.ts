import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { SubmitHomeworkDto } from './dto/submit-homework.dto';
import { NotificationsService } from '../admin-agent/notifications/notifications.service';
import { NotificationRole } from '../admin-agent/common/enums/notification-role.enum';

@Injectable()
export class TeacherService {
  private readonly logger = new Logger(TeacherService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // ROOMS
  createRoom(dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: { name: dto.name, targetYear: dto.targetYear, teacherId: dto.teacherId },
    });
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

  getRoomsByYear(year: string) {
    return this.prisma.room.findMany({
      where: { targetYear: year.trim().toUpperCase() },
      include: { posts: true, homeworks: true },
    });
  }

  getHomeworksByYear(year: string) {
    return this.prisma.homework.findMany({
      where: { room: { targetYear: year.trim().toUpperCase() } },
      include: { room: true },
      orderBy: { deadline: 'asc' },
    });
  }

  // POSTS
  async createPost(roomId: string, dto: CreatePostDto) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    const post = await this.prisma.post.create({
      data: { content: dto.content, type: dto.type ?? 'announcement', author: dto.author ?? '', roomId },
      include: { comments: true },
    });
    if (room && dto.type && dto.type !== 'announcement') {
      this.notificationsService.publish({
        type: 'room.new.post',
        message: `Nouvelle publication de ${dto.author || 'un étudiant'} dans "${room.name}"`,
        role: NotificationRole.TEACHER,
        targetUserId: room.teacherId,
        data: { roomId, roomName: room.name, postId: post.id, author: dto.author ?? '', content: dto.content.slice(0, 120) },
      }).catch(err => this.logger.error('publish post notification failed', err));
    }
    return post;
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

  async createComment(postId: string, dto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({ where: { id: postId }, include: { room: true } });
    const comment = await this.prisma.postComment.create({
      data: { content: dto.content, authorName: dto.authorName, postId },
    });
    if (post?.room) {
      this.notificationsService.publish({
        type: 'room.new.comment',
        message: `Nouveau commentaire de ${dto.authorName || 'un étudiant'} dans "${post.room.name}"`,
        role: NotificationRole.TEACHER,
        targetUserId: post.room.teacherId,
        data: { roomId: post.room.id, roomName: post.room.name, postId, author: dto.authorName, content: dto.content.slice(0, 120) },
      }).catch(err => this.logger.error('publish comment notification failed', err));
    }
    return comment;
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
