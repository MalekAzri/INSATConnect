// 2.5 Publications pour le feed étudiant
export const GET_PUBLICATIONS = `
  query GetPublications($targetYear: String) {
    publications(targetYear: $targetYear) {
      id
      titre
      categorie
      date
      auteur
      targetYear
      fileName
      fileSize
    }
  }
`;

export const GET_PUBLICATION_DETAIL = `
  query GetPublicationDetail($id: ID!) {
    publication(id: $id) {
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
      type
    }
  }
`;

export const GET_ACADEMIC_EVENT_DETAIL = `
  query GetAcademicEventDetail($id: ID!) {
    academicEvent(id: $id) {
      id
      nom
      dateDebut
      dateFin
      type
    }
  }
`;

export const GET_ROOMS = `
  query GetRooms {
    rooms {
      id
      name
      targetYear
      teacherId
      teacherName
      posts {
        id
        content
        type
        author
        fileName
        filePath
        fileSizeBytes
        comments {
          id
          authorName
          content
          createdAt
        }
      }
      homeworks {
        id
        title
        description
        deadline
        submissions {
          id
          studentName
          submittedAt
          fileName
          filePath
          fileSizeBytes
        }
      }
    }
  }
`;

export const GET_HOMEWORKS_BY_YEAR = `
  query GetHomeworksByYear($year: String!) {
    homeworksByYear(year: $year) {
      id
      title
      description
      deadline
    }
  }
`;

export const GET_HOMEWORK_SUBMISSIONS = `
  query GetHomeworkSubmissions($homeworkId: ID!) {
    homeworkSubmissions(homeworkId: $homeworkId) {
      id
      studentName
      submittedAt
      fileName
      filePath
      fileSizeBytes
    }
  }
`;

export const GET_ROOM_MEMBERS = `
  query GetRoomMembers($roomId: ID!) {
    roomMembers(roomId: $roomId) {
      id
      name
      year
    }
  }
`;

export const GET_ROOM_MEMBER_DETAIL = `
  query GetRoomMemberDetail($roomId: ID!, $userId: ID!) {
    roomMember(roomId: $roomId, userId: $userId) {
      id
      name
      email
      role
      year
    }
  }
`;

export const CREATE_ROOM = `
  mutation CreateRoom($input: CreateRoomInput!) {
    createRoom(input: $input) {
      id
      name
      targetYear
      teacherId
      teacherName
      posts { id content type author comments { id authorName content createdAt } }
      homeworks { id title description deadline submissions { id studentName submittedAt fileName filePath fileSizeBytes } }
    }
  }
`;

export const CREATE_ROOM_POST = `
  mutation CreateRoomPost($roomId: ID!, $input: CreateRoomPostInput!) {
    createRoomPost(roomId: $roomId, input: $input) {
      id
      content
      type
      author
      fileName
      filePath
      fileSizeBytes
      comments {
        id
        authorName
        content
        createdAt
      }
    }
  }
`;

export const CREATE_ROOM_HOMEWORK = `
  mutation CreateRoomHomework($roomId: ID!, $input: CreateRoomHomeworkInput!) {
    createRoomHomework(roomId: $roomId, input: $input) {
      id
      title
      description
      deadline
      submissions {
        id
        studentName
        submittedAt
        fileName
        filePath
        fileSizeBytes
      }
    }
  }
`;

export const CREATE_ROOM_COMMENT = `
  mutation CreateRoomComment($postId: ID!, $input: CreateRoomCommentInput!) {
    createRoomComment(postId: $postId, input: $input) {
      id
      authorName
      content
      createdAt
    }
  }
`;
