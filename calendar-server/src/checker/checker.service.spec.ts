import { Test, TestingModule } from '@nestjs/testing';
import { CheckerService } from './checker.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { ConfigService } from '@nestjs/config';

describe('CheckerService', () => {
  let service: CheckerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckerService,
        {
          provide: PrismaService,
          useValue: {
            academicDate: {
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: WebhookService,
          useValue: {
            sendAlert: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CheckerService>(CheckerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
