import { Injectable } from '@nestjs/common';
import { CreateCheckerDto } from './dto/create-checker.dto';
import { UpdateCheckerDto } from './dto/update-checker.dto';

@Injectable()
export class CheckerService {
  create(createCheckerDto: CreateCheckerDto) {
    return 'This action adds a new checker';
  }

  findAll() {
    return `This action returns all checker`;
  }

  findOne(id: number) {
    return `This action returns a #${id} checker`;
  }

  update(id: number, updateCheckerDto: UpdateCheckerDto) {
    return `This action updates a #${id} checker`;
  }

  remove(id: number) {
    return `This action removes a #${id} checker`;
  }
}
