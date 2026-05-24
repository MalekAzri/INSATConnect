"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CheckerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const academic_date_entity_1 = require("../dates/entities/academic-date.entity");
const webhook_service_1 = require("../webhook/webhook.service");
let CheckerService = CheckerService_1 = class CheckerService {
    repo;
    webhookService;
    config;
    logger = new common_1.Logger(CheckerService_1.name);
    constructor(repo, webhookService, config) {
        this.repo = repo;
        this.webhookService = webhookService;
        this.config = config;
    }
    async checkDeadlines() {
        this.logger.log(' Vérification des échéances...');
        const alertDays = this.config.get('ALERT_DAYS_BEFORE', 3);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dates = await this.repo.find({ where: { notificationSent: false } });
        for (const entry of dates) {
            const deadline = new Date(entry.date);
            deadline.setHours(0, 0, 0, 0);
            const diffMs = deadline.getTime() - today.getTime();
            const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));
            if (daysLeft <= alertDays && daysLeft >= 0) {
                this.logger.warn(` Échéance proche : ${entry.key} dans ${daysLeft} jour(s)`);
                await this.webhookService.sendAlert({
                    type: entry.key,
                    targetRole: entry.targetRole,
                    date: entry.date,
                    daysLeft,
                });
                await this.repo.update(entry.id, { notificationSent: true });
            }
        }
        this.logger.log('Verification terminee');
    }
};
exports.CheckerService = CheckerService;
__decorate([
    (0, schedule_1.Cron)('0 7 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CheckerService.prototype, "checkDeadlines", null);
exports.CheckerService = CheckerService = CheckerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(academic_date_entity_1.AcademicDate)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        webhook_service_1.WebhookService,
        config_1.ConfigService])
], CheckerService);
//# sourceMappingURL=checker.service.js.map