import { GradeSubmissionStatus } from '../../common/enums/grade-submission-status.enum';

export interface StudentGrade {
  studentId: string;
  lastName: string;
  firstName: string;
  grade: number;
}

export class GradeSubmission {
  id!: string;
  teacherName!: string;
  teacherEmail?: string | null;
  targetYear!: string;
  semester!: string;
  subject!: string;
  examType!: 'DS' | 'EXAM';
  title!: string;
  summary?: string | null;
  entries!: StudentGrade[];
  status!: GradeSubmissionStatus;
  validatedBy?: string | null;
  validatedAt?: Date | null;
  publishedBy?: string | null;
  publishedAt?: Date | null;
  publicationId?: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
