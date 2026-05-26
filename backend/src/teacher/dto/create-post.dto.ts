import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsString()
  @IsIn(['announcement', 'document', 'question'])
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  author?: string;
}