import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  authorName!: string;
}
