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
exports.DatesController = void 0;
const common_1 = require("@nestjs/common");
const dates_service_1 = require("./dates.service");
const set_date_dto_1 = require("./dto/set-date.dto");
let DatesController = class DatesController {
    datesService;
    constructor(datesService) {
        this.datesService = datesService;
    }
    async setDates(dto) {
        await this.datesService.setDates(dto);
        return { message: 'Dates académiques enregistrées avec succès' };
    }
    async getDates() {
        return this.datesService.getAllDates();
    }
};
exports.DatesController = DatesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [set_date_dto_1.SetDatesDto]),
    __metadata("design:returntype", Promise)
], DatesController.prototype, "setDates", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatesController.prototype, "getDates", null);
exports.DatesController = DatesController = __decorate([
    (0, common_1.Controller)('dates'),
    __metadata("design:paramtypes", [dates_service_1.DatesService])
], DatesController);
//# sourceMappingURL=dates.controller.js.map