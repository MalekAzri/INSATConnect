import { IsString } from 'class-validator';

export class CreateHomeworkDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  deadline!: string; // on simplifie (ISO string)
}