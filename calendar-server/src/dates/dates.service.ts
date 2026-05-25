import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetDatesDto } from './dto/set-date.dto';

@Injectable()
export class DatesService {
  constructor(private readonly prisma: PrismaService) {}

  async setDates(dto: SetDatesDto): Promise<void> {
    // Les 7 dates avec leur rôle cible
    const entries = [
      { key: 'ds_remise',       date: dto.dsRemise,       targetRole: 'Professeur' },
      { key: 'exam_remise',     date: dto.examRemise,     targetRole: 'Professeur' },
      { key: 'ds_affichage',     date: dto.dsAffichage,          targetRole: 'admin'   },
      { key: 'exam_affichage ',    date: dto.examAffichage,        targetRole: 'admin'   },
      { key: 'sem1_deliberation',   date: dto.sem1Deliberation,   targetRole: 'admin'   },
      { key: 'sem2_deliberation',   date: dto.sem2Deliberation,   targetRole: 'admin'   },
      { key: 'final_deliberation',  date: dto.DeliberationFinale,  targetRole: 'admin'   },
    ];

    for (const entry of entries) {
      await this.prisma.academicDate.upsert({
        where: { key: entry.key },
        update: { ...entry, notificationSent: false },
        create: { ...entry, notificationSent: false },
      });
    }
  }

  async getAllDates() {
    return this.prisma.academicDate.findMany();
  }
}