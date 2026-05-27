
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum AcademicEventType {
    DS = "DS",
    EXAMEN = "EXAMEN",
    AFFICHAGE = "AFFICHAGE",
    DELIBERATION = "DELIBERATION",
    FIN_ANNEE = "FIN_ANNEE"
}

export enum DocumentCategorie {
    URGENT = "URGENT",
    DOCUMENT = "DOCUMENT",
    PLANNING = "PLANNING"
}

export class CreateRoomInput {
    name: string;
    targetYear: string;
    teacherId: string;
}

export class CreateRoomPostInput {
    content: string;
    type?: Nullable<string>;
    author?: Nullable<string>;
}

export class CreateRoomHomeworkInput {
    title: string;
    description: string;
    deadline: string;
}

export class CreateRoomCommentInput {
    content: string;
    authorName: string;
}

export class AdminPublication {
    id: string;
    title: string;
    category: string;
    content: string;
    author: string;
    targetYear?: Nullable<string>;
    fileName?: Nullable<string>;
    filePath?: Nullable<string>;
    fileSizeBytes?: Nullable<number>;
    createdAt: string;
}

export class AdminGradeEntry {
    studentId: string;
    lastName: string;
    firstName: string;
    grade: number;
}

export class AdminGradeSubmission {
    id: string;
    teacherName: string;
    teacherEmail?: Nullable<string>;
    targetYear: string;
    semester: string;
    subject: string;
    examType: string;
    title: string;
    summary?: Nullable<string>;
    entries: AdminGradeEntry[];
    status: string;
    validatedBy?: Nullable<string>;
    validatedAt?: Nullable<string>;
    publishedBy?: Nullable<string>;
    publishedAt?: Nullable<string>;
    publicationId?: Nullable<string>;
    createdAt: string;
    updatedAt: string;
}

export abstract class IQuery {
    abstract adminPublications(category?: Nullable<string>, targetYear?: Nullable<string>, search?: Nullable<string>, offset?: Nullable<number>, limit?: Nullable<number>): AdminPublication[] | Promise<AdminPublication[]>;

    abstract adminPublication(id: string): Nullable<AdminPublication> | Promise<Nullable<AdminPublication>>;

    abstract adminGradeSubmissions(status?: Nullable<string>, targetYear?: Nullable<string>, offset?: Nullable<number>, limit?: Nullable<number>): AdminGradeSubmission[] | Promise<AdminGradeSubmission[]>;

    abstract adminGradeSubmission(id: string): Nullable<AdminGradeSubmission> | Promise<Nullable<AdminGradeSubmission>>;

    abstract publications(targetYear?: Nullable<string>): Publication[] | Promise<Publication[]>;

    abstract publication(id: string): Nullable<Publication> | Promise<Nullable<Publication>>;

    abstract documents(categorie?: Nullable<string>): Nullable<Document>[] | Promise<Nullable<Document>[]>;

    abstract document(id: string): Nullable<Document> | Promise<Nullable<Document>>;

    abstract emploiDuTemps(): Nullable<Timetable> | Promise<Nullable<Timetable>>;

    abstract mesNotes(): Grade[] | Promise<Grade[]>;

    abstract calendrierAcademique(): AcademicEvent[] | Promise<AcademicEvent[]>;

    abstract academicEvent(id: string): Nullable<AcademicEvent> | Promise<Nullable<AcademicEvent>>;

    abstract rooms(): RoomType[] | Promise<RoomType[]>;

    abstract room(id: string): Nullable<RoomType> | Promise<Nullable<RoomType>>;

    abstract roomMembers(roomId: string): RoomMemberSummaryType[] | Promise<RoomMemberSummaryType[]>;

    abstract roomMember(roomId: string, userId: string): Nullable<RoomMemberDetailType> | Promise<Nullable<RoomMemberDetailType>>;

    abstract homeworksByYear(year: string): HomeworkType[] | Promise<HomeworkType[]>;

    abstract homeworkSubmissions(homeworkId: string): HomeworkSubmissionType[] | Promise<HomeworkSubmissionType[]>;
}

export class Document {
    id: string;
    titre: string;
    categorie: DocumentCategorie;
    date: string;
    contenu?: Nullable<string>;
    fichierUrl?: Nullable<string>;
}

export class Timetable {
    id: string;
    promo: string;
    semestre: number;
    emploisDuTempsUrl: string;
    datePublication: string;
}

export class GradeLine {
    matiere: string;
    typeEpreuve: string;
    note: string;
}

export class Grade {
    id: string;
    etudiantId: number;
    semestre: string;
    details: GradeLine[];
    datePublication: string;
}

export class AcademicEvent {
    id: string;
    nom: string;
    dateDebut: string;
    dateFin: string;
    type: AcademicEventType;
}

export class PublicationGradeLine {
    subject?: Nullable<string>;
    studentId?: Nullable<string>;
    studentName?: Nullable<string>;
    examType?: Nullable<string>;
    grade?: Nullable<string>;
}

export class Publication {
    id: string;
    titre: string;
    categorie: string;
    contenu: string;
    date: string;
    auteur: string;
    targetYear?: Nullable<string>;
    fichierUrl?: Nullable<string>;
    fileName?: Nullable<string>;
    fileSize?: Nullable<string>;
    grades?: Nullable<PublicationGradeLine[]>;
}

export class RoomCommentType {
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
}

export class PostType {
    id: string;
    content: string;
    type: string;
    author: string;
    fileName?: Nullable<string>;
    filePath?: Nullable<string>;
    fileSizeBytes?: Nullable<number>;
    comments: RoomCommentType[];
}

export class HomeworkSubmissionType {
    id: string;
    studentName: string;
    submittedAt: string;
    fileName?: Nullable<string>;
    filePath?: Nullable<string>;
    fileSizeBytes?: Nullable<number>;
}

export class HomeworkType {
    id: string;
    title: string;
    description: string;
    deadline: string;
    submissions: HomeworkSubmissionType[];
}

export class RoomType {
    id: string;
    name: string;
    targetYear: string;
    teacherId: string;
    teacherName?: Nullable<string>;
    posts: PostType[];
    homeworks: HomeworkType[];
}

export class RoomMemberSummaryType {
    id: string;
    name: string;
    year: string;
}

export class RoomMemberDetailType {
    id: string;
    name: string;
    email: string;
    role: string;
    year: string;
}

export abstract class IMutation {
    abstract createRoom(input: CreateRoomInput): RoomType | Promise<RoomType>;

    abstract createRoomPost(roomId: string, input: CreateRoomPostInput): PostType | Promise<PostType>;

    abstract createRoomHomework(roomId: string, input: CreateRoomHomeworkInput): HomeworkType | Promise<HomeworkType>;

    abstract createRoomComment(postId: string, input: CreateRoomCommentInput): RoomCommentType | Promise<RoomCommentType>;
}

type Nullable<T> = T | null;
