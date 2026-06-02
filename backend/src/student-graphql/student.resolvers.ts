import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Publication } from '../admin-agent/publications/entities/publication.entity';
import { AcademicCalendarConfig } from '../admin-agent/calendar/entities/academic-calendar.entity';
import { GradeSubmission } from '../admin-agent/grades/entities/grade-submission.entity';
import { PublicationCategory } from '../admin-agent/common/enums/publication-category.enum';

interface GraphqlContext {
  req?: {
    user?: {
      id: number;
      promo?: string;
      name?: string;
    };
  };
}

@Resolver()
export class StudentResolvers {
  constructor(
    @InjectRepository(Publication)
    private readonly publicationRepo: Repository<Publication>,
    @InjectRepository(AcademicCalendarConfig)
    private readonly calendarRepo: Repository<AcademicCalendarConfig>,
    @InjectRepository(GradeSubmission)
    private readonly gradeRepo: Repository<GradeSubmission>,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // QUERY 1 : Liste allégée des documents (anti-overfetching)
  //           Contenu et fichierUrl ne sont PAS chargés ici.
  // ─────────────────────────────────────────────────────────────
  @Query('documents')
  async getDocuments(@Args('categorie') categorie?: string) {
    let catFilter: string | undefined;
    if (categorie) {
      const mapping: Record<string, string> = {
        urgent: PublicationCategory.URGENT,
        document: PublicationCategory.DOCUMENT,
        planning: PublicationCategory.PLANNING,
      };
      catFilter = mapping[categorie.toLowerCase()] ?? categorie;
    }

    const qb = this.publicationRepo
      .createQueryBuilder('pub')
      // Exclure les notes (catégorie NOTES = données lourdes pour une autre query)
      .where('pub.category != :nc', { nc: PublicationCategory.NOTES })
      .orderBy('pub.createdAt', 'DESC');

    if (catFilter) {
      qb.andWhere('pub.category = :cat', { cat: catFilter });
    }

    const docs = await qb.getMany();

    // ⬇ Anti-overfetching : on n'expose pas contenu/fichierUrl ici
    return docs.map((doc) => ({
      id: doc.id,
      titre: doc.title,
      categorie: doc.category.toLowerCase(),
      date: doc.createdAt.toISOString(),
      contenu: null,
      fichierUrl: null,
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // QUERY 2 : Détails complets (chargés uniquement au clic)
  // ─────────────────────────────────────────────────────────────
  @Query('document')
  async getDocument(@Args('id') id: string) {
    const doc = await this.publicationRepo.findOne({ where: { id } });
    if (!doc) return null;

    return {
      id: doc.id,
      titre: doc.title,
      categorie: doc.category.toLowerCase(),
      date: doc.createdAt.toISOString(),
      contenu: doc.content,
      fichierUrl: doc.filePath || doc.fileName || null,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // QUERY 3 : Emploi du temps (filtre via context user.promo)
  // ─────────────────────────────────────────────────────────────
  @Query('emploiDuTemps')
  async getTimetable(@Context() context: GraphqlContext) {
    const user = context?.req?.user ?? {
      id: 2,
      promo: 'GL3',
      name: 'Étudiant',
    };
    const promo: string = user.promo ?? 'GL3';

    const pub = await this.publicationRepo.findOne({
      where: {
        category: PublicationCategory.PLANNING,
        targetYear: promo,
      },
      order: { createdAt: 'DESC' },
    });

    if (!pub) return null;

    return {
      id: pub.id,
      promo: pub.targetYear ?? promo,
      semestre: 1,
      emploisDuTempsUrl: pub.filePath ?? pub.fileName ?? '',
      datePublication: pub.createdAt.toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // QUERY 4 : Notes de l'étudiant (filtre via context user)
  //           GradeSubmission.entries[] filtrés par studentName/Id
  // ─────────────────────────────────────────────────────────────
  @Query('mesNotes')
  async getGrades(@Context() context: GraphqlContext) {
    const user = context?.req?.user ?? {
      id: 2,
      promo: 'GL3',
      name: 'Étudiant',
    };

    // On récupère les soumissions publiées ciblant la promo de l'étudiant
    const submissions = await this.gradeRepo.find({
      where: { targetYear: user.promo ?? 'GL3' },
      order: { createdAt: 'DESC' },
    });

    return submissions
      .map((sub) => {
        // Filtrer les lignes qui correspondent à cet étudiant (par nom ou id)
        const myEntries = sub.entries.filter(
          (e) =>
            !e.studentId ||
            String(e.studentId) === String(user.id) ||
            !e.studentName ||
            e.studentName
              .toLowerCase()
              .includes((user.name ?? '').toLowerCase()),
        );

        return {
          id: sub.id,
          etudiantId: user.id,
          semestre: sub.semester ? parseInt(sub.semester, 10) : 1,
          datePublication: sub.createdAt.toISOString(),
          details: myEntries.map((e) => ({
            matiere: e.subject,
            ds: String(e.ds),
            examen: String(e.exam),
            moyenne: String(e.avg),
          })),
        };
      })
      .filter((r) => r.details.length > 0);
  }

  // ─────────────────────────────────────────────────────────────
  // QUERY 5 : Calendrier académique (commun à tous)
  //           Transforme la config en liste d'événements nommés
  // ─────────────────────────────────────────────────────────────
  @Query('calendrierAcademique')
  async getAcademicCalendar() {
    const configs = await this.calendarRepo.find({
      order: { createdAt: 'DESC' },
    });

    if (configs.length === 0) return [];

    const config = configs[0]; // On prend la config la plus récente
    const events: {
      id: string;
      nom: string;
      dateDebut: string;
      dateFin: string;
      type: string;
    }[] = [];
    let idx = 1;

    const addEvent = (
      nom: string,
      date: string | null | undefined,
      type: string,
    ) => {
      if (date) {
        events.push({
          id: String(idx++),
          nom,
          dateDebut: date,
          dateFin: date,
          type,
        });
      }
    };

    addEvent('DS Semestre 1', config.s1_ds, 'ds');
    addEvent('Affichage Notes DS S1', config.s1_publish_ds, 'affichage');
    addEvent('Examen Semestre 1', config.s1_exam, 'examen');
    addEvent('Affichage Notes Examen S1', config.s1_publish_exam, 'affichage');
    addEvent('Délibération Semestre 1', config.s1_delib, 'deliberation');
    addEvent('DS Semestre 2', config.s2_ds, 'ds');
    addEvent('Affichage Notes DS S2', config.s2_publish_ds, 'affichage');
    addEvent('Examen Semestre 2', config.s2_exam, 'examen');
    addEvent('Affichage Notes Examen S2', config.s2_publish_exam, 'affichage');
    addEvent('Délibération Semestre 2', config.s2_delib, 'deliberation');
    addEvent('Délibération Finale', config.deliberationFinale, 'deliberation');
    addEvent("Fin d'Année", config.end_year, 'fin_annee');

    return events;
  }
}
