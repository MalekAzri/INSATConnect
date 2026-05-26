import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class StudentGradeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  studentId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  grade!: number;
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

  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  semester!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  subject!: string;

  @IsString()
  @IsIn(['DS', 'EXAM'])
  examType!: 'DS' | 'EXAM';

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
  @Type(() => StudentGradeDto)
  entries!: StudentGradeDto[];
}
