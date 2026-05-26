import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  targetYear!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  teacherId!: string;
}