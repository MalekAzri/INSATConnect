import { IsDateString, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateHomeworkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @IsDateString()
  deadline!: string;
}