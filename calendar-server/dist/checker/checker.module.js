"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckerModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const academic_date_entity_1 = require("../dates/entities/academic-date.entity");
const webhook_module_1 = require("../webhook/webhook.module");
const checker_service_1 = require("./checker.service");
let CheckerModule = class CheckerModule {
};
exports.CheckerModule = CheckerModule;
exports.CheckerModule = CheckerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([academic_date_entity_1.AcademicDate]),
            webhook_module_1.WebhookModule,
        ],
        providers: [checker_service_1.CheckerService],
    })
], CheckerModule);
//# sourceMappingURL=checker.module.js.map