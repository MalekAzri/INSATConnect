import { Repository } from 'typeorm';
import { AcademicDate } from './entities/academic-date.entity';
import { SetDatesDto } from './dto/set-date.dto';
export declare class DatesService {
    private readonly repo;
    constructor(repo: Repository<AcademicDate>);
    setDates(dto: SetDatesDto): Promise<void>;
    getAllDates(): Promise<AcademicDate[]>;
}
