import { Body, Controller, Get, Patch, Post, Put, Query } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import {
  PatchAcademicCalendarDto,
  UpsertAcademicCalendarDto,
} from './dto/upsert-academic-calendar.dto';

@Controller('admin-agent/calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  getConfig() {
    return this.calendarService.getConfig();
  }

  @Put()
  upsert(
    @Body() dto: UpsertAcademicCalendarDto,
    @Query('syncCalendar') syncCalendar?: string,
  ) {
    return this.calendarService.upsertConfig(
      dto,
      this.toBool(syncCalendar, true),
    );
  }

  @Patch()
  patch(
    @Body() dto: PatchAcademicCalendarDto,
    @Query('syncCalendar') syncCalendar?: string,
  ) {
    return this.calendarService.patchConfig(
      dto,
      this.toBool(syncCalendar, true),
    );
  }

  @Post('sync')
  sync() {
    return this.calendarService.forceSync();
  }

  private toBool(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) return defaultValue;
    return value === '1' || value.toLowerCase() === 'true';
  }
}
