export const GET_PUBLICATIONS = `
  query GetPublications($targetYear: String, $userId: String) {
    publications(targetYear: $targetYear, userId: $userId) {
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

export const GET_ADMIN_PUBLICATIONS = `
  query GetAdminPublications(
    $category: String
    $targetYear: String
    $search: String
    $offset: Int
    $limit: Int
  ) {
    adminPublications(
      category: $category
      targetYear: $targetYear
      search: $search
      offset: $offset
      limit: $limit
    ) {
      id
      title
      category
      content
      author
      targetYear
      fileName
      filePath
      fileSizeBytes
      createdAt
      targetUserId
    }
  }
`;

export const GET_ADMIN_GRADE_SUBMISSIONS = `
  query GetAdminGradeSubmissions(
    $status: String
    $targetYear: String
    $offset: Int
    $limit: Int
  ) {
    adminGradeSubmissions(
      status: $status
      targetYear: $targetYear
      offset: $offset
      limit: $limit
    ) {
      id
      teacherName
      teacherEmail
      targetYear
      semester
      subject
      examType
      title
      summary
      entries {
        studentId
        lastName
        firstName
        grade
      }
      status
      validatedBy
      validatedAt
      publishedBy
      publishedAt
      publicationId
      createdAt
      updatedAt
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
