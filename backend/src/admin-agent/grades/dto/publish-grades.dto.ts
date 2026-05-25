import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class PublishGradesDto {
  @IsString()
  @MaxLength(16)
  targetYear!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  submissionIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  publishedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  content?: string;

  @IsOptional()
  @Type(() => Boolean)
  notifyStudents?: boolean = true;
}
