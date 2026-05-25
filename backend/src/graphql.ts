
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
    ds: string;
    examen: string;
    moyenne: string;
}

export class Grade {
    id: string;
    etudiantId: number;
    semestre: number;
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

export abstract class IQuery {
    abstract documents(categorie?: Nullable<string>): Nullable<Document>[] | Promise<Nullable<Document>[]>;

    abstract document(id: string): Nullable<Document> | Promise<Nullable<Document>>;

    abstract emploiDuTemps(): Nullable<Timetable> | Promise<Nullable<Timetable>>;

    abstract mesNotes(): Grade[] | Promise<Grade[]>;

    abstract calendrierAcademique(): AcademicEvent[] | Promise<AcademicEvent[]>;
}

type Nullable<T> = T | null;
