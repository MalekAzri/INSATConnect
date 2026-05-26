import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GradeSubmissionStatus } from '../common/enums/grade-submission-status.enum';
import { NotificationRole } from '../common/enums/notification-role.enum';
import { PublicationCategory } from '../common/enums/publication-category.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateGradeSubmissionDto } from './dto/create-grade-submission.dto';
import { ListGradeSubmissionsQueryDto } from './dto/list-grade-submissions.query.dto';
import { PublishGradesDto } from './dto/publish-grades.dto';
import { ValidateGradeSubmissionDto } from './dto/validate-grade-submission.dto';
import { GradeSubmission } from './entities/grade-submission.entity';
import { Publication } from '../publications/entities/publication.entity';

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private mapGradeSubmission(sub: any): GradeSubmission {
    return {
      id: sub.id,
      teacherName: sub.teacherName,
      teacherEmail: sub.teacherEmail,
      targetYear: sub.targetYear,
      semester: sub.semester ?? '',
      subject: sub.subject ?? '',
      examType: (sub.examType === 'EXAM' ? 'EXAM' : 'DS') as 'DS' | 'EXAM',
      title: sub.title,
      summary: sub.summary,
      entries: typeof sub.entries === 'string' ? JSON.parse(sub.entries) : sub.entries,
      status: sub.status as GradeSubmissionStatus,
      validatedBy: sub.validatedBy,
      validatedAt: sub.validatedAt,
      publishedBy: sub.publishedBy,
      publishedAt: sub.publishedAt,
      publicationId: sub.publicationId,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };
  }

  async createSubmission(dto: CreateGradeSubmissionDto): Promise<GradeSubmission> {
    const submission = await this.prisma.gradeSubmission.create({
      data: {
        teacherName: dto.teacherName.trim(),
        teacherEmail: dto.teacherEmail?.trim() || null,
        targetYear: dto.targetYear.trim().toUpperCase(),
        semester: dto.semester.trim(),
        subject: dto.subject.trim(),
        examType: dto.examType,
        title: dto.title.trim(),
        summary: dto.summary?.trim() || null,
        entries: JSON.stringify(dto.entries),
        status: GradeSubmissionStatus.PENDING,
      },
    });

    return this.mapGradeSubmission(submission);
  }

  async listSubmissions(query: ListGradeSubmissionsQueryDto): Promise<GradeSubmission[]> {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.targetYear) {
      where.targetYear = { equals: query.targetYear.trim().toUpperCase() };
    }

    let submissions: any[] = [];
    try {
      submissions = await this.prisma.gradeSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.offset ? Number(query.offset) : 0,
        take: query.limit ? Number(query.limit) : 50,
      });
    } catch (error) {
      if (this.isMissingTableError(error, 'GradeSubmission')) {
        return [];
      }
      throw error;
    }

    return submissions.map((s) => this.mapGradeSubmission(s));
  }

  async getSubmission(id: string): Promise<GradeSubmission> {
    const submission = await this.prisma.gradeSubmission.findUnique({ where: { id } });
    if (!submission) {
      throw new NotFoundException(`Soumission de notes ${id} introuvable`);
    }
    return this.mapGradeSubmission(submission);
  }

  async validateSubmission(
    id: string,
    dto: ValidateGradeSubmissionDto,
  ): Promise<GradeSubmission> {
    const submission = await this.getSubmission(id);

    if (submission.status !== GradeSubmissionStatus.PENDING) {
      throw new BadRequestException(
        `La soumission ${id} est déjà ${submission.status}.`,
      );
    }

    const updated = await this.prisma.gradeSubmission.update({
      where: { id },
      data: {
        status: GradeSubmissionStatus.VALIDATED,
        validatedBy: dto.validatedBy?.trim() || 'Agent admin',
        validatedAt: new Date(),
      },
    });

    return this.mapGradeSubmission(updated);
  }

  async publishValidatedGrades(dto: PublishGradesDto) {
    const targetYear = dto.targetYear.trim().toUpperCase();

    const where: any = {
      status: GradeSubmissionStatus.VALIDATED,
      targetYear: { equals: targetYear },
    };

    if (dto.submissionIds?.length) {
      where.id = { in: dto.submissionIds };
    }

    const submissions = await this.prisma.gradeSubmission.findMany({ where });
    if (!submissions.length) {
      throw new NotFoundException(
        `Aucune soumission validée trouvée pour ${targetYear}.`,
      );
    }

    const parsedSubmissions = submissions.map((s) => this.mapGradeSubmission(s));

    const gradesForPublication = parsedSubmissions.flatMap((submission) =>
      submission.entries.map((entry) => ({
        subject: submission.subject,
        studentId: entry.studentId,
        studentName: `${entry.lastName} ${entry.firstName}`,
        examType: submission.examType,
        grade: entry.grade.toFixed(2),
      })),
    );

    const publication = await this.prisma.publication.create({
      data: {
        title: dto.title?.trim() || `Affichage des notes - Promotion ${targetYear}`,
        category: PublicationCategory.NOTES,
        content:
          dto.content?.trim() ||
          `Les notes ont été validées et publiées pour la promotion ${targetYear}.`,
        author: dto.publishedBy?.trim() || 'Service des Examens',
        targetYear,
        grades: JSON.stringify(gradesForPublication),
      },
    });

    const publishedBy = dto.publishedBy?.trim() || 'Agent admin';
    const publishedAt = new Date();

    await this.prisma.gradeSubmission.updateMany({
      where: {
        id: { in: submissions.map((s) => s.id) },
      },
      data: {
        status: GradeSubmissionStatus.PUBLISHED,
        publishedBy,
        publishedAt,
        publicationId: publication.id,
      },
    });

    if (dto.notifyStudents !== false) {
      this.notificationsService.publish({
        type: 'grades.published',
        role: NotificationRole.STUDENT,
        targetYear,
        message: `Les notes pour la promotion ${targetYear} sont publiées.`,
        data: {
          publicationId: publication.id,
          targetYear,
          submissionIds: submissions.map((submission) => submission.id),
        },
      });
    }

    const mappedPublication: Publication = {
      id: publication.id,
      title: publication.title,
      category: publication.category as PublicationCategory,
      content: publication.content,
      author: publication.author,
      targetYear: publication.targetYear,
      fileName: publication.fileName,
      filePath: publication.filePath,
      fileSizeBytes: publication.fileSizeBytes,
      grades: gradesForPublication,
      createdAt: publication.createdAt,
      updatedAt: publication.updatedAt,
    };

    return {
      publication: mappedPublication,
      submissionsUpdated: submissions.length,
      targetYear,
    };
  }

  private isMissingTableError(error: unknown, modelName: string): boolean {
    if (!error || typeof error !== 'object') return false;
    const code = (error as { code?: string }).code;
    const meta = (error as { meta?: { modelName?: string } }).meta;
    return code === 'P2021' && meta?.modelName === modelName;
  }
}
