import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CheckerService } from './checker.service';
import { CreateCheckerDto } from './dto/create-checker.dto';
import { UpdateCheckerDto } from './dto/update-checker.dto';

@Controller()
export class CheckerController {
  constructor(private readonly checkerService: CheckerService) {}

  @MessagePattern('createChecker')
  create(@Payload() createCheckerDto: CreateCheckerDto) {
    return this.checkerService.create(createCheckerDto);
  }

  @MessagePattern('findAllChecker')
  findAll() {
    return this.checkerService.findAll();
  }

  @MessagePattern('findOneChecker')
  findOne(@Payload() id: number) {
    return this.checkerService.findOne(id);
  }

  @MessagePattern('updateChecker')
  update(@Payload() updateCheckerDto: UpdateCheckerDto) {
    return this.checkerService.update(updateCheckerDto.id, updateCheckerDto);
  }

  @MessagePattern('removeChecker')
  remove(@Payload() id: number) {
    return this.checkerService.remove(id);
  }
}
