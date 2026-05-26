import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';
import { PublicationCategory } from '../admin-agent/common/enums/publication-category.enum';

interface GraphqlContext {
  req: {
    user?: {
      id: number;
      promo?: string;
      name?: string;
    };
  };
}

@Resolver()
export class StudentResolvers {
  constructor(private readonly prisma: PrismaService) {}

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

    const where: any = {
      AND: [{ category: { not: PublicationCategory.NOTES } }],
    };

    if (catFilter) {
      where.AND.push({ category: catFilter });
    }

    const docs = await this.prisma.publication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // ⬇ Anti-overfetching : on n'expose pas contenu/fichierUrl ici
    return docs.map((doc) => ({
      id: doc.id,
      titre: doc.title,
      categorie: doc.category.toUpperCase(),
      date: doc.createdAt.toISOString(),
      contenu: null,
      fichierUrl: null,
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // QUERY 1.5 : Feed des publications étudiantes
  //            Filtrage par targetYear et posts généraux
  // ─────────────────────────────────────────────────────────────
  @Query('publications')
  async getPublications(
    @Args('targetYear') targetYear?: string,
    @Context() context?: GraphqlContext,
  ) {
    const year = targetYear?.trim().toUpperCase() || context?.req?.user?.promo?.trim().toUpperCase();
    const where: any = {};

    if (year) {
      where.OR = [
        { targetYear: null },
        { targetYear: year },
      ];
    }

    const pubs = await this.prisma.publication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return pubs.map((pub) => ({
      id: pub.id,
      titre: pub.title,
      categorie: pub.category,
      contenu: pub.content,
      date: pub.createdAt.toISOString(),
      auteur: pub.author,
      targetYear: pub.targetYear ?? null,
      fichierUrl: pub.filePath ?? pub.fileName ?? null,
      fileName: pub.fileName ?? null,
      fileSize: pub.fileSizeBytes ? `${(pub.fileSizeBytes / (1024 * 1024)).toFixed(2)} Mo` : null,
      grades: pub.grades ? JSON.parse(pub.grades) : null,
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // QUERY 2 : Détails complets (chargés uniquement au clic)
  // ─────────────────────────────────────────────────────────────
  @Query('document')
  async getDocument(@Args('id') id: string) {
    const doc = await this.prisma.publication.findUnique({ where: { id } });
    if (!doc) return null;

    return {
      id: doc.id,
      titre: doc.title,
      categorie: doc.category.toUpperCase(),
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
    const user = context?.req?.user;
    if (!user) throw new Error('Non authentifié');
    const promo: string = user.promo ?? 'GL3';

    const pub = await this.prisma.publication.findFirst({
      where: {
        category: PublicationCategory.PLANNING,
        targetYear: promo,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!pub) {
      console.warn(`Aucun emploi du temps trouvé pour la promo ${promo}`);
      return null;
    }

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
    const user = context?.req?.user;
    if (!user) throw new Error('Non authentifié');
    if (!user.promo) throw new Error('Promo non définie pour cet étudiant');

    const submissions = await this.prisma.gradeSubmission.findMany({
      where: { targetYear: user.promo, status: 'published' },
      orderBy: { createdAt: 'desc' },
    });

    return submissions
      .map((sub) => {
        const entries = JSON.parse(sub.entries || '[]') as Array<{
          studentId?: string | number;
          grade?: number;
        }>;

        const myEntry = entries.find((e) => e.studentId && String(e.studentId) === String(user.id));
        if (!myEntry) return null;

        return {
          id: sub.id,
          etudiantId: user.id,
          semestre: sub.semester || '',
          datePublication: sub.createdAt.toISOString(),
          details: [{
            matiere: sub.subject || '',
            typeEpreuve: sub.examType || 'DS',
            note: String(myEntry.grade ?? ''),
          }],
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }

  // ─────────────────────────────────────────────────────────────
  // QUERY 5 : Calendrier académique (commun à tous)
  //           Transforme la config en liste d'événements nommés
  // ─────────────────────────────────────────────────────────────
  @Query('calendrierAcademique')
  async getAcademicCalendar() {
    const configs = await this.prisma.academicCalendarConfig.findMany({
      orderBy: { createdAt: 'desc' },
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

    addEvent('DS Semestre 1', config.s1_ds, 'DS');
    addEvent('Affichage Notes DS S1', config.s1_publish_ds, 'AFFICHAGE');
    addEvent('Examen Semestre 1', config.s1_exam, 'EXAMEN');
    addEvent('Affichage Notes Examen S1', config.s1_publish_exam, 'AFFICHAGE');
    addEvent('Délibération Semestre 1', config.s1_delib, 'DELIBERATION');
    addEvent('DS Semestre 2', config.s2_ds, 'DS');
    addEvent('Affichage Notes DS S2', config.s2_publish_ds, 'AFFICHAGE');
    addEvent('Examen Semestre 2', config.s2_exam, 'EXAMEN');
    addEvent('Affichage Notes Examen S2', config.s2_publish_exam, 'AFFICHAGE');
    addEvent('Délibération Semestre 2', config.s2_delib, 'DELIBERATION');
    addEvent('Délibération Finale', config.deliberationFinale, 'DELIBERATION');
    addEvent("Fin d'Année", config.end_year, 'FIN_ANNEE');

    return events;
  }
}
