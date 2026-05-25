import { Test, TestingModule } from '@nestjs/testing';
import { WebhookGateway } from './webhook.gateway';
import { WebhookService } from './webhook.service';

describe('WebhookGateway', () => {
  let gateway: WebhookGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookGateway, WebhookService],
    }).compile();

    gateway = module.get<WebhookGateway>(WebhookGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
