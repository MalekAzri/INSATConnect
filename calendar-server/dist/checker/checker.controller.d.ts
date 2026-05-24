import { CheckerService } from './checker.service';
import { CreateCheckerDto } from './dto/create-checker.dto';
import { UpdateCheckerDto } from './dto/update-checker.dto';
export declare class CheckerController {
    private readonly checkerService;
    constructor(checkerService: CheckerService);
    create(createCheckerDto: CreateCheckerDto): any;
    findAll(): any;
    findOne(id: number): any;
    update(updateCheckerDto: UpdateCheckerDto): any;
    remove(id: number): any;
}
