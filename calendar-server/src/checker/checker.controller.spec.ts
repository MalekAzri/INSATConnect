import { Test, TestingModule } from '@nestjs/testing';
import { CheckerController } from './checker.controller';
import { CheckerService } from './checker.service';

describe('CheckerController', () => {
  let controller: CheckerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckerController],
      providers: [CheckerService],
    }).compile();

    controller = module.get<CheckerController>(CheckerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
