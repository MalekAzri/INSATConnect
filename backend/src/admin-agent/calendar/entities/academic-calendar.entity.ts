import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('academic_calendar_config')
export class AcademicCalendarConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  dsRemise!: string;

  @Column({ type: 'date' })
  examRemise!: string;

  @Column({ type: 'date' })
  dsAffichage!: string;

  @Column({ type: 'date' })
  examAffichage!: string;

  @Column({ type: 'date' })
  sem1Deliberation!: string;

  @Column({ type: 'date' })
  sem2Deliberation!: string;

  @Column({ type: 'date' })
  deliberationFinale!: string;

  @Column({ type: 'date', nullable: true })
  s1_ds?: string | null;

  @Column({ type: 'date', nullable: true })
  s1_exam?: string | null;

  @Column({ type: 'date', nullable: true })
  s1_grades_ds?: string | null;

  @Column({ type: 'date', nullable: true })
  s1_publish_ds?: string | null;

  @Column({ type: 'date', nullable: true })
  s1_grades_exam?: string | null;

  @Column({ type: 'date', nullable: true })
  s1_publish_exam?: string | null;

  @Column({ type: 'date', nullable: true })
  s1_delib?: string | null;

  @Column({ type: 'date', nullable: true })
  s2_ds?: string | null;

  @Column({ type: 'date', nullable: true })
  s2_exam?: string | null;

  @Column({ type: 'date', nullable: true })
  s2_grades_ds?: string | null;

  @Column({ type: 'date', nullable: true })
  s2_publish_ds?: string | null;

  @Column({ type: 'date', nullable: true })
  s2_grades_exam?: string | null;

  @Column({ type: 'date', nullable: true })
  s2_publish_exam?: string | null;

  @Column({ type: 'date', nullable: true })
  s2_delib?: string | null;

  @Column({ type: 'date', nullable: true })
  end_year?: string | null;

  @Column({ type: 'text', nullable: true })
  updatedBy?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
