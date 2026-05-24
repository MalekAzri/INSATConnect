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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const academic_date_entity_1 = require("./entities/academic-date.entity");
let DatesService = class DatesService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async setDates(dto) {
        const entries = [
            { key: 'ds_remise', date: dto.dsRemise, targetRole: 'Professeur' },
            { key: 'exam_remise', date: dto.examRemise, targetRole: 'Professeur' },
            { key: 'ds_affichage', date: dto.dsAffichage, targetRole: 'admin' },
            { key: 'exam_affichage ', date: dto.examAffichage, targetRole: 'admin' },
            { key: 'sem1_deliberation', date: dto.sem1Deliberation, targetRole: 'admin' },
            { key: 'sem2_deliberation', date: dto.sem2Deliberation, targetRole: 'admin' },
            { key: 'final_deliberation', date: dto.DeliberationFinale, targetRole: 'admin' },
        ];
        for (const entry of entries) {
            await this.repo.upsert({ ...entry, notificationSent: false }, { conflictPaths: ['key'] });
        }
    }
    async getAllDates() {
        return this.repo.find();
    }
};
exports.DatesService = DatesService;
exports.DatesService = DatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(academic_date_entity_1.AcademicDate)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DatesService);
//# sourceMappingURL=dates.service.js.map