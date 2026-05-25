import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GradeSubmissionStatus } from '../../common/enums/grade-submission-status.enum';

export interface GradeEntry {
  studentId?: string;
  studentName: string;
  subject: string;
  ds: number;
  exam: number;
  avg: number;
}

@Entity('grade_submissions')
export class GradeSubmission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  teacherName!: string;

  @Column({ type: 'text', nullable: true })
  teacherEmail?: string | null;

  @Column()
  targetYear!: string;

  @Column({ type: 'text', nullable: true })
  semester?: string | null;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  summary?: string | null;

  @Column({ type: 'simple-json' })
  entries!: GradeEntry[];

  @Column({
    type: 'simple-enum',
    enum: GradeSubmissionStatus,
    default: GradeSubmissionStatus.PENDING,
  })
  status!: GradeSubmissionStatus;

  @Column({ type: 'text', nullable: true })
  validatedBy?: string | null;

  @Column({ type: 'datetime', nullable: true })
  validatedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  publishedBy?: string | null;

  @Column({ type: 'datetime', nullable: true })
  publishedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  publicationId?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
