import { IsDateString, IsOptional } from 'class-validator';

export class SetDatesDto {
  // ── Legacy (rétrocompatibilité) ─────────────────────────────────────────────
  @IsDateString() @IsOptional()
  dsRemise?: string;

  @IsDateString() @IsOptional()
  examRemise?: string;

  @IsDateString() @IsOptional()
  dsAffichage?: string;

  @IsDateString() @IsOptional()
  examAffichage?: string;

  @IsDateString() @IsOptional()
  sem1Deliberation?: string;

  @IsDateString() @IsOptional()
  sem2Deliberation?: string;

  @IsDateString() @IsOptional()
  DeliberationFinale?: string;

  // ── Semestre 1 ──────────────────────────────────────────────────────────────
  @IsDateString() @IsOptional()
  s1_ds?: string;

  @IsDateString() @IsOptional()
  s1_exam?: string;

  @IsDateString() @IsOptional()
  s1_grades_ds?: string;

  @IsDateString() @IsOptional()
  s1_publish_ds?: string;

  @IsDateString() @IsOptional()
  s1_grades_exam?: string;

  @IsDateString() @IsOptional()
  s1_publish_exam?: string;

  @IsDateString() @IsOptional()
  s1_delib?: string;

  // ── Semestre 2 ──────────────────────────────────────────────────────────────
  @IsDateString() @IsOptional()
  s2_ds?: string;

  @IsDateString() @IsOptional()
  s2_exam?: string;

  @IsDateString() @IsOptional()
  s2_grades_ds?: string;

  @IsDateString() @IsOptional()
  s2_publish_ds?: string;

  @IsDateString() @IsOptional()
  s2_grades_exam?: string;

  @IsDateString() @IsOptional()
  s2_publish_exam?: string;

  @IsDateString() @IsOptional()
  s2_delib?: string;

  // ── Fin d'année ─────────────────────────────────────────────────────────────
  @IsDateString() @IsOptional()
  end_year?: string;
}