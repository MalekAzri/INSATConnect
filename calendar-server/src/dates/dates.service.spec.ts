import { Test, TestingModule } from '@nestjs/testing';
import { DatesService } from './dates.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AcademicDate } from './entities/academic-date.entity';

describe('DatesService', () => {
  let service: DatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatesService,
        { provide: getRepositoryToken(AcademicDate), useValue: {} },
      ],
    }).compile();

    service = module.get<DatesService>(DatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
