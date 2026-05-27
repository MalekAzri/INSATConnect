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

  private async attachTeacherNames<T extends { teacherId: string }>(
    rooms: T[],
  ): Promise<Array<T & { teacherName: string }>> {
    const numericTeacherIds = Array.from(
      new Set(
        rooms
          .map((room) => room.teacherId?.trim())
          .filter((value): value is string => !!value && /^\d+$/.test(value))
          .map((value) => Number(value)),
      ),
    );

    const teachers = numericTeacherIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: numericTeacherIds } },
          select: { id: true, name: true },
        })
      : [];

    const teacherNameById = new Map(teachers.map((teacher) => [String(teacher.id), teacher.name]));

    return rooms.map((room) => {
      const fallback = room.teacherId?.trim() || 'Enseignant';
      const teacherName = teacherNameById.get(room.teacherId) ?? fallback;
      return { ...room, teacherName };
    });
  }

  async getRoomMembers(roomId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException(`Salle ${roomId} introuvable`);

    const targetYear = room.targetYear.trim().toUpperCase();
    const members = await this.prisma.user.findMany({
      where: {
        year: { equals: targetYear },
        role: { in: ['student', 'etudiant'] },
      },
      select: { id: true, name: true, year: true },
      orderBy: { name: 'asc' },
    });

    return members.map((member) => ({
      id: String(member.id),
      name: member.name,
      year: member.year ?? targetYear,
    }));
  }

  async getRoomMemberById(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException(`Salle ${roomId} introuvable`);

    const id = Number(userId);
    if (!Number.isFinite(id)) return null;

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, year: true },
    });
    if (!user) return null;

    const targetYear = room.targetYear.trim().toUpperCase();
    const userYear = user.year?.trim().toUpperCase();
    if (user.role !== 'student' && user.role !== 'etudiant') return null;
    if (userYear !== targetYear) return null;

    return {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      year: user.year ?? targetYear,
    };
  }

  // ROOMS
  createRoom(dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: { name: dto.name, targetYear: dto.targetYear, teacherId: dto.teacherId },
    });
  }

  async getRooms() {
    const rooms = await this.prisma.room.findMany({
      include: {
        posts: { include: { comments: true } },
        homeworks: { include: { submissions: true } },
      },
    });
    return this.attachTeacherNames(rooms);
  }

  async getRoomById(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        posts: { include: { comments: true } },
        homeworks: { include: { submissions: true } },
      },
    });
    if (!room) return room;
    const [roomWithTeacherName] = await this.attachTeacherNames([room]);
    return roomWithTeacherName;
  }

  updateRoom(id: string, dto: UpdateRoomDto) {
    return this.prisma.room.update({ where: { id }, data: dto });
  }

  deleteRoom(id: string) {
    return this.prisma.room.delete({ where: { id } });
  }

  async getRoomsByYear(year: string) {
    const rooms = await this.prisma.room.findMany({
      where: { targetYear: year.trim().toUpperCase() },
      include: { posts: true, homeworks: true },
    });
    return this.attachTeacherNames(rooms);
  }

  getHomeworksByYear(year: string) {
    return this.prisma.homework.findMany({
      where: { room: { targetYear: year.trim().toUpperCase() } },
      include: { room: true },
      orderBy: { deadline: 'asc' },
    });
  }

  // POSTS
  async createPost(
    roomId: string,
    dto: CreatePostDto,
    file?: Express.Multer.File,
  ) {
    const normalizedType = dto.type ?? (file ? 'document' : 'announcement');
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    const post = await this.prisma.post.create({
      data: {
        content: dto.content,
        type: normalizedType,
        author: dto.author ?? '',
        roomId,
        fileName: file?.originalname ?? null,
        filePath: file ? `/uploads/room-posts/${file.filename}` : null,
        fileSizeBytes: file?.size ?? null,
      },
      include: { comments: true },
    });
    if (room) {
      this.notificationsService.publish({
        type: 'room.new.post',
        message: `Nouveau message de ${dto.author || 'l’enseignant'} dans "${room.name}"`,
        role: NotificationRole.STUDENT,
        targetYear: room.targetYear,
        data: {
          roomId,
          roomName: room.name,
          postId: post.id,
          author: dto.author ?? '',
          content: dto.content.slice(0, 120),
        },
      }).catch(err => this.logger.error('publish student room notification failed', err));
    }
    if (room && normalizedType !== 'announcement') {
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

  async submitHomework(
    homeworkId: string,
    dto: SubmitHomeworkDto,
    file?: Express.Multer.File,
  ) {
    const hw = await this.prisma.homework.findUnique({ where: { id: homeworkId } });
    if (!hw) throw new NotFoundException(`Devoir ${homeworkId} introuvable`);
    const existing = await this.prisma.homeworkSubmission.findFirst({
      where: { homeworkId, studentName: dto.studentName },
    });
    if (existing) {
      if (!file) return existing;
      return this.prisma.homeworkSubmission.update({
        where: { id: existing.id },
        data: {
          fileName: file.originalname,
          filePath: `/uploads/homeworks/${file.filename}`,
          fileSizeBytes: file.size,
        },
      });
    }
    return this.prisma.homeworkSubmission.create({
      data: {
        studentName: dto.studentName,
        homeworkId,
        fileName: file?.originalname ?? null,
        filePath: file ? `/uploads/homeworks/${file.filename}` : null,
        fileSizeBytes: file?.size ?? null,
      },
    });
  }

  async hasSubmitted(homeworkId: string, studentName: string): Promise<boolean> {
    const existing = await this.prisma.homeworkSubmission.findFirst({
      where: { homeworkId, studentName },
    });
    return !!existing;
  }
}
