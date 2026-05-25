import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PublicationCategory } from '../../common/enums/publication-category.enum';

export class PublicationGradeLineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  ds!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  exam!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  avg!: string;
}

export class CreatePublicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  title!: string;

  @IsEnum(PublicationCategory)
  category!: PublicationCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  author?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  targetYear?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublicationGradeLineDto)
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  })
  grades?: PublicationGradeLineDto[];
}
