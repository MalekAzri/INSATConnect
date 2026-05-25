import { PartialType } from '@nestjs/mapped-types';
import { CreateCheckerDto } from './create-checker.dto';

export class UpdateCheckerDto extends PartialType(CreateCheckerDto) {
  id: number;
}
