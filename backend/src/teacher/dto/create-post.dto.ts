import { IsString, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  type?: string;
}