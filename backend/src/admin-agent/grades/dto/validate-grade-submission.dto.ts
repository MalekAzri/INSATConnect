import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ValidateGradeSubmissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  validatedBy?: string;
}
