import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GradeSubmissionStatus } from '../../common/enums/grade-submission-status.enum';

export class ListGradeSubmissionsQueryDto {
  @IsOptional()
  @IsEnum(GradeSubmissionStatus)
  status?: GradeSubmissionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  targetYear?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
