import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { ResourcesService } from './resources.service';
import { Document } from './entities/document.entity';
import { Timetable } from './entities/timetable.entity';
import { Grade } from './entities/grade.entity';
import { AcademicDate } from './entities/academic-date.entity';

@Resolver()
export class ResourcesResolver {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Query(() => [Document], { name: 'documents' })
  async getDocuments(): Promise<Document[]> {
    return this.resourcesService.getDocuments();
  }

  @Query(() => Document, { name: 'document', nullable: true })
  async getDocumentById(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<Document | null> {
    return this.resourcesService.getDocumentById(id);
  }

  @Query(() => [Timetable], { name: 'timetables' })
  async getTimetables(
    @Args('targetYear', { type: () => String }) targetYear: string,
  ): Promise<Timetable[]> {
    return this.resourcesService.getTimetables(targetYear);
  }

  @Query(() => Timetable, { name: 'timetable', nullable: true })
  async getTimetableById(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<Timetable | null> {
    return this.resourcesService.getTimetableById(id);
  }

  @Query(() => [Grade], { name: 'grades' })
  async getGrades(
    @Args('targetYear', { type: () => String }) targetYear: string,
  ): Promise<Grade[]> {
    return this.resourcesService.getGrades(targetYear);
  }

  @Query(() => Grade, { name: 'grade', nullable: true })
  async getGradeById(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<Grade | null> {
    return this.resourcesService.getGradeById(id);
  }

  @Query(() => [AcademicDate], { name: 'academicDates' })
  async getAcademicDates(): Promise<AcademicDate[]> {
    return this.resourcesService.getAcademicDates();
  }

  @Query(() => AcademicDate, { name: 'academicDate', nullable: true })
  async getAcademicDateByKey(
    @Args('key', { type: () => String }) key: string,
  ): Promise<AcademicDate | null> {
    return this.resourcesService.getAcademicDateByKey(key);
  }
}
