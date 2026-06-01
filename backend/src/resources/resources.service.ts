import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Document, Timetable, Grade, AcademicDate } from '@prisma/client';

@Injectable()
export class ResourcesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seed();
  }

  // GraphQL queries fetching
  async getDocuments(): Promise<Document[]> {
    return this.prisma.document.findMany({ orderBy: { publishedAt: 'desc' } });
  }

  async getDocumentById(id: number): Promise<Document | null> {
    return this.prisma.document.findUnique({ where: { id } });
  }

  async getTimetables(targetYear: string): Promise<Timetable[]> {
    return this.prisma.timetable.findMany({ where: { targetYear }, orderBy: { publishedAt: 'desc' } });
  }

  async getTimetableById(id: number): Promise<Timetable | null> {
    return this.prisma.timetable.findUnique({ where: { id } });
  }

  async getGrades(targetYear: string): Promise<Grade[]> {
    return this.prisma.grade.findMany({ where: { targetYear }, orderBy: { publishedAt: 'desc' } });
  }

  async getGradeById(id: number): Promise<Grade | null> {
    return this.prisma.grade.findUnique({ where: { id } });
  }

  async getAcademicDates(): Promise<AcademicDate[]> {
    return this.prisma.academicDate.findMany();
  }

  async getAcademicDateByKey(key: string): Promise<AcademicDate | null> {
    return this.prisma.academicDate.findUnique({ where: { key } });
  }

  // Database Seeding
  private async seed() {
    // 1. Seed Documents if empty
    const docCount = await this.prisma.document.count();
    if (docCount === 0) {
      await this.prisma.document.createMany({
        data: [
          {
            title: 'URGENT: Tolérance Zéro Contre la Fraude aux Examens',
            category: 'reglement',
            content: "Il est rappelé à tous les étudiants de l'INSAT que toute tentative de fraude ou utilisation de matériel non autorisé (téléphones connectés, écouteurs, documents non signés) durant les devoirs surveillés entraînera la traduction immédiate devant le conseil de discipline de l'université. Nous comptons sur votre rigueur académique.",
            fileName: 'Reglement_Discipline_INSAT_2026.pdf',
            fileSize: '1.2 Mo',
            publishedAt: 'Il y a 2 heures',
          },
          {
            title: "Fiche d'Inscription Administrative 2026-2027",
            category: 'formulaire',
            content: "Veuillez trouver ci-joint le formulaire officiel de réinscription administrative pour la prochaine année universitaire. Le dossier complet doit être déposé au guichet de la scolarité avant le 15 juin 2026.",
            fileName: 'Formulaire_Inscription_INSAT_2026.pdf',
            fileSize: '2.4 Mo',
            publishedAt: 'Hier',
          },
          {
            title: 'Circulaire de Demande de Relevé de Notes Officiel',
            category: 'circulaire',
            content: "Pour toute demande de relevé de notes de semestres précédents, veuillez télécharger et remplir ce formulaire, puis l'envoyer par mail ou le remettre directement au guichet du service scolarité.",
            fileName: 'Demande_Releve_Notes_INSAT.pdf',
            fileSize: '850 Ko',
            publishedAt: 'Il y a 2 jours',
          },
        ]
      });
      console.log(' Documents database seeded successfully!');
    }

    // 2. Seed Timetables if empty
    const timetableCount = await this.prisma.timetable.count();
    if (timetableCount === 0) {
      await this.prisma.timetable.createMany({
        data: [
          {
            title: 'Emploi du Temps GL3 - Semestre 2',
            targetYear: 'GL3',
            fileName: 'Emploi_du_Temps_GL3_S2.pdf',
            fileSize: '1.8 Mo',
            publishedAt: 'Il y a 5 jours',
            scheduleJson: JSON.stringify({
              lundi: '08:30 - Cours Compilation (Amphi H)',
              mardi: '10:15 - Cours Design Patterns (Salle 204)',
              mercredi: 'Libre (Travail personnel)',
              jeudi: '08:30 - TP Réseaux IP (Labo 10)',
              vendredi: '14:00 - TD Compilation (Salle 102)',
            }),
          },
          {
            title: 'Emploi du Temps MPI - Semestre 2',
            targetYear: 'MPI',
            fileName: 'Emploi_du_Temps_MPI_S2.pdf',
            fileSize: '1.5 Mo',
            publishedAt: 'Il y a 5 jours',
            scheduleJson: JSON.stringify({
              lundi: '08:30 - Cours Analyse Réelle (Amphi A)',
              mardi: '10:15 - TD Algèbre Linéaire (Salle 302)',
              mercredi: '14:00 - Cours Physique (Amphi C)',
              jeudi: '08:30 - TD Physique (Salle 208)',
              vendredi: 'Libre (Préparation concours)',
            }),
          },
          {
            title: 'Emploi du Temps IIA - Semestre 2',
            targetYear: 'IIA',
            fileName: 'Emploi_du_Temps_IIA_S2.pdf',
            fileSize: '1.7 Mo',
            publishedAt: 'Il y a 5 jours',
            scheduleJson: JSON.stringify({
              lundi: '10:15 - Cours Systèmes Asservis (Amphi D)',
              mardi: '08:30 - TP Microcontrôleurs (Labo Elec)',
              mercredi: '14:00 - TD Automatique (Salle 105)',
              jeudi: 'Libre',
              vendredi: '08:30 - Cours Électronique (Salle 210)',
            }),
          },
        ]
      });
      console.log(' Timetables database seeded successfully!');
    }

    // 3. Seed Grades if empty
    const gradeCount = await this.prisma.grade.count();
    if (gradeCount === 0) {
      await this.prisma.grade.createMany({
        data: [
          {
            title: 'Affichage des Notes - Génie Logiciel GL3 (Semestre 1)',
            targetYear: 'GL3',
            publishedAt: 'Il y a 3 jours',
            gradesJson: JSON.stringify([
              { subject: 'Conception Orientée Objet & Design Patterns', ds: '14.5', exam: '13.0', avg: '13.6' },
              { subject: 'Théorie de la Compilation & Automates', ds: '12.0', exam: '11.5', avg: '11.7' },
              { subject: 'Réseaux et Protocoles IP', ds: '15.0', exam: '14.0', avg: '14.4' },
              { subject: 'Développement Web & APIs', ds: '16.5', exam: '15.5', avg: '15.9' },
            ]),
          },
          {
            title: 'Affichage des Notes - Cycle Préparatoire MPI (Semestre 1)',
            targetYear: 'MPI',
            publishedAt: 'Il y a 3 jours',
            gradesJson: JSON.stringify([
              { subject: 'Analyse Réelle & Limites', ds: '10.5', exam: '09.5', avg: '09.9' },
              { subject: 'Algèbre Linéaire & Espaces Vectoriels', ds: '11.0', exam: '10.0', avg: '10.4' },
              { subject: 'Physique Générale: Optique & Mécanique', ds: '12.5', exam: '11.0', avg: '11.6' },
            ]),
          },
          {
            title: 'Affichage des Notes - IIA (Informatique Industrielle & Auto.)',
            targetYear: 'IIA',
            publishedAt: 'Il y a 4 jours',
            gradesJson: JSON.stringify([
              { subject: 'Systèmes Asservis & Régulations de Processus', ds: '13.5', exam: '12.0', avg: '12.6' },
              { subject: 'Microcontrôleurs & Architecture Systèmes', ds: '14.0', exam: '13.5', avg: '13.7' },
            ]),
          },
        ]
      });
      console.log(' Grades database seeded successfully!');
    }

    // 4. Ensure some base academic dates exist
    const dates = [
      { key: 'ds_remise',          date: '2026-05-22', targetRole: 'Professeur', notificationSent: false },
      { key: 'exam_remise',        date: '2026-06-15', targetRole: 'Professeur', notificationSent: false },
      { key: 'ds_affichage',       date: '2026-05-28', targetRole: 'admin',      notificationSent: false },
      { key: 'exam_affichage',     date: '2026-06-25', targetRole: 'admin',      notificationSent: false },
      { key: 'sem1_deliberation',  date: '2026-02-05', targetRole: 'admin',      notificationSent: false },
      { key: 'sem2_deliberation',  date: '2026-06-28', targetRole: 'admin',      notificationSent: false },
      { key: 'final_deliberation', date: '2026-06-30', targetRole: 'admin',      notificationSent: false },
    ];
    for (const d of dates) {
      await this.prisma.academicDate.upsert({
        where: { key: d.key },
        update: {},
        create: d,
      });
    }
    console.log(' Academic dates database seeded successfully!');
  }
}
