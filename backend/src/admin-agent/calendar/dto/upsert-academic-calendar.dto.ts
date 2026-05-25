import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertAcademicCalendarDto {
  @IsDateString()
  @IsNotEmpty()
  dsRemise!: string;

  @IsDateString()
  @IsNotEmpty()
  examRemise!: string;

  @IsDateString()
  @IsNotEmpty()
  dsAffichage!: string;

  @IsDateString()
  @IsNotEmpty()
  examAffichage!: string;

  @IsDateString()
  @IsNotEmpty()
  sem1Deliberation!: string;

  @IsDateString()
  @IsNotEmpty()
  sem2Deliberation!: string;

  @IsDateString()
  @IsNotEmpty()
  deliberationFinale!: string;

  @IsOptional()
  @IsDateString()
  s1_ds?: string;

  @IsOptional()
  @IsDateString()
  s1_exam?: string;

  @IsOptional()
  @IsDateString()
  s1_grades_ds?: string;

  @IsOptional()
  @IsDateString()
  s1_publish_ds?: string;

  @IsOptional()
  @IsDateString()
  s1_grades_exam?: string;

  @IsOptional()
  @IsDateString()
  s1_publish_exam?: string;

  @IsOptional()
  @IsDateString()
  s1_delib?: string;

  @IsOptional()
  @IsDateString()
  s2_ds?: string;

  @IsOptional()
  @IsDateString()
  s2_exam?: string;

  @IsOptional()
  @IsDateString()
  s2_grades_ds?: string;

  @IsOptional()
  @IsDateString()
  s2_publish_ds?: string;

  @IsOptional()
  @IsDateString()
  s2_grades_exam?: string;

  @IsOptional()
  @IsDateString()
  s2_publish_exam?: string;

  @IsOptional()
  @IsDateString()
  s2_delib?: string;

  @IsOptional()
  @IsDateString()
  end_year?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  updatedBy?: string;
}

export class PatchAcademicCalendarDto extends PartialType(UpsertAcademicCalendarDto) {}
