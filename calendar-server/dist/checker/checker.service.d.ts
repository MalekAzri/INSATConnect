import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AcademicDate } from '../dates/entities/academic-date.entity';
import { WebhookService } from '../webhook/webhook.service';
export declare class CheckerService {
    private readonly repo;
    private readonly webhookService;
    private readonly config;
    private readonly logger;
    constructor(repo: Repository<AcademicDate>, webhookService: WebhookService, config: ConfigService);
    checkDeadlines(): Promise<void>;
}
