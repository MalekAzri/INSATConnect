import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateGradeSubmissionDto } from './dto/create-grade-submission.dto';
import { ListGradeSubmissionsQueryDto } from './dto/list-grade-submissions.query.dto';
import { PublishGradesDto } from './dto/publish-grades.dto';
import { ValidateGradeSubmissionDto } from './dto/validate-grade-submission.dto';
import { GradesService } from './grades.service';

@Controller('admin-agent/grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post('submissions')
  createSubmission(@Body() dto: CreateGradeSubmissionDto) {
    return this.gradesService.createSubmission(dto);
  }

  @Get('submissions')
  listSubmissions(@Query() query: ListGradeSubmissionsQueryDto) {
    return this.gradesService.listSubmissions(query);
  }

  @Get('submissions/:id')
  getSubmission(@Param('id') id: string) {
    return this.gradesService.getSubmission(id);
  }

  @Patch('submissions/:id/validate')
  validateSubmission(
    @Param('id') id: string,
    @Body() dto: ValidateGradeSubmissionDto,
  ) {
    return this.gradesService.validateSubmission(id, dto);
  }

  @Post('publish')
  publishValidatedGrades(@Body() dto: PublishGradesDto) {
    return this.gradesService.publishValidatedGrades(dto);
  }
}
