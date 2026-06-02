import { Test, TestingModule } from '@nestjs/testing';
import { CheckerService } from './checker.service';
import { WebhookService } from '../webhook/webhook.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AcademicDate } from '../dates/entities/academic-date.entity';

describe('CheckerService', () => {
  let service: CheckerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckerService,
        { provide: WebhookService, useValue: {} },
        { provide: ConfigService, useValue: {} },
        { provide: getRepositoryToken(AcademicDate), useValue: {} },
      ],
    }).compile();

    service = module.get<CheckerService>(CheckerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
