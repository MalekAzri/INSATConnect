import { DatesService } from './dates.service';
import { SetDatesDto } from './dto/set-date.dto';
export declare class DatesController {
    private readonly datesService;
    constructor(datesService: DatesService);
    setDates(dto: SetDatesDto): Promise<{
        message: string;
    }>;
    getDates(): Promise<import("./entities/academic-date.entity").AcademicDate[]>;
}
