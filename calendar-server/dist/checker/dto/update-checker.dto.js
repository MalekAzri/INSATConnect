"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCheckerDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_checker_dto_1 = require("./create-checker.dto");
class UpdateCheckerDto extends (0, mapped_types_1.PartialType)(create_checker_dto_1.CreateCheckerDto) {
    id;
}
exports.UpdateCheckerDto = UpdateCheckerDto;
//# sourceMappingURL=update-checker.dto.js.map