import { Injectable } from '@nestjs/common';
import { CreateDateDto } from './dto/create-date.dto';
import { UpdateDateDto } from './dto/update-date.dto';

@Injectable()
export class DatesService {
  create(createDateDto: CreateDateDto) {
    return 'This action adds a new date';
  }

  findAll() {
    return `This action returns all dates`;
  }

  findOne(id: number) {
    return `This action returns a #${id} date`;
  }

  update(id: number, updateDateDto: UpdateDateDto) {
    return `This action updates a #${id} date`;
  }

  remove(id: number) {
    return `This action removes a #${id} date`;
  }
}
