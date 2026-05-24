import { ConfigService } from '@nestjs/config';
export declare class WebhookService {
    private readonly config;
    private readonly logger;
    private readonly webhookUrl;
    private readonly webhookSecret;
    constructor(config: ConfigService);
    sendAlert(payload: {
        type: string;
        targetRole: string;
        date: string;
        daysLeft: number;
    }): Promise<void>;
}
