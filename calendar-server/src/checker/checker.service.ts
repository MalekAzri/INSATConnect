import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from '../webhook/webhook.service';
import { PrismaService } from '../prisma/prisma.service';

export enum AcademicEventKey {
  AFFICHAGE    = 'AFFICHAGE',
  DS           = 'DS',
  EXAMEN       = 'EXAMEN',
  DELIB        = 'DELIB',
  REMISE_NOTES = 'REMISE_NOTES',
}

export enum UserRole {
  ETUDIANT = 'ETUDIANT',
  PROF     = 'PROF',
  ADMIN    = 'ADMIN',
}

const ROLE_EVENT_PERMISSIONS: Record<UserRole, AcademicEventKey[]> = {
  [UserRole.ETUDIANT]: [
    AcademicEventKey.AFFICHAGE,
    AcademicEventKey.DS,
    AcademicEventKey.EXAMEN,
    AcademicEventKey.DELIB,
  ],
  [UserRole.PROF]: [
    AcademicEventKey.AFFICHAGE,
    AcademicEventKey.DS,
    AcademicEventKey.EXAMEN,
    AcademicEventKey.DELIB,
    AcademicEventKey.REMISE_NOTES,
  ],
  [UserRole.ADMIN]: [
    AcademicEventKey.AFFICHAGE,
    AcademicEventKey.DS,
    AcademicEventKey.EXAMEN,
    AcademicEventKey.DELIB,
    AcademicEventKey.REMISE_NOTES,
  ],
};

//  Mapping complet clés DB → AcademicEventKey
const DB_KEY_TO_EVENT: Record<string, AcademicEventKey> = {

  // Semestre 1
  s1_ds:               AcademicEventKey.DS,
  s1_exam:             AcademicEventKey.EXAMEN,
  s1_grades_ds:        AcademicEventKey.REMISE_NOTES, 
  s1_publish_ds:       AcademicEventKey.AFFICHAGE,     
  s1_grades_exam:      AcademicEventKey.REMISE_NOTES, 
  s1_publish_exam:     AcademicEventKey.AFFICHAGE,     
  s1_delib:            AcademicEventKey.DELIB,         
  // Semestre 2
  s2_ds:               AcademicEventKey.DS,
  s2_exam:             AcademicEventKey.EXAMEN,
  s2_grades_ds:        AcademicEventKey.REMISE_NOTES, 
  s2_publish_ds:       AcademicEventKey.AFFICHAGE,     
  s2_grades_exam:      AcademicEventKey.REMISE_NOTES,  
  s2_publish_exam:     AcademicEventKey.AFFICHAGE,    
  s2_delib:            AcademicEventKey.DELIB,         
  // Fin d'année
  end_year:            AcademicEventKey.DELIB,         
};

const ALERT_THRESHOLDS = [3, 1, 0];

@Injectable()
export class CheckerService {
  private readonly logger = new Logger(CheckerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
    private readonly config: ConfigService,
  ) {}

  @Cron('0 6 * * *') // 6h UTC = 7h Tunis 
  async checkDeadlines(): Promise<void> {
    this.logger.log('Vérification des échéances...');

    const alertDaysEnv = this.config.get<string>('ALERT_DAYS_BEFORE');
    const alertDays = Number.isFinite(Number(alertDaysEnv))
      ? Number(alertDaysEnv)
      : 3;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    //  Filtre notificationSent=false sauf pour les seuils intermédiaires (J-3, J-1)
    // On récupère tout et on gère la logique manuellement
    const dates = await this.prisma.AcademicDate.findMany({
      where: { notificationSent: false },
    });

    for (const entry of dates) {
      const deadline = new Date(entry.date);
      deadline.setHours(0, 0, 0, 0);

      //  Vérifie que la date est valide
      if (isNaN(deadline.getTime())) {
        this.logger.warn(`Date invalide pour "${entry.key}" : ${entry.date}`);
        continue;
      }

      const diffMs  = deadline.getTime() - today.getTime();
      const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Ignore les événements passés ou trop loin
      if (daysLeft < 0 || daysLeft > alertDays) continue;

      // Vérifie que daysLeft correspond à un seuil d'alerte défini
      if (!ALERT_THRESHOLDS.includes(daysLeft)) continue;

      this.logger.warn(`Échéance proche : ${entry.key} dans ${daysLeft} jour(s)`);

      // Résolution clé DB → AcademicEventKey
      const eventKey =
        DB_KEY_TO_EVENT[entry.key] ??
        (entry.key.startsWith('homework_deadline_')
          ? AcademicEventKey.REMISE_NOTES
          : undefined);

      if (!eventKey) {
        this.logger.warn(`Clé DB inconnue : "${entry.key}"`);
        continue;
      }

      const targetRoles = this.resolveTargetRoles(eventKey);
      if (targetRoles.length === 0) {
        this.logger.warn(`Aucun rôle cible pour : ${entry.key} (${eventKey})`);
        continue;
      }

      //  Envoie les webhooks — erreurs silencieuses pour ne pas bloquer le update
      const webhookType = entry.key.startsWith('homework_deadline_')
        ? 'homework_deadline'
        : entry.key;

      const results = await Promise.allSettled(
        targetRoles.map((role) =>
          this.webhookService.sendAlert({
            type:       webhookType,
            targetRole: role,
            date:       entry.date,
            daysLeft,
          }),
        ),
      );

      const allFailed = results.every((r) => r.status === 'rejected');
      if (allFailed) {
        this.logger.warn(`Tous les webhooks ont échoué pour "${entry.key}" — notificationSent non mis à jour`);
        continue;
      }

      this.logger.log(
        `Notification envoyée pour "${entry.key}" → rôles : ${targetRoles.join(', ')}`,
      );

      //  Marque comme envoyé au dernier seuil (J-0)
      // Pour J-3 et J-1, on laisse notificationSent=false pour re-notifier aux seuils suivants
      if (daysLeft === 0) {
        await this.prisma.AcademicDate.update({
          where: { id: entry.id },
          data:  { notificationSent: true },
        });
        this.logger.log(`notificationSent=true pour "${entry.key}"`);
      }
    }

    this.logger.log('Vérification terminée');
  }

  private resolveTargetRoles(eventKey: AcademicEventKey): UserRole[] {
    return (
      Object.entries(ROLE_EVENT_PERMISSIONS) as [UserRole, AcademicEventKey[]][]
    )
      .filter(([, allowedKeys]) => allowedKeys.includes(eventKey))
      .map(([role]) => role);
  }
}