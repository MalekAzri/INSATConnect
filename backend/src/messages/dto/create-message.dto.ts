import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMessageDto {

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  senderId!: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  receiverId!: number;

  @IsNotEmpty()
  @IsString()
  content!: string;
}