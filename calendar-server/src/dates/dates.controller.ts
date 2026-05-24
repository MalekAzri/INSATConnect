import { Body, Controller, Get, Post } from '@nestjs/common';
import { DatesService } from './dates.service';
import { SetDatesDto } from './dto/set-date.dto';

@Controller('dates')
export class DatesController {
  constructor(private readonly datesService: DatesService) {}

  // Le serveur principal appelle cette route pour configurer les dates
  @Post()
  async setDates(@Body() dto: SetDatesDto) {
    await this.datesService.setDates(dto);
    return { message: 'Dates académiques enregistrées avec succès' };
  }

  // Route utilitaire pour vérifier les dates enregistrées
  @Get()
  async getDates() {
    return this.datesService.getAllDates();
  }
}