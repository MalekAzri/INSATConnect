import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class GradeEntryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  studentId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  studentName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  subject!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  ds!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  exam!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  avg!: number;
}

export class CreateGradeSubmissionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  teacherName!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  teacherEmail?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  targetYear!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  semester?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeEntryDto)
  entries!: GradeEntryDto[];
}
