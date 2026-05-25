// frontend/src/graphql/queries.ts

// 1. Liste des documents allégée (pas de contenu, pas d'URL de fichier)
export const GET_DOCUMENTS = `
  query GetDocuments($categorie: String) {
    documents(categorie: $categorie) {
      id
      titre
      categorie
      date
    }
  }
`;

// 2. Détails complets d'un document spécifique (Overfetching évité au niveau global)
export const GET_DOCUMENT_DETAILS = `
  query GetDocumentDetails($id: ID!) {
    document(id: $id) {
      id
      titre
      categorie
      date
      contenu
      fichierUrl
    }
  }
`;

// 2.5 Publications pour le feed étudiant
export const GET_PUBLICATIONS = `
  query GetPublications($targetYear: String) {
    publications(targetYear: $targetYear) {
      id
      titre
      categorie
      contenu
      date
      auteur
      targetYear
      fichierUrl
      fileName
      fileSize
    }
  }
`;

// 3. Emploi du temps (Filtré côté serveur avec le contexte User JWT)
export const GET_TIMETABLE = `
  query GetTimetable {
    emploiDuTemps {
      id
      promo
      semestre
      emploisDuTempsUrl
      datePublication
    }
  }
`;

// 4. Notes de l'étudiant (Filtré côté serveur avec le contexte User JWT)
export const GET_GRADES = `
  query GetGrades {
    mesNotes {
      id
      etudiantId
      semestre
      datePublication
      details {
        matiere
        ds
        examen
        moyenne
      }
    }
  }
`;

// 5. Calendrier Académique
export const GET_ACADEMIC_CALENDAR = `
  query GetAcademicCalendar {
    calendrierAcademique {
      id
      nom
      dateDebut
      dateFin
      type
    }
  }
`;
