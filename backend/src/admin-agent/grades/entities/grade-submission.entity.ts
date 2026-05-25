import { GradeSubmissionStatus } from '../../common/enums/grade-submission-status.enum';

export interface GradeEntry {
  studentId?: string;
  studentName: string;
  subject: string;
  ds: number;
  exam: number;
  avg: number;
}

export class GradeSubmission {
  id!: string;
  teacherName!: string;
  teacherEmail?: string | null;
  targetYear!: string;
  semester?: string | null;
  title!: string;
  summary?: string | null;
  entries!: GradeEntry[];
  status!: GradeSubmissionStatus;
  validatedBy?: string | null;
  validatedAt?: Date | null;
  publishedBy?: string | null;
  publishedAt?: Date | null;
  publicationId?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
