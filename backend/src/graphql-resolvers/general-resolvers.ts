import { PublicationCategory } from '../admin-agent/common/enums/publication-category.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from '../teacher/dto/create-comment.dto';
import { CreateHomeworkDto } from '../teacher/dto/create-homework.dto';
import { CreatePostDto } from '../teacher/dto/create-post.dto';
import { CreateRoomDto } from '../teacher/dto/create-room.dto';
import { TeacherService } from '../teacher/teacher.service';

type AnyRecord = Record<string, any>;

interface GraphqlContext {
  req?: {
    user?: {
      id: number;
      role?: string;
      promo?: string;
      name?: string;
    };
  };
}

const toIso = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value ?? '') : date.toISOString();
};

const mapComment = (comment: AnyRecord) => ({
  id: String(comment.id),
  authorName: String(comment.authorName ?? ''),
  content: String(comment.content ?? ''),
  createdAt: toIso(comment.createdAt),
});

const mapSubmission = (submission: AnyRecord) => ({
  id: String(submission.id),
  studentName: String(submission.studentName ?? ''),
  submittedAt: toIso(submission.submittedAt),
  fileName: submission.fileName ?? null,
  filePath: submission.filePath ?? null,
  fileSizeBytes: submission.fileSizeBytes ?? null,
});

const mapHomework = (homework: AnyRecord) => ({
  id: String(homework.id),
  title: String(homework.title ?? ''),
  description: String(homework.description ?? ''),
  deadline: toIso(homework.deadline),
  submissions: Array.isArray(homework.submissions)
    ? homework.submissions.map((submission: AnyRecord) => mapSubmission(submission))
    : [],
});

const mapPost = (post: AnyRecord) => ({
  id: String(post.id),
  content: String(post.content ?? ''),
  type: String(post.type ?? 'announcement'),
  author: String(post.author ?? ''),
  fileName: post.fileName ?? null,
  filePath: post.filePath ?? null,
  fileSizeBytes: post.fileSizeBytes ?? null,
  comments: Array.isArray(post.comments)
    ? post.comments.map((comment: AnyRecord) => mapComment(comment))
    : [],
});

const mapRoom = (room: AnyRecord) => ({
  id: String(room.id),
  name: String(room.name ?? ''),
  targetYear: String(room.targetYear ?? ''),
  teacherId: String(room.teacherId ?? ''),
  teacherName: room.teacherName ?? null,
  posts: Array.isArray(room.posts)
    ? room.posts.map((post: AnyRecord) => mapPost(post))
    : [],
  homeworks: Array.isArray(room.homeworks)
    ? room.homeworks.map((homework: AnyRecord) => mapHomework(homework))
    : [],
});

const normalizeTargetYear = (targetYear?: string | null): string | null => {
  const normalized = targetYear?.trim().toUpperCase();
  if (!normalized) return null;
  if (normalized === 'TOUS' || normalized === 'ALL' || normalized === '*') {
    return null;
  }
  return normalized;
};

const mapPublication = (pub: AnyRecord) => ({
  id: String(pub.id),
  titre: String(pub.title ?? ''),
  categorie: String(pub.category ?? ''),
  contenu: String(pub.content ?? ''),
  date: toIso(pub.createdAt),
  auteur: String(pub.author ?? ''),
  targetYear: pub.targetYear ?? null,
  fichierUrl: pub.filePath ?? pub.fileName ?? null,
  fileName: pub.fileName ?? null,
  fileSize:
    pub.fileSizeBytes && Number(pub.fileSizeBytes) > 0
      ? `${(Number(pub.fileSizeBytes) / (1024 * 1024)).toFixed(2)} Mo`
      : null,
  grades: pub.grades ? JSON.parse(String(pub.grades)) : null,
});

const mapAdminPublication = (pub: AnyRecord) => ({
  id: String(pub.id),
  title: String(pub.title ?? ''),
  category: String(pub.category ?? ''),
  content: String(pub.content ?? ''),
  author: String(pub.author ?? ''),
  targetYear: pub.targetYear ?? null,
  fileName: pub.fileName ?? null,
  filePath: pub.filePath ?? null,
  fileSizeBytes:
    pub.fileSizeBytes && Number.isFinite(Number(pub.fileSizeBytes))
      ? Number(pub.fileSizeBytes)
      : null,
  createdAt: toIso(pub.createdAt),
});

const parseGradeEntries = (
  entries: unknown,
): Array<{
  studentId: string;
  lastName: string;
  firstName: string;
  grade: number;
}> => {
  let parsed: unknown = entries;
  if (typeof entries === 'string') {
    try {
      parsed = JSON.parse(entries);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];

  return parsed.map((row) => {
    const record = row as AnyRecord;
    return {
      studentId: String(record.studentId ?? ''),
      lastName: String(record.lastName ?? ''),
      firstName: String(record.firstName ?? ''),
      grade: Number(record.grade ?? 0),
    };
  });
};

const mapAdminGradeSubmission = (submission: AnyRecord) => ({
  id: String(submission.id),
  teacherName: String(submission.teacherName ?? ''),
  teacherEmail: submission.teacherEmail ?? null,
  targetYear: String(submission.targetYear ?? ''),
  semester: String(submission.semester ?? ''),
  subject: String(submission.subject ?? ''),
  examType: String(submission.examType ?? 'DS'),
  title: String(submission.title ?? ''),
  summary: submission.summary ?? null,
  entries: parseGradeEntries(submission.entries),
  status: String(submission.status ?? 'pending'),
  validatedBy: submission.validatedBy ?? null,
  validatedAt: submission.validatedAt ? toIso(submission.validatedAt) : null,
  publishedBy: submission.publishedBy ?? null,
  publishedAt: submission.publishedAt ? toIso(submission.publishedAt) : null,
  publicationId: submission.publicationId ?? null,
  createdAt: toIso(submission.createdAt),
  updatedAt: toIso(submission.updatedAt),
});

const isTeacherRole = (role?: string | null): boolean => {
  const normalized = role?.trim().toLowerCase();
  return (
    normalized === 'teacher' ||
    normalized === 'enseignant' ||
    normalized === 'professeur' ||
    normalized === 'prof'
  );
};

const buildAcademicEventsFromConfig = (
  config: AnyRecord,
  options?: { includeGradeDeadlines?: boolean },
) => {
  const events: Array<{
    id: string;
    nom: string;
    dateDebut: string;
    dateFin: string;
    type: string;
  }> = [];
  let idx = 1;
  const includeGradeDeadlines = options?.includeGradeDeadlines === true;

  const addEvent = (
    nom: string,
    date: string | null | undefined,
    type: string,
  ) => {
    if (!date) return;
    events.push({
      id: String(idx++),
      nom,
      dateDebut: date,
      dateFin: date,
      type,
    });
  };

  addEvent('DS Semestre 1', config.s1_ds, 'DS');
  if (includeGradeDeadlines) {
    addEvent('Remise Notes DS S1', config.s1_grades_ds, 'DELIBERATION');
  }
  addEvent('Affichage Notes DS S1', config.s1_publish_ds, 'AFFICHAGE');
  addEvent('Examen Semestre 1', config.s1_exam, 'EXAMEN');
  if (includeGradeDeadlines) {
    addEvent('Remise Notes Examen S1', config.s1_grades_exam, 'DELIBERATION');
  }
  addEvent('Affichage Notes Examen S1', config.s1_publish_exam, 'AFFICHAGE');
  addEvent('Délibération Semestre 1', config.s1_delib, 'DELIBERATION');
  addEvent('DS Semestre 2', config.s2_ds, 'DS');
  if (includeGradeDeadlines) {
    addEvent('Remise Notes DS S2', config.s2_grades_ds, 'DELIBERATION');
  }
  addEvent('Affichage Notes DS S2', config.s2_publish_ds, 'AFFICHAGE');
  addEvent('Examen Semestre 2', config.s2_exam, 'EXAMEN');
  if (includeGradeDeadlines) {
    addEvent('Remise Notes Examen S2', config.s2_grades_exam, 'DELIBERATION');
  }
  addEvent('Affichage Notes Examen S2', config.s2_publish_exam, 'AFFICHAGE');
  addEvent('Délibération Semestre 2', config.s2_delib, 'DELIBERATION');
  addEvent('Délibération Finale', config.deliberationFinale, 'DELIBERATION');
  addEvent("Fin d'Année", config.end_year, 'FIN_ANNEE');

  return events;
};

export const createApolloResolvers = (
  prisma: PrismaService,
  teacherService: TeacherService,
) => ({
  Query: {
    documents: async (_parent: unknown, args: { categorie?: string }) => {
      const { categorie } = args;
      let catFilter: string | undefined;

      if (categorie) {
        const mapping: Record<string, string> = {
          urgent: PublicationCategory.URGENT,
          document: PublicationCategory.DOCUMENT,
          planning: PublicationCategory.PLANNING,
        };
        catFilter = mapping[categorie.toLowerCase()] ?? categorie;
      }

      const where: AnyRecord = {
        AND: [{ category: { not: PublicationCategory.NOTES } }],
      };

      if (catFilter) {
        where.AND.push({ category: catFilter });
      }

      const docs = await prisma.publication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return docs.map((doc) => ({
        id: doc.id,
        titre: doc.title,
        categorie: doc.category.toUpperCase(),
        date: doc.createdAt.toISOString(),
        contenu: null,
        fichierUrl: null,
      }));
    },

    publications: async (
      _parent: unknown,
      args: { targetYear?: string, userId?: string },
      context?: GraphqlContext,
    ) => {
      const year = normalizeTargetYear(
        args.targetYear ?? context?.req?.user?.promo,
      );
      const where: AnyRecord = {};

      if (year) {
        where.OR = [
          { targetYear: null },
          { targetYear: { in: ['TOUS', 'ALL', '*'] } },
          { targetYear: year },
        ];
      }

      if (args.userId) {
        where.AND = [
          ...(where.AND ?? []),
          { OR: [{ targetUserId: null }, { targetUserId: Number(args.userId) }] },
        ];
      } else {
        where.AND = [
          ...(where.AND ?? []),
          { targetUserId: null },
        ];
      }
      
      const pubs = await prisma.publication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return pubs.map((pub) => mapPublication(pub as AnyRecord));
    },

    publication: async (_parent: unknown, args: { id: string }) => {
      const publication = await prisma.publication.findUnique({
        where: { id: args.id },
      });
      if (!publication) return null;
      return mapPublication(publication as AnyRecord);
    },

    adminPublications: async (
      _parent: unknown,
      args: {
        category?: string;
        targetYear?: string;
        search?: string;
        offset?: number;
        limit?: number;
      },
    ) => {
      const where: AnyRecord = {};

      if (args.category?.trim()) {
        where.category = args.category.trim().toLowerCase();
      }

      if (args.targetYear?.trim()) {
        const normalizedTarget = normalizeTargetYear(args.targetYear);
        where.OR = [
          { targetYear: null },
          { targetYear: { in: ['TOUS', 'ALL', '*'] } },
          ...(normalizedTarget ? [{ targetYear: { equals: normalizedTarget } }] : []),
        ];
      }

      if (args.search?.trim()) {
        const search = args.search.trim();
        where.AND = [
          ...(where.AND || []),
          {
            OR: [
              { title: { contains: search } },
              { content: { contains: search } },
            ],
          },
        ];
      }

      const publications = await prisma.publication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number.isFinite(Number(args.offset)) ? Number(args.offset) : 0,
        take: Number.isFinite(Number(args.limit)) ? Number(args.limit) : 50,
      });

      return publications.map((publication) =>
        mapAdminPublication(publication as AnyRecord),
      );
    },

    adminPublication: async (_parent: unknown, args: { id: string }) => {
      const publication = await prisma.publication.findUnique({
        where: { id: args.id },
      });
      if (!publication) return null;
      return mapAdminPublication(publication as AnyRecord);
    },

    adminGradeSubmissions: async (
      _parent: unknown,
      args: {
        status?: string;
        targetYear?: string;
        offset?: number;
        limit?: number;
      },
    ) => {
      const where: AnyRecord = {};

      if (args.status?.trim()) {
        where.status = args.status.trim().toLowerCase();
      }

      if (args.targetYear?.trim()) {
        where.targetYear = { equals: args.targetYear.trim().toUpperCase() };
      }

      const submissions = await prisma.gradeSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number.isFinite(Number(args.offset)) ? Number(args.offset) : 0,
        take: Number.isFinite(Number(args.limit)) ? Number(args.limit) : 50,
      });

      return submissions.map((submission) =>
        mapAdminGradeSubmission(submission as AnyRecord),
      );
    },

    adminGradeSubmission: async (_parent: unknown, args: { id: string }) => {
      const submission = await prisma.gradeSubmission.findUnique({
        where: { id: args.id },
      });
      if (!submission) return null;
      return mapAdminGradeSubmission(submission as AnyRecord);
    },

    document: async (_parent: unknown, args: { id: string }) => {
      const doc = await prisma.publication.findUnique({ where: { id: args.id } });
      if (!doc) return null;

      return {
        id: doc.id,
        titre: doc.title,
        categorie: doc.category.toUpperCase(),
        date: doc.createdAt.toISOString(),
        contenu: doc.content,
        fichierUrl: doc.filePath || doc.fileName || null,
      };
    },

    emploiDuTemps: async (
      _parent: unknown,
      _args: unknown,
      context?: GraphqlContext,
    ) => {
      const user = context?.req?.user;
      if (!user) throw new Error('Non authentifié');

      const promo = user.promo ?? 'GL3';
      const pub = await prisma.publication.findFirst({
        where: {
          category: PublicationCategory.PLANNING,
          targetYear: promo,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!pub) return null;

      return {
        id: pub.id,
        promo: pub.targetYear ?? promo,
        semestre: 1,
        emploisDuTempsUrl: pub.filePath ?? pub.fileName ?? '',
        datePublication: pub.createdAt.toISOString(),
      };
    },

    mesNotes: async (_parent: unknown, _args: unknown, context?: GraphqlContext) => {
      const user = context?.req?.user;
      if (!user) throw new Error('Non authentifié');
      if (!user.promo) throw new Error('Promo non définie pour cet étudiant');

      const submissions = await prisma.gradeSubmission.findMany({
        where: { targetYear: user.promo, status: 'published' },
        orderBy: { createdAt: 'desc' },
      });

      return submissions
        .map((sub) => {
          const entries = JSON.parse(sub.entries || '[]') as Array<{
            studentId?: string | number;
            grade?: number;
          }>;

          const myEntry = entries.find(
            (entry) =>
              entry.studentId && String(entry.studentId) === String(user.id),
          );
          if (!myEntry) return null;

          return {
            id: sub.id,
            etudiantId: user.id,
            semestre: sub.semester || '',
            datePublication: sub.createdAt.toISOString(),
            details: [
              {
                matiere: sub.subject || '',
                typeEpreuve: sub.examType || 'DS',
                note: String(myEntry.grade ?? ''),
              },
            ],
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);
    },

    calendrierAcademique: async (
      _parent: unknown,
      _args: unknown,
      context?: GraphqlContext,
    ) => {
      const configs = await prisma.academicCalendarConfig.findMany({
        orderBy: { createdAt: 'desc' },
      });

      if (!configs.length) return [];
      const includeGradeDeadlines = isTeacherRole(context?.req?.user?.role);
      return buildAcademicEventsFromConfig(configs[0] as AnyRecord, {
        includeGradeDeadlines,
      });
    },

    academicEvent: async (
      _parent: unknown,
      args: { id: string },
      context?: GraphqlContext,
    ) => {
      const configs = await prisma.academicCalendarConfig.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (!configs.length) return null;

      const includeGradeDeadlines = isTeacherRole(context?.req?.user?.role);
      const events = buildAcademicEventsFromConfig(configs[0] as AnyRecord, {
        includeGradeDeadlines,
      });
      return events.find((event) => event.id === args.id) ?? null;
    },

    rooms: async () => {
      const rooms = await teacherService.getRooms();
      return rooms.map((room) => mapRoom(room as AnyRecord));
    },

    room: async (_parent: unknown, args: { id: string }) => {
      const room = await teacherService.getRoomById(args.id);
      if (!room) return null;
      return mapRoom(room as AnyRecord);
    },

    roomMembers: async (_parent: unknown, args: { roomId: string }) => {
      return teacherService.getRoomMembers(args.roomId);
    },

    roomMember: async (
      _parent: unknown,
      args: { roomId: string; userId: string },
    ) => {
      return teacherService.getRoomMemberById(args.roomId, args.userId);
    },

    homeworksByYear: async (_parent: unknown, args: { year: string }) => {
      const homeworks = await teacherService.getHomeworksByYear(args.year);
      return homeworks.map((homework) =>
        mapHomework({
          ...(homework as AnyRecord),
          submissions: (homework as AnyRecord).submissions ?? [],
        }),
      );
    },

    homeworkSubmissions: async (
      _parent: unknown,
      args: { homeworkId: string },
    ) => {
      const submissions = await teacherService.getHomeworkSubmissions(
        args.homeworkId,
      );
      return submissions.map((submission) => mapSubmission(submission as AnyRecord));
    },
  },

  Mutation: {
    createRoom: async (_parent: unknown, args: { input: AnyRecord }) => {
      const room = await teacherService.createRoom(args.input as CreateRoomDto);
      return mapRoom(room as AnyRecord);
    },

    createRoomPost: async (
      _parent: unknown,
      args: { roomId: string; input: AnyRecord },
    ) => {
      const post = await teacherService.createPost(
        args.roomId,
        args.input as CreatePostDto,
      );
      return mapPost(post as AnyRecord);
    },

    createRoomHomework: async (
      _parent: unknown,
      args: { roomId: string; input: AnyRecord },
    ) => {
      const homework = await teacherService.createHomework(
        args.roomId,
        args.input as CreateHomeworkDto,
      );
      return mapHomework(homework as AnyRecord);
    },

    createRoomComment: async (
      _parent: unknown,
      args: { postId: string; input: AnyRecord },
    ) => {
      const comment = await teacherService.createComment(
        args.postId,
        args.input as CreateCommentDto,
      );
      return mapComment(comment as AnyRecord);
    },
  },
});
