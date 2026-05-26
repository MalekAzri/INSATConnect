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
      grades {
        subject
        studentId
        studentName
        examType
        grade
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
