import { Test, TestingModule } from '@nestjs/testing';
import { CheckerService } from './checker.service';

describe('CheckerService', () => {
  let service: CheckerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CheckerService],
    }).compile();

    service = module.get<CheckerService>(CheckerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
