import { PartialType } from '@nestjs/mapped-types';
import { SetDatesDto } from './set-date.dto';

export class UpdateDateDto extends PartialType(SetDatesDto) {}
