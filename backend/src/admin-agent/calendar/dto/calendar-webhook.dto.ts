import { IsIn, IsInt, IsString, Min } from 'class-validator';

export class CalendarWebhookDto {
  @IsString()
  @IsIn([

    // ── Semestre 1 ────────────────────────────
    's1_ds',
    's1_exam',
    's1_grades_ds',
    's1_publish_ds',
    's1_grades_exam',
    's1_publish_exam',
    's1_delib',
    // ── Semestre 2 ────────────────────────────
    's2_ds',
    's2_exam',
    's2_grades_ds',
    's2_publish_ds',
    's2_grades_exam',
    's2_publish_exam',
    's2_delib',
    // ── Fin d'année ───────────────────────────
    'end_year',
    // ── Homework dynamique ────────────────────
    'homework_deadline',
  ])
  type!: string;

  @IsString()
  targetRole!: string;

  @IsString()
  date!: string;

  @IsInt()
  @Min(0)
  daysLeft!: number;
}