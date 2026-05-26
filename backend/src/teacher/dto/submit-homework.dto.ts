import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SubmitHomeworkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  studentName!: string;
}
