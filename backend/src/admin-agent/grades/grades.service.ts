import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    @InjectRepository(GradeSubmission)
    private readonly gradeSubmissionsRepo: Repository<GradeSubmission>,
    @InjectRepository(Publication)
    private readonly publicationsRepo: Repository<Publication>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createSubmission(dto: CreateGradeSubmissionDto): Promise<GradeSubmission> {
    const submission = this.gradeSubmissionsRepo.create({
      teacherName: dto.teacherName.trim(),
      teacherEmail: dto.teacherEmail?.trim() || null,
      targetYear: dto.targetYear.trim().toUpperCase(),
      semester: dto.semester?.trim() || null,
      title: dto.title.trim(),
      summary: dto.summary?.trim() || null,
      entries: dto.entries,
      status: GradeSubmissionStatus.PENDING,
    });

    return this.gradeSubmissionsRepo.save(submission);
  }

  async listSubmissions(query: ListGradeSubmissionsQueryDto): Promise<GradeSubmission[]> {
    const qb = this.gradeSubmissionsRepo
      .createQueryBuilder('submission')
      .orderBy('submission.createdAt', 'DESC')
      .skip(query.offset ?? 0)
      .take(query.limit ?? 50);

    if (query.status) {
      qb.andWhere('submission.status = :status', { status: query.status });
    }

    if (query.targetYear) {
      qb.andWhere('UPPER(submission.targetYear) = :targetYear', {
        targetYear: query.targetYear.trim().toUpperCase(),
      });
    }

    return qb.getMany();
  }

  async getSubmission(id: string): Promise<GradeSubmission> {
    const submission = await this.gradeSubmissionsRepo.findOne({ where: { id } });
    if (!submission) {
      throw new NotFoundException(`Soumission de notes ${id} introuvable`);
    }
    return submission;
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

    submission.status = GradeSubmissionStatus.VALIDATED;
    submission.validatedBy = dto.validatedBy?.trim() || 'Agent admin';
    submission.validatedAt = new Date();

    return this.gradeSubmissionsRepo.save(submission);
  }

  async publishValidatedGrades(dto: PublishGradesDto) {
    const targetYear = dto.targetYear.trim().toUpperCase();

    const qb = this.gradeSubmissionsRepo
      .createQueryBuilder('submission')
      .where('submission.status = :status', { status: GradeSubmissionStatus.VALIDATED })
      .andWhere('UPPER(submission.targetYear) = :targetYear', { targetYear });

    if (dto.submissionIds?.length) {
      qb.andWhere('submission.id IN (:...ids)', { ids: dto.submissionIds });
    }

    const submissions = await qb.getMany();
    if (!submissions.length) {
      throw new NotFoundException(
        `Aucune soumission validée trouvée pour ${targetYear}.`,
      );
    }

    const publication = this.publicationsRepo.create({
      title:
        dto.title?.trim() || `Affichage des notes - Promotion ${targetYear}`,
      category: PublicationCategory.NOTES,
      content:
        dto.content?.trim() ||
        `Les notes ont été validées et publiées pour la promotion ${targetYear}.`,
      author: dto.publishedBy?.trim() || 'Service des Examens',
      targetYear,
      grades: submissions.flatMap((submission) =>
        submission.entries.map((entry) => ({
          subject: `${entry.studentName} - ${entry.subject}`,
          ds: entry.ds.toFixed(2),
          exam: entry.exam.toFixed(2),
          avg: entry.avg.toFixed(2),
        })),
      ),
    });

    const savedPublication = await this.publicationsRepo.save(publication);
    const publishedBy = dto.publishedBy?.trim() || 'Agent admin';
    const publishedAt = new Date();

    for (const submission of submissions) {
      submission.status = GradeSubmissionStatus.PUBLISHED;
      submission.publishedBy = publishedBy;
      submission.publishedAt = publishedAt;
      submission.publicationId = savedPublication.id;
    }

    await this.gradeSubmissionsRepo.save(submissions);

    if (dto.notifyStudents !== false) {
      this.notificationsService.publish({
        type: 'grades.published',
        role: NotificationRole.STUDENT,
        targetYear,
        message: `Les notes pour la promotion ${targetYear} sont publiées.`,
        data: {
          publicationId: savedPublication.id,
          targetYear,
          submissionIds: submissions.map((submission) => submission.id),
        },
      });
    }

    return {
      publication: savedPublication,
      submissionsUpdated: submissions.length,
      targetYear,
    };
  }
}
