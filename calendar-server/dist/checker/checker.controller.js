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
exports.CheckerController = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const checker_service_1 = require("./checker.service");
const create_checker_dto_1 = require("./dto/create-checker.dto");
const update_checker_dto_1 = require("./dto/update-checker.dto");
let CheckerController = class CheckerController {
    checkerService;
    constructor(checkerService) {
        this.checkerService = checkerService;
    }
    create(createCheckerDto) {
        return this.checkerService.create(createCheckerDto);
    }
    findAll() {
        return this.checkerService.findAll();
    }
    findOne(id) {
        return this.checkerService.findOne(id);
    }
    update(updateCheckerDto) {
        return this.checkerService.update(updateCheckerDto.id, updateCheckerDto);
    }
    remove(id) {
        return this.checkerService.remove(id);
    }
};
exports.CheckerController = CheckerController;
__decorate([
    (0, microservices_1.MessagePattern)('createChecker'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_checker_dto_1.CreateCheckerDto]),
    __metadata("design:returntype", void 0)
], CheckerController.prototype, "create", null);
__decorate([
    (0, microservices_1.MessagePattern)('findAllChecker'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CheckerController.prototype, "findAll", null);
__decorate([
    (0, microservices_1.MessagePattern)('findOneChecker'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CheckerController.prototype, "findOne", null);
__decorate([
    (0, microservices_1.MessagePattern)('updateChecker'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_checker_dto_1.UpdateCheckerDto]),
    __metadata("design:returntype", void 0)
], CheckerController.prototype, "update", null);
__decorate([
    (0, microservices_1.MessagePattern)('removeChecker'),
    __param(0, (0, microservices_1.Payload)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CheckerController.prototype, "remove", null);
exports.CheckerController = CheckerController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [checker_service_1.CheckerService])
], CheckerController);
//# sourceMappingURL=checker.controller.js.map