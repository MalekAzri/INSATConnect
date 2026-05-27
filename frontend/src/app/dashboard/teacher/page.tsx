"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CalendarGrid, { CalendarEvent } from "@/components/Calendar";
import {
  backendFetchJson,
  backendGraphQLFetchJson,
  buildBackendUrl,
} from "@/lib/backend";
import {
  GET_ACADEMIC_CALENDAR,
  GET_ACADEMIC_EVENT_DETAIL,
  CREATE_ROOM,
  CREATE_ROOM_HOMEWORK,
  CREATE_ROOM_POST,
  GET_HOMEWORK_SUBMISSIONS,
  GET_ROOM_MEMBER_DETAIL,
  GET_ROOM_MEMBERS,
  GET_ROOMS,
} from "@/graphql/queries";
import {
  Download,
  FileText,
  Calendar,
  LogOut,
  CheckCircle2,
  FileSpreadsheet,
  Sparkles,
  BookOpen,
  Bell,
  Plus,
  SendHorizontal,
  ChevronLeft,
  X,
  Clock,
} from "lucide-react";

// Types
interface RoomComment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface RoomPost {
  id: string;
  author: string;
  avatar: string;
  date: string;
  content: string;
  type: "announcement" | "document";
  fileName?: string;
  fileSize?: string;
  filePath?: string | null;
  fileSizeBytes?: number | null;
  isMe?: boolean;
  comments: RoomComment[];
}

interface Homework {
  id: string;
  title: string;
  description: string;
  deadline: string;
  submissionsCount: number;
}

interface HomeworkSubmission {
  id: string;
  studentName: string;
  submittedAt: string;
  fileName?: string | null;
  filePath?: string | null;
  fileSizeBytes?: number | null;
}

interface Room {
  id: string;
  name: string;
  subject: string;
  bgGradient: string;
  targetYear: string;
  posts: RoomPost[];
  homeworks: Homework[];
}

interface GraphqlAcademicEvent {
  id: string;
  nom: string;
  dateDebut?: string | null;
  dateFin?: string | null;
  type: "DS" | "EXAMEN" | "AFFICHAGE" | "DELIBERATION" | "FIN_ANNEE";
}

interface RoomMemberSummary {
  id: string;
  name: string;
  year: string;
}

interface RoomMemberDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  year: string;
}

type GradeSubmissionStatus = "pending" | "validated" | "published";

type ExamType = "DS" | "EXAM";

interface BackendGradeEntry {
  studentId: string;
  lastName: string;
  firstName: string;
  grade: number;
}

interface BackendGradeSubmission {
  id: string;
  teacherName: string;
  teacherEmail?: string | null;
  targetYear: string;
  semester: string;
  subject: string;
  examType: ExamType;
  title: string;
  summary?: string | null;
  entries: BackendGradeEntry[];
  status: GradeSubmissionStatus;
  validatedBy?: string | null;
  validatedAt?: string | null;
  publishedBy?: string | null;
  publishedAt?: string | null;
  publicationId?: string | null;
  createdAt: string;
}

interface RealtimeNotification {
  id: string;
  type: string;
  message: string;
  timestamp?: string;
  // champs supplémentaires pour les deadline_alert
  data?: {
    eventType?: string;
    date?: string;
    daysLeft?: number;
  };
}

interface TeacherGradeRow {
  studentId: string;
  lastName: string;
  firstName: string;
  grade: string;
}

const classTargets = ["MPI", "GL2", "GL3", "GL4", "IIA", "IMI", "RT"] as const;

const emptyGradeRow = (): TeacherGradeRow => ({
  studentId: "",
  lastName: "",
  firstName: "",
  grade: "",
});

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const parseCsvLine = (line: string, delimiter: "," | ";"): string[] => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const parseGradeRowsFromCsv = (rawCsv: string): TeacherGradeRow[] => {
  const lines = rawCsv
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    throw new Error("Le fichier est vide.");
  }

  const semicolonCount = (lines[0].match(/;/g) || []).length;
  const commaCount = (lines[0].match(/,/g) || []).length;
  const delimiter: "," | ";" = semicolonCount >= commaCount ? ";" : ",";

  const matrix = lines.map((line) => parseCsvLine(line, delimiter));
  const firstRow = matrix[0];

  const headerAliases = {
    studentId: new Set(["studentid", "matricule", "id", "cin", "numero", "numeromatricule"]),
    lastName: new Set(["lastname", "nom", "nomfamille"]),
    firstName: new Set(["firstname", "prenom", "prenoms"]),
    grade: new Set(["grade", "note", "resultat", "avg", "moyenne"]),
  };

  const normalizedHeader = firstRow.map((cell) => normalizeHeader(cell));
  const headerIndexes = {
    studentId: normalizedHeader.findIndex((key) => headerAliases.studentId.has(key)),
    lastName: normalizedHeader.findIndex((key) => headerAliases.lastName.has(key)),
    firstName: normalizedHeader.findIndex((key) => headerAliases.firstName.has(key)),
    grade: normalizedHeader.findIndex((key) => headerAliases.grade.has(key)),
  };

  const hasRecognizedHeader =
    headerIndexes.studentId >= 0 &&
    headerIndexes.lastName >= 0 &&
    headerIndexes.firstName >= 0 &&
    headerIndexes.grade >= 0;

  const startIndex = hasRecognizedHeader ? 1 : 0;

  const rows = matrix
    .slice(startIndex)
    .map((cells) => {
      const getCell = (index: number, fallbackIndex: number) =>
        index >= 0 ? (cells[index] ?? "") : (cells[fallbackIndex] ?? "");

      const studentId = getCell(headerIndexes.studentId, 0).trim();
      const lastName = getCell(headerIndexes.lastName, 1).trim();
      const firstName = getCell(headerIndexes.firstName, 2).trim();
      const grade = getCell(headerIndexes.grade, 3).replace(",", ".").trim();

      if (!studentId && !lastName && !firstName && !grade) {
        return null;
      }

      return { studentId, lastName, firstName, grade };
    })
    .filter((row): row is TeacherGradeRow => row !== null);

  if (!rows.length) {
    throw new Error("Aucune ligne de notes exploitable trouvée.");
  }

  return rows;
};

const gradeStatusMeta: Record<GradeSubmissionStatus, { label: string; className: string }> = {
  pending: {
    label: "En attente",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  validated: {
    label: "Validée",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  published: {
    label: "Publiée",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

// Icône et couleur selon le type de notification (identique à l'admin)
const notifMeta: Record<string, { icon: string; color: string }> = {
  deadline_alert:     { icon: "⏰", color: "bg-orange-50 border-orange-100 text-orange-700" },
  "grades.submitted": { icon: "📋", color: "bg-blue-50 border-blue-100 text-blue-700" },
  message:            { icon: "💬", color: "bg-slate-50 border-slate-100 text-slate-700" },
};

const getNotifMeta = (type: string) =>
  notifMeta[type] ?? { icon: "🔔", color: "bg-slate-50 border-slate-100 text-slate-700" };

const formatDateTime = (isoDate?: string | null) => {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFileSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return "";
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
};

const formatDate = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const toCalendarEvent = (
  dateStr: string | null | undefined,
  type: CalendarEvent["type"],
  title: string,
): CalendarEvent | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return { dayNumber: d.getDate(), type, title, date: dateStr };
};

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, logout } = useUser();
  const [activeTab, setActiveTab] = useState<"rooms" | "calendar" | "grades">("rooms");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"default" | "deadline">("default");

  // Active Room State
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [gradeTargetYear, setGradeTargetYear] = useState("GL3");
  const [gradeSemester, setGradeSemester] = useState("S1");
  const [gradeSubject, setGradeSubject] = useState("");
  const [gradeExamType, setGradeExamType] = useState<ExamType>("DS");
  const [gradeTitle, setGradeTitle] = useState("");
  const [gradeSummary, setGradeSummary] = useState("");
  const [gradeRows, setGradeRows] = useState<TeacherGradeRow[]>([emptyGradeRow()]);
  const [importedGradesFileName, setImportedGradesFileName] = useState<string | null>(null);
  const [teacherSubmissions, setTeacherSubmissions] = useState<BackendGradeSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [isSubmittingGrades, setIsSubmittingGrades] = useState(false);
  const [realtimeNotifications, setRealtimeNotifications] = useState<RealtimeNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [academicEventsSummary, setAcademicEventsSummary] = useState<GraphqlAcademicEvent[]>([]);
  const [academicEventDetailsById, setAcademicEventDetailsById] = useState<Record<string, GraphqlAcademicEvent>>({});
  const [selectedAcademicEventId, setSelectedAcademicEventId] = useState<string | null>(null);
  const [loadingAcademicEventId, setLoadingAcademicEventId] = useState<string | null>(null);
  const gradeCsvInputRef = useRef<HTMLInputElement>(null);

  // Redirect to login if user directly lands on dashboard without being authenticated
  useEffect(() => {
    if (!user.isLoggedIn) {
      router.push("/login");
    }
  }, [user.isLoggedIn, router]);

  const showToast = (msg: string, type: "default" | "deadline" = "default") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const parseNotificationEvent = (event: MessageEvent): RealtimeNotification | null => {
    try {
      const payload = JSON.parse(event.data as string) as any;
      const eventData = payload?.data ?? payload;
      const message = eventData?.message ?? payload?.message;
      if (!message) return null;
      return {
        id: payload?.id ?? String(Date.now()),
        type: payload?.type ?? eventData?.type ?? 'message',
        message,
        timestamp: eventData?.timestamp ?? payload?.timestamp ?? new Date().toISOString(),
        data: eventData?.data ?? undefined,
      };
    } catch {
      return null;
    }
  };

  const [rooms, setRooms] = useState<Room[]>([]);
  const [expandedHomeworkId, setExpandedHomeworkId] = useState<string | null>(null);
  const [homeworkSubmissionsById, setHomeworkSubmissionsById] = useState<Record<string, HomeworkSubmission[]>>({});
  const [loadingHomeworkSubmissionsId, setLoadingHomeworkSubmissionsId] = useState<string | null>(null);
  const [roomMembersByRoomId, setRoomMembersByRoomId] = useState<Record<string, RoomMemberSummary[]>>({});
  const [loadingRoomMembersRoomId, setLoadingRoomMembersRoomId] = useState<string | null>(null);
  const [selectedRoomMemberId, setSelectedRoomMemberId] = useState<string | null>(null);
  const [roomMemberDetailsByKey, setRoomMemberDetailsByKey] = useState<Record<string, RoomMemberDetail>>({});
  const [loadingRoomMemberKey, setLoadingRoomMemberKey] = useState<string | null>(null);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const selectedRoomMemberDetailKey =
    selectedRoomId && selectedRoomMemberId
      ? `${selectedRoomId}:${selectedRoomMemberId}`
      : null;
  const selectedRoomMemberDetail = selectedRoomMemberDetailKey
    ? roomMemberDetailsByKey[selectedRoomMemberDetailKey]
    : null;

  const roomGradients = [
    "from-blue-500 to-indigo-600",
    "from-teal-500 to-emerald-600",
    "from-purple-500 to-fuchsia-600",
    "from-rose-500 to-orange-500",
  ];
  const getRoomGradient = (id: string) => {
    let hash = 0;
    for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) % roomGradients.length;
    return roomGradients[hash];
  };

  const loadRooms = React.useCallback(async () => {
    try {
      const data = await backendGraphQLFetchJson<{ rooms: any[] }>(GET_ROOMS);
      const teacherRooms = (data.rooms ?? []).filter((r: any) =>
        r.teacherId === String(user.id) || r.teacherId === user.name
      );
      setRooms(teacherRooms.map((r: any) => ({
        id: r.id,
        name: r.name,
        subject: r.name,
        targetYear: r.targetYear,
        bgGradient: getRoomGradient(r.id),
        posts: (r.posts ?? []).map((p: any) => ({
          id: p.id,
          author: p.author || r.teacherId,
          avatar: (p.author?.[0] ?? r.teacherId?.[0] ?? "P").toUpperCase(),
          date: "Récemment",
          content: p.content,
          type: p.type ?? "announcement",
          fileName: p.fileName ?? undefined,
          filePath: p.filePath ?? null,
          fileSizeBytes: p.fileSizeBytes ?? null,
          isMe: p.author === user.name || p.author === String(user.id),
          comments: (p.comments ?? []).map((c: any) => ({
            id: c.id,
            authorName: c.authorName,
            content: c.content,
            createdAt: c.createdAt,
          })),
        })),
        homeworks: (r.homeworks ?? []).map((h: any) => ({
          id: h.id,
          title: h.title,
          description: h.description,
          deadline: typeof h.deadline === "string" ? h.deadline.slice(0, 10) : h.deadline,
          submissionsCount: Array.isArray(h.submissions) ? h.submissions.length : 0,
        })),
      })));
    } catch {
      showToast("Impossible de charger les salles.");
    }
  }, [user.id, user.name]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  // Polling toutes les 5s quand une room est ouverte (fallback si SSE ne reçoit pas la notif)
  useEffect(() => {
    if (!selectedRoomId) return;
    const timer = setInterval(() => { void loadRooms(); }, 5000);
    return () => clearInterval(timer);
  }, [selectedRoomId, loadRooms]);

  useEffect(() => {
    if (!user.isLoggedIn || !user.id) return;

    const loadNotificationHistory = async () => {
      try {
        const history = await backendFetchJson<RealtimeNotification[]>(
          `/admin-agent/notifications/history?role=teacher&userId=${user.id}`,
        );
        setRealtimeNotifications(history);
        setUnreadCount(0);
      } catch {
        // ignore failures on notification history
      }
    };

    void loadNotificationHistory();

    const sseUrl = buildBackendUrl(`/admin-agent/notifications/stream?role=teacher&userId=${user.id}`);
    const source = new EventSource(sseUrl);

    // Notifications génériques
    source.addEventListener("message", (event: MessageEvent) => {
      const notification = parseNotificationEvent(event);
      if (!notification) return;
      setRealtimeNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
      showToast(notification.message);
      void loadRooms();
    });

    // Alertes échéances du checker calendar
    source.addEventListener("deadline_alert", (event: MessageEvent) => {
      const notification = parseNotificationEvent(event);
      if (!notification) return;
      setRealtimeNotifications((prev) => [notification, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
      showToast(`⏰ ${notification.message}`, "deadline");
    });

    return () => source.close();
  }, [user.isLoggedIn, user.id, loadRooms]);

  useEffect(() => {
    if (selectedRoom?.targetYear) {
      setGradeTargetYear(selectedRoom.targetYear.toUpperCase());
    }
  }, [selectedRoom?.targetYear]);

  useEffect(() => {
    setExpandedHomeworkId(null);
    setSelectedRoomMemberId(null);
  }, [selectedRoomId]);

  useEffect(() => {
    if (!selectedRoomId) return;
    if (roomMembersByRoomId[selectedRoomId]) return;

    const loadRoomMembers = async () => {
      try {
        setLoadingRoomMembersRoomId(selectedRoomId);
        const data = await backendGraphQLFetchJson<{ roomMembers: RoomMemberSummary[] }>(
          GET_ROOM_MEMBERS,
          { roomId: selectedRoomId },
        );
        setRoomMembersByRoomId((prev) => ({
          ...prev,
          [selectedRoomId]: data.roomMembers ?? [],
        }));
      } catch {
        showToast("Impossible de charger les membres de la room.");
      } finally {
        setLoadingRoomMembersRoomId(null);
      }
    };

    void loadRoomMembers();
  }, [selectedRoomId, roomMembersByRoomId]);

  const handleLoadRoomMemberDetail = async (roomId: string, memberId: string) => {
    setSelectedRoomMemberId(memberId);
    const detailKey = `${roomId}:${memberId}`;
    if (roomMemberDetailsByKey[detailKey]) return;

    try {
      setLoadingRoomMemberKey(detailKey);
      const data = await backendGraphQLFetchJson<{ roomMember: RoomMemberDetail | null }>(
        GET_ROOM_MEMBER_DETAIL,
        { roomId, userId: memberId },
      );
      const roomMember = data.roomMember;
      if (!roomMember) return;
      setRoomMemberDetailsByKey((prev) => ({
        ...prev,
        [detailKey]: roomMember,
      }));
    } catch {
      showToast("Impossible de charger le détail du membre.");
    } finally {
      setLoadingRoomMemberKey(null);
    }
  };

  const loadAcademicEventDetail = async (eventId: string) => {
    setSelectedAcademicEventId(eventId);
    if (academicEventDetailsById[eventId]) return;

    try {
      setLoadingAcademicEventId(eventId);
      const data = await backendGraphQLFetchJson<{ academicEvent: GraphqlAcademicEvent | null }>(
        GET_ACADEMIC_EVENT_DETAIL,
        { id: eventId },
      );
      const academicEvent = data.academicEvent;
      if (!academicEvent) return;
      setAcademicEventDetailsById((prev) => ({
        ...prev,
        [eventId]: academicEvent,
      }));
    } catch {
      showToast("Impossible de charger le détail de l'événement.");
    } finally {
      setLoadingAcademicEventId(null);
    }
  };

  useEffect(() => {
    if (activeTab !== "calendar") return;

    const loadCalendar = async () => {
      try {
        const data = await backendGraphQLFetchJson<{ calendrierAcademique: GraphqlAcademicEvent[] }>(
          GET_ACADEMIC_CALENDAR,
        );
        const events = data.calendrierAcademique ?? [];
        setAcademicEventsSummary(events);

        const nextEvents = events
          .map((event) =>
            toCalendarEvent(
              event.dateDebut ?? event.dateFin,
              event.type === "DS" || event.type === "EXAMEN" ? "exam" : "deadline",
              event.nom,
            ),
          )
          .filter((event): event is CalendarEvent => event !== null);

        setCalendarEvents(nextEvents);
      } catch (error) {
        console.error(error);
        showToast("Impossible de charger le calendrier académique.");
      }
    };

    void loadCalendar();
  }, [activeTab]);

  // Room Creation Form State
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomSubject, setNewRoomSubject] = useState("");
  const [newRoomYear, setNewRoomYear] = useState("GL3");
  const [newRoomGradient, setNewRoomGradient] = useState("from-purple-500 to-fuchsia-600");

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !newRoomSubject.trim()) return;

    try {
      const created = await backendGraphQLFetchJson<{ createRoom: any }>(
        CREATE_ROOM,
        {
          input: {
            name: newRoomName.trim(),
            targetYear: newRoomYear,
            teacherId: String(user.id),
          },
        },
      );

      const newRoom: Room = {
        id: created.createRoom.id,
        name: created.createRoom.name,
        subject: newRoomSubject,
        targetYear: created.createRoom.targetYear,
        bgGradient: newRoomGradient,
        posts: [],
        homeworks: [],
      };

      setRooms([newRoom, ...rooms]);
      setIsCreatingRoom(false);
      setNewRoomName("");
      setNewRoomSubject("");
      showToast(`Salle "${newRoomName}" créée avec succès !`);
    } catch {
      showToast("Impossible de créer la salle.");
    }
  };

  // Post / Document / Homework Creation State
  const [composeType, setComposeType] = useState<"post" | "homework">("post");
  const [postContent, setPostContent] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedFile(e.target.files[0]);
    }
  };
  const [hwTitle, setHwTitle] = useState("");
  const [hwDesc, setHwDesc] = useState("");
  const [hwDeadline, setHwDeadline] = useState("");

  const handleCreatePost = async () => {
    if (!postContent.trim() || !selectedRoomId) return;

    try {
      let createdPost: any;
      if (attachedFile) {
        const formData = new FormData();
        formData.append("content", postContent.trim());
        formData.append("type", "document");
        formData.append("author", user.name || "Enseignant");
        formData.append("file", attachedFile);
        createdPost = await backendFetchJson<any>(
          `/teacher/rooms/${selectedRoomId}/posts`,
          {
            method: "POST",
            body: formData,
          },
        );
      } else {
        const created = await backendGraphQLFetchJson<{ createRoomPost: any }>(
          CREATE_ROOM_POST,
          {
            roomId: selectedRoomId,
            input: {
              content: postContent.trim(),
              type: "announcement",
              author: user.name || "Enseignant",
            },
          },
        );
        createdPost = created.createRoomPost;
      }

      const newPost: RoomPost = {
        id: createdPost.id,
        author: user.name || "Enseignant",
        avatar: user.name ? user.name[0].toUpperCase() : "E",
        date: "À l'instant",
        content: createdPost.content,
        type: createdPost.type,
        fileName: createdPost.fileName ?? attachedFile?.name ?? undefined,
        filePath: createdPost.filePath ?? null,
        fileSizeBytes: createdPost.fileSizeBytes ?? attachedFile?.size ?? null,
        isMe: true,
        comments: [],
      };

      setRooms((prev) =>
        prev.map((room) =>
          room.id === selectedRoomId
            ? { ...room, posts: [newPost, ...room.posts] }
            : room,
        ),
      );
      setPostContent("");
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("Publication ajoutée !");
    } catch {
      showToast("Impossible d'ajouter la publication.");
    }
  };

  const handleCreateHomework = async () => {
    if (!hwTitle.trim() || !hwDesc.trim() || !hwDeadline.trim() || !selectedRoomId) return;

    try {
      const created = await backendGraphQLFetchJson<{ createRoomHomework: any }>(
        CREATE_ROOM_HOMEWORK,
        {
          roomId: selectedRoomId,
          input: {
            title: hwTitle.trim(),
            description: hwDesc.trim(),
            deadline: hwDeadline,
          },
        },
      );

      const newHw: Homework = {
        id: created.createRoomHomework.id,
        title: created.createRoomHomework.title,
        description: created.createRoomHomework.description,
        deadline: typeof created.createRoomHomework.deadline === "string"
          ? created.createRoomHomework.deadline.slice(0, 10)
          : hwDeadline,
        submissionsCount: 0,
      };

      setRooms(rooms.map(r => r.id === selectedRoomId ? { ...r, homeworks: [newHw, ...r.homeworks] } : r));
      setHwTitle("");
      setHwDesc("");
      setHwDeadline("");
      setComposeType("post");
      showToast("Devoir assigné !");
    } catch {
      showToast("Impossible d'assigner le devoir.");
    }
  };

  const handleToggleHomeworkSubmissions = async (homeworkId: string) => {
    if (expandedHomeworkId === homeworkId) {
      setExpandedHomeworkId(null);
      return;
    }

    setExpandedHomeworkId(homeworkId);
    if (homeworkSubmissionsById[homeworkId]) return;

    try {
      setLoadingHomeworkSubmissionsId(homeworkId);
      const submissions = await backendGraphQLFetchJson<{ homeworkSubmissions: HomeworkSubmission[] }>(
        GET_HOMEWORK_SUBMISSIONS,
        { homeworkId },
      );
      setHomeworkSubmissionsById((prev) => ({ ...prev, [homeworkId]: submissions.homeworkSubmissions }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      showToast(`Impossible de charger les soumissions: ${message}`);
    } finally {
      setLoadingHomeworkSubmissionsId(null);
    }
  };

  const loadTeacherSubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const submissions = await backendFetchJson<BackendGradeSubmission[]>(
        "/admin-agent/grades/submissions?limit=100",
      );
      const normalizedTeacherName = user.name.trim().toLowerCase();
      setTeacherSubmissions(
        normalizedTeacherName
          ? submissions.filter(
              (submission) =>
                submission.teacherName.trim().toLowerCase() === normalizedTeacherName,
            )
          : submissions,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      showToast(`Chargement des soumissions impossible: ${message}`);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "grades") return;
    void loadTeacherSubmissions();
  }, [activeTab]);

  const updateGradeRow = (
    rowIndex: number,
    field: keyof TeacherGradeRow,
    value: string,
  ) => {
    setGradeRows((prev) =>
      prev.map((row, index) =>
        index === rowIndex ? { ...row, [field]: value } : row,
      ),
    );
  };

  const addGradeRow = () => {
    setGradeRows((prev) => [...prev, emptyGradeRow()]);
  };

  const removeGradeRow = (rowIndex: number) => {
    setGradeRows((prev) =>
      prev.length === 1
        ? [emptyGradeRow()]
        : prev.filter((_, index) => index !== rowIndex),
    );
  };

  const handleGradeFileImport = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedRows = parseGradeRowsFromCsv(text);
      setGradeRows(importedRows);
      setImportedGradesFileName(file.name);
      showToast(`${importedRows.length} lignes importées depuis ${file.name}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      showToast(`Import CSV impossible: ${message}`);
    } finally {
      if (gradeCsvInputRef.current) {
        gradeCsvInputRef.current.value = "";
      }
    }
  };

  const downloadGradesCsvTemplate = () => {
    const template =
      "studentId,lastName,firstName,grade\n" +
      "12345,Ben Ali,Mohamed,14.5\n" +
      "12346,Trabelsi,Fatma,16\n";

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "modele_notes.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmitGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeTitle.trim()) {
      showToast("Ajoutez un titre pour la soumission.");
      return;
    }

    if (!gradeSubject.trim()) {
      showToast("Indiquez la matière.");
      return;
    }

    const nonEmptyRows = gradeRows.filter(
      (row) =>
        row.studentId.trim() ||
        row.lastName.trim() ||
        row.firstName.trim() ||
        row.grade.trim(),
    );

    if (!nonEmptyRows.length) {
      showToast("Ajoutez au moins une ligne de notes.");
      return;
    }

    try {
      const entries = nonEmptyRows.map((row, index) => {
        const studentId = row.studentId.trim();
        const lastName = row.lastName.trim();
        const firstName = row.firstName.trim();
        const grade = Number(row.grade);

        if (!studentId || !lastName || !firstName) {
          throw new Error(`Ligne ${index + 1}: matricule, nom et prénom obligatoires.`);
        }

        if (!Number.isFinite(grade) || grade < 0 || grade > 20) {
          throw new Error(`Ligne ${index + 1}: la note doit être entre 0 et 20.`);
        }

        return { studentId, lastName, firstName, grade };
      });

      setIsSubmittingGrades(true);
      await backendFetchJson<BackendGradeSubmission>("/admin-agent/grades/submissions", {
        method: "POST",
        body: JSON.stringify({
          teacherName: user.name || "Enseignant",
          teacherEmail: user.email || undefined,
          targetYear: gradeTargetYear,
          semester: gradeSemester,
          subject: gradeSubject.trim(),
          examType: gradeExamType,
          title: gradeTitle.trim(),
          summary: gradeSummary.trim() || undefined,
          entries,
        }),
      });

      setGradeTitle("");
      setGradeSummary("");
      setGradeSubject("");
      setGradeExamType("DS");
      setGradeRows([emptyGradeRow()]);
      setImportedGradesFileName(null);
      showToast("Soumission de notes envoyée à l'administration.");
      await loadTeacherSubmissions();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      showToast(`Soumission impossible: ${message}`);
    } finally {
      setIsSubmittingGrades(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9FBFC] text-slate-800">
      
      {/* Toast — orange pour deadline, slate pour le reste */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-2.5 rounded-2xl px-5 py-4 text-xs font-bold text-white shadow-xl animate-slideUp ${
          toastType === "deadline" ? "bg-orange-500" : "bg-slate-900"
        }`}>
          {toastType === "deadline"
            ? <Clock className="h-4 w-4 text-white" />
            : <Sparkles className="h-4 w-4 text-teal-400" />
          }
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-100 shrink-0">
        <Link href="/" className="flex h-20 items-center gap-2 px-6 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-black tracking-tighter shadow-md shadow-teal-500/10">
            iC
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-800">
            INSAT<span className="text-teal-600"> Connect</span>
          </span>
        </Link>

        {/* Teacher Mini Card */}
        <div className="p-5 border-b border-slate-100 bg-[#F9FBFC]/50 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-teal-500/20">
              {user.name ? user.name.split(" ").map(n=>n[0]).join("") : "PR"}
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-800 leading-tight">{user.name || "Enseignant"}</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Espace Enseignant</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => { setActiveTab("rooms"); setSelectedRoomId(null); setIsCreatingRoom(false); }}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "rooms" ? "bg-teal-50/70 text-teal-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <BookOpen className="h-4.5 w-4.5" />
            <span>Mes Salles de Cours</span>
          </button>

          <button
            onClick={() => { setActiveTab("calendar"); setSelectedRoomId(null); setIsCreatingRoom(false); }}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "calendar" ? "bg-teal-50/70 text-teal-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Calendar className="h-4.5 w-4.5" />
            <span>Calendrier DS & Examens</span>
          </button>

          <button
            onClick={() => { setActiveTab("grades"); setSelectedRoomId(null); setIsCreatingRoom(false); }}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "grades" ? "bg-teal-50/70 text-teal-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <FileSpreadsheet className="h-4.5 w-4.5" />
            <span>Soumission des Notes</span>
          </button>

        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-extrabold text-slate-800 capitalize flex items-center gap-2">
              {activeTab === "rooms" && selectedRoomId ? (
                <>
                  <button onClick={() => setSelectedRoomId(null)} className="mr-2 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span>{selectedRoom?.name}</span>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md ml-2">{selectedRoom?.targetYear}</span>
                </>
              ) : (
                <span>
                  {activeTab === "rooms" && "Mes Salles de Cours"}
                  {activeTab === "calendar" && "Calendrier"}
                  {activeTab === "grades" && "Soumission des Notes"}
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Cloche notifications */}
            <div
              className="relative cursor-pointer"
              onMouseEnter={() => { setIsNotificationsOpen(true); setUnreadCount(0); }}
              onMouseLeave={() => setIsNotificationsOpen(false)}
            >
              <div className="p-2.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-colors flex items-center justify-center text-slate-500 relative">
                <Bell className="h-5 w-5" />
                {realtimeNotifications.length > 0 && (
                  <span className="ml-1 text-xs font-bold">{realtimeNotifications.length}</span>
                )}
                {/* Badge rouge si non lues */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center px-1">
                    {unreadCount}
                  </span>
                )}
              </div>

              {/* Dropdown notifications */}
              <div className={`absolute right-0 mt-3 w-96 rounded-3xl bg-white border border-slate-100 shadow-2xl p-4 z-50 ${isNotificationsOpen ? 'block' : 'hidden'}`}>
                <h4 className="text-xs font-extrabold text-slate-800 pb-2 border-b border-slate-100 flex items-center justify-between">
                  Notifications récentes
                  {realtimeNotifications.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400">{realtimeNotifications.length} au total</span>
                  )}
                </h4>
                <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                  {realtimeNotifications.length > 0 ? (
                    realtimeNotifications.map((notif) => {
                      const meta = getNotifMeta(notif.type);
                      return (
                        <div key={notif.id} className={`p-2.5 border rounded-xl flex gap-2.5 ${meta.color}`}>
                          <span className="text-sm shrink-0">{meta.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 leading-snug">{notif.message}</p>
                            {/* Détail spécifique aux deadline_alert */}
                            {notif.type === "deadline_alert" && notif.data?.daysLeft !== undefined && (
                              <p className="text-[10px] font-semibold text-orange-600 mt-0.5">
                                J-{notif.data.daysLeft} · {notif.data.date ? new Date(notif.data.date).toLocaleDateString("fr-FR") : ""}
                              </p>
                            )}
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                              {new Date(notif.timestamp || Date.now()).toLocaleString("fr-FR")}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-slate-400 text-[10px] font-semibold text-center py-4">Aucune nouvelle notification</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pl-3 border-l border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
                {user.name ? user.name[0] : "E"}
              </div>
              <span className="hidden sm:inline text-xs font-extrabold text-slate-700">
                {user.name?.split(" ")[0]}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F9FBFC] p-6">
          <div className="mx-auto max-w-5xl w-full h-full flex flex-col">
            
            {/* TAB: ROOMS (List of rooms) */}
            {activeTab === "rooms" && !selectedRoomId && !isCreatingRoom && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-extrabold text-slate-800">Vos Espaces d'Étude</h2>
                  <button 
                    onClick={() => setIsCreatingRoom(true)}
                    className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-teal-500/20 transition-all"
                  >
                    <Plus className="h-5 w-5" /> Créer une salle
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rooms.map(room => (
                    <div 
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className="group cursor-pointer bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                    >
                      <div className={`h-28 bg-gradient-to-tr ${room.bgGradient} p-5 flex flex-col justify-between relative overflow-hidden`}>
                        <div className="absolute top-[-20%] right-[-10%] h-32 w-32 rounded-full bg-white/10 blur-xl"></div>
                        <div className="flex justify-between items-start z-10">
                          <span className="px-2 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase rounded-lg">
                            {room.targetYear}
                          </span>
                        </div>
                        <h3 className="text-white font-extrabold text-lg z-10 line-clamp-1">{room.name}</h3>
                      </div>
                      <div className="p-5">
                        <p className="text-xs text-slate-500 font-semibold mb-4 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" /> {room.subject}
                        </p>
                        <div className="flex gap-4 border-t border-slate-50 pt-4">
                          <div className="flex flex-col">
                            <span className="text-lg font-black text-slate-800">{room.posts.length}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Posts</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-lg font-black text-slate-800">{room.homeworks.length}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Devoirs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: ROOMS (Create Room Form) */}
            {activeTab === "rooms" && !selectedRoomId && isCreatingRoom && (
              <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-extrabold text-slate-800">Créer une nouvelle salle</h2>
                  <button onClick={() => setIsCreatingRoom(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={(e) => { void handleCreateRoom(e); }} className="space-y-5">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase mb-2">Nom de la salle</label>
                    <input 
                      type="text" required
                      value={newRoomName} onChange={e => setNewRoomName(e.target.value)}
                      placeholder="Ex: Programmation Web Avancée"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase mb-2">Matière / Module</label>
                    <input 
                      type="text" required
                      value={newRoomSubject} onChange={e => setNewRoomSubject(e.target.value)}
                      placeholder="Ex: Technologies du Web"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-2">Classe Ciblée</label>
                      <select 
                        value={newRoomYear} onChange={e => setNewRoomYear(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors cursor-pointer"
                      >
                        {classTargets.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-2">Couleur du thème</label>
                      <select 
                        value={newRoomGradient} onChange={e => setNewRoomGradient(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500 focus:bg-white transition-colors cursor-pointer"
                      >
                        <option value="from-blue-500 to-indigo-600">Bleu Océan</option>
                        <option value="from-teal-500 to-emerald-600">Vert Émeraude</option>
                        <option value="from-purple-500 to-fuchsia-600">Violet Nébuleuse</option>
                        <option value="from-rose-500 to-orange-500">Coucher de Soleil</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsCreatingRoom(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">Annuler</button>
                    <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20 transition-all">Créer la salle</button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: ROOMS (Single Room View / Classroom) */}
            {activeTab === "rooms" && selectedRoomId && selectedRoom && (
              <div className="max-w-3xl mx-auto w-full space-y-6 pb-10">
                {/* Room Banner */}
                <div className={`h-40 rounded-3xl bg-gradient-to-tr ${selectedRoom.bgGradient} p-6 flex flex-col justify-end relative overflow-hidden shadow-md`}>
                  <div className="absolute top-[-50%] right-[-10%] h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                  <h2 className="text-3xl font-black text-white relative z-10">{selectedRoom.name}</h2>
                  <p className="text-white/80 font-semibold mt-1 relative z-10">{selectedRoom.subject} • Classe : {selectedRoom.targetYear}</p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-extrabold text-slate-800">Membres de la room</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {selectedRoom.targetYear}
                    </span>
                  </div>
                  {loadingRoomMembersRoomId === selectedRoom.id ? (
                    <p className="text-xs text-slate-500 font-semibold">Chargement des membres...</p>
                  ) : (roomMembersByRoomId[selectedRoom.id] ?? []).length === 0 ? (
                    <p className="text-xs text-slate-500 font-semibold">Aucun membre trouvé.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(roomMembersByRoomId[selectedRoom.id] ?? []).map((member) => (
                        <button
                          key={member.id}
                          onClick={() => { void handleLoadRoomMemberDetail(selectedRoom.id, member.id); }}
                          className={`text-left rounded-2xl border px-3 py-2 transition-colors ${
                            selectedRoomMemberId === member.id
                              ? "border-teal-300 bg-teal-50"
                              : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-800">{member.name}</p>
                          <p className="text-[10px] font-semibold text-slate-500">Année: {member.year}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedRoomMemberId && (
                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      {loadingRoomMemberKey === selectedRoomMemberDetailKey ? (
                        <p className="text-xs text-slate-500 font-semibold">Chargement du détail...</p>
                      ) : selectedRoomMemberDetail ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800">{selectedRoomMemberDetail.name}</p>
                          <p className="text-[11px] text-slate-600">Email: {selectedRoomMemberDetail.email}</p>
                          <p className="text-[11px] text-slate-600">Rôle: {selectedRoomMemberDetail.role}</p>
                          <p className="text-[11px] text-slate-600">Année: {selectedRoomMemberDetail.year}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 font-semibold">Aucun détail disponible.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Composer */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
                  <div className="flex gap-4 mb-4 border-b border-slate-100 pb-2">
                    <button 
                      onClick={() => setComposeType("post")}
                      className={`text-sm font-bold pb-2 border-b-2 transition-all ${composeType === "post" ? "border-teal-500 text-teal-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                    >
                      Publication & Documents
                    </button>
                    <button 
                      onClick={() => setComposeType("homework")}
                      className={`text-sm font-bold pb-2 border-b-2 transition-all ${composeType === "homework" ? "border-teal-500 text-teal-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                    >
                      Assigner un Devoir
                    </button>
                  </div>

                  {composeType === "post" ? (
                    <div className="space-y-3">
                      <textarea 
                        placeholder="Annoncez quelque chose à votre classe..."
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-300 focus:bg-white transition-all min-h-[100px] resize-none"
                      />
                      <div className="flex justify-between items-center">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          className="hidden" 
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-colors border ${attachedFile ? "bg-teal-50 text-teal-600 border-teal-200" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                        >
                          <FileText className="h-4 w-4" /> {attachedFile ? attachedFile.name : "Joindre un document"}
                        </button>
                        <button 
                          onClick={() => { void handleCreatePost(); }}
                          disabled={!postContent.trim()}
                          className="bg-teal-600 disabled:bg-teal-300 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md shadow-teal-500/20 transition-all flex items-center gap-2"
                        >
                          Publier <SendHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input 
                        type="text" placeholder="Titre du devoir" value={hwTitle} onChange={(e) => setHwTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-300"
                      />
                      <textarea 
                        placeholder="Instructions pour les étudiants..." value={hwDesc} onChange={(e) => setHwDesc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-300 min-h-[80px] resize-none"
                      />
                      <div className="flex gap-4">
                        <input 
                          type="date" value={hwDeadline} onChange={(e) => setHwDeadline(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-300"
                        />
                        <button 
                          onClick={() => { void handleCreateHomework(); }}
                          disabled={!hwTitle.trim() || !hwDesc.trim() || !hwDeadline.trim()}
                          className="bg-teal-600 disabled:bg-teal-300 hover:bg-teal-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md transition-all"
                        >
                          Assigner
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Feed of Posts & Homeworks */}
                <div className="space-y-4">
                  {selectedRoom.homeworks.map(hw => (
                    <div key={hw.id} className="bg-white rounded-3xl border border-orange-100 p-5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400"></div>
                      <div className="flex justify-between items-start mb-2 ml-2">
                        <div className="flex items-center gap-2 text-orange-600 text-xs font-black uppercase tracking-wider">
                          <CheckCircle2 className="h-4 w-4" /> Devoir
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">Pour : {hw.deadline}</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-800 ml-2">{hw.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 mb-4 ml-2">{hw.description}</p>
                      <div className="ml-2 pt-3 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">{hw.submissionsCount} étudiant(s) ont remis le devoir</span>
                        <button
                          onClick={() => { void handleToggleHomeworkSubmissions(hw.id); }}
                          className="text-teal-600 text-xs font-bold hover:underline"
                        >
                          {expandedHomeworkId === hw.id ? "Masquer les soumissions" : "Voir les soumissions"}
                        </button>
                      </div>
                      {expandedHomeworkId === hw.id && (
                        <div className="ml-2 mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                          {loadingHomeworkSubmissionsId === hw.id ? (
                            <p className="text-xs text-slate-500 font-semibold">Chargement des soumissions...</p>
                          ) : (homeworkSubmissionsById[hw.id] ?? []).length === 0 ? (
                            <p className="text-xs text-slate-500 font-semibold">Aucune soumission pour ce devoir.</p>
                          ) : (
                            (homeworkSubmissionsById[hw.id] ?? []).map((submission) => (
                              <div
                                key={submission.id}
                                className="rounded-xl bg-white border border-slate-100 px-3 py-2"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-xs font-bold text-slate-700">{submission.studentName}</span>
                                  <span className="text-[11px] font-semibold text-slate-500">
                                    {formatDateTime(submission.submittedAt)}
                                  </span>
                                </div>
                                {submission.filePath ? (
                                  <div className="mt-2 flex items-center justify-between gap-3">
                                    <span className="text-[11px] font-semibold text-slate-600 truncate">
                                      {submission.fileName || "Fichier joint"}
                                    </span>
                                    <a
                                      href={buildBackendUrl(submission.filePath)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] font-bold text-teal-600 hover:underline whitespace-nowrap"
                                    >
                                      Voir/Télécharger
                                    </a>
                                  </div>
                                ) : (
                                  <p className="mt-2 text-[11px] font-semibold text-slate-400">
                                    Aucun fichier joint.
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {selectedRoom.posts.map(post => (
                    <div key={post.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-black">
                          {post.isMe ? (user.name ? user.name[0] : "E") : post.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">
                            {post.isMe ? (user.name || "Enseignant") : post.author}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold">{post.date}</div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                      
                      {post.type === "document" && post.fileName && (
                        <div className="mt-4 flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-red-500 shadow-sm">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800">{post.fileName}</div>
                              <div className="text-[10px] text-slate-400 font-semibold">
                                {post.fileSize || formatFileSize(post.fileSizeBytes)}
                              </div>
                            </div>
                          </div>
                          {post.filePath ? (
                            <a
                              href={buildBackendUrl(post.filePath)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-teal-600 hover:underline whitespace-nowrap"
                            >
                              Voir/Télécharger
                            </a>
                          ) : null}
                        </div>
                      )}

                      {post.comments.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                          {post.comments.map(c => (
                            <div key={c.id} className="flex gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                                {c.authorName?.[0]?.toUpperCase() ?? "?"}
                              </div>
                              <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2">
                                <span className="text-xs font-bold text-slate-700 mr-2">{c.authorName}</span>
                                <span className="text-xs text-slate-600">{c.content}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {selectedRoom.posts.length === 0 && selectedRoom.homeworks.length === 0 && (
                    <div className="text-center p-10 text-slate-400 font-semibold text-sm">
                      Cette salle est vide pour le moment.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: CALENDAR */}
            {activeTab === "calendar" && (
              <div className="space-y-6">
                <CalendarGrid 
                  title="Calendrier & Remise des Notes"
                  events={calendarEvents}
                />

                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden p-6">
                  <h4 className="text-xs font-extrabold text-slate-800 mb-4">Toutes les dates essentielles</h4>
                  <div className="space-y-3">
                    {academicEventsSummary.map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => { void loadAcademicEventDetail(evt.id); }}
                        className="w-full text-left flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            evt.type === "DS" || evt.type === "EXAMEN"
                              ? "bg-red-500"
                              : evt.type === "AFFICHAGE"
                                ? "bg-purple-500"
                                : "bg-slate-500"
                          }`}></div>
                          <span className="text-xs font-bold text-slate-700">{evt.nom}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {formatDate(evt.dateDebut ?? evt.dateFin ?? "")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedAcademicEventId && (
                  <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-5">
                    {loadingAcademicEventId === selectedAcademicEventId ? (
                      <p className="text-xs text-slate-500 font-semibold">Chargement du détail...</p>
                    ) : academicEventDetailsById[selectedAcademicEventId] ? (
                      <div className="space-y-1">
                        <h4 className="text-sm font-extrabold text-slate-800">
                          {academicEventDetailsById[selectedAcademicEventId].nom}
                        </h4>
                        <p className="text-xs text-slate-600">
                          Début: {academicEventDetailsById[selectedAcademicEventId].dateDebut || "—"}
                        </p>
                        <p className="text-xs text-slate-600">
                          Fin: {academicEventDetailsById[selectedAcademicEventId].dateFin || "—"}
                        </p>
                        <p className="text-xs text-slate-600">
                          Type: {academicEventDetailsById[selectedAcademicEventId].type}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 font-semibold">Aucun détail disponible.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB: GRADES */}
            {activeTab === "grades" && (
              <div className="space-y-6">

                {/* ── Formulaire de soumission ── */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="mb-5">
                    <h2 className="text-xl font-extrabold text-slate-800">Soumettre des notes</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      Cette soumission sera ensuite validée puis publiée par l&apos;administration.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitGradeSubmission} className="space-y-4">
                    {/* Ligne 1 : Classe / Semestre / Matière / Type */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase mb-2">Classe</label>
                        <select
                          value={gradeTargetYear}
                          onChange={(e) => setGradeTargetYear(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                        >
                          {classTargets.map((target) => (
                            <option key={target} value={target}>{target}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase mb-2">Semestre</label>
                        <select
                          value={gradeSemester}
                          onChange={(e) => setGradeSemester(e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                        >
                          <option value="S1">Semestre 1</option>
                          <option value="S2">Semestre 2</option>
                          <option value="Annuel">Annuel</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase mb-2">Matière</label>
                        <input
                          type="text"
                          required
                          value={gradeSubject}
                          onChange={(e) => setGradeSubject(e.target.value)}
                          placeholder="Ex: Compilation"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase mb-2">Type d&apos;épreuve</label>
                        <select
                          value={gradeExamType}
                          onChange={(e) => setGradeExamType(e.target.value as ExamType)}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                        >
                          <option value="DS">DS</option>
                          <option value="EXAM">Examen</option>
                        </select>
                      </div>
                    </div>

                    {/* Ligne 2 : Titre */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-2">Titre</label>
                      <input
                        type="text"
                        required
                        value={gradeTitle}
                        onChange={(e) => setGradeTitle(e.target.value)}
                        placeholder="Ex: GL3 - Compilation - Session principale"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    {/* Ligne 3 : Résumé */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-2">Résumé (optionnel)</label>
                      <textarea
                        value={gradeSummary}
                        onChange={(e) => setGradeSummary(e.target.value)}
                        placeholder="Précisions éventuelles pour l'administration..."
                        className="w-full px-4 py-2.5 min-h-[64px] bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 resize-none"
                      />
                    </div>

                    {/* Tableau étudiants */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Liste des étudiants</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <input ref={gradeCsvInputRef} type="file" accept=".csv,text/csv" onChange={handleGradeFileImport} className="hidden" />
                          <button type="button" onClick={() => gradeCsvInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200">
                            <FileText className="h-3.5 w-3.5" /> Importer CSV
                          </button>
                          <button type="button" onClick={downloadGradesCsvTemplate}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200">
                            <Download className="h-3.5 w-3.5" /> Modèle CSV
                          </button>
                          {importedGradesFileName && (
                            <span className="text-[11px] font-semibold text-slate-400">· {importedGradesFileName}</span>
                          )}
                        </div>
                      </div>

                      {/* En-têtes colonnes */}
                      <div className="hidden md:grid grid-cols-[1fr_1.2fr_1.2fr_.8fr_auto] gap-2 px-4 pt-3 pb-1">
                        {["Matricule","Nom","Prénom","Note /20",""].map(h => (
                          <span key={h} className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{h}</span>
                        ))}
                      </div>

                      <div className="p-4 pt-2 space-y-2">
                        {gradeRows.map((row, index) => (
                          <div key={`grade-row-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr_1.2fr_.8fr_auto] gap-2">
                            <input type="text" placeholder="Matricule" value={row.studentId}
                              onChange={(e) => updateGradeRow(index, "studentId", e.target.value)}
                              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-400" />
                            <input type="text" placeholder="Nom" value={row.lastName}
                              onChange={(e) => updateGradeRow(index, "lastName", e.target.value)}
                              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-400" />
                            <input type="text" placeholder="Prénom" value={row.firstName}
                              onChange={(e) => updateGradeRow(index, "firstName", e.target.value)}
                              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-400" />
                            <input type="number" min="0" max="20" step="0.01" placeholder="Note" value={row.grade}
                              onChange={(e) => updateGradeRow(index, "grade", e.target.value)}
                              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-400" />
                            <button type="button" onClick={() => removeGradeRow(index)}
                              className="px-3 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 border border-red-100">
                              ✕
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={addGradeRow}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 mt-1">
                          <Plus className="h-4 w-4" /> Ajouter une ligne
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" disabled={isSubmittingGrades}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 disabled:bg-teal-300 hover:bg-teal-700 shadow-lg shadow-teal-500/20 transition-all">
                        {isSubmittingGrades ? "Envoi..." : "Envoyer à l'administration"}
                        <SendHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                </div>

                {/* ── Historique des soumissions ── */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-800">Historique des soumissions</h3>
                      <p className="text-sm font-medium text-slate-400 mt-0.5">{teacherSubmissions.length} soumission(s) au total</p>
                    </div>
                    <button type="button" onClick={() => void loadTeacherSubmissions()}
                      className="text-xs font-bold text-teal-600 hover:underline px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors">
                      Actualiser
                    </button>
                  </div>

                  {isLoadingSubmissions && (
                    <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                      Chargement des soumissions...
                    </div>
                  )}

                  {!isLoadingSubmissions && teacherSubmissions.length === 0 && (
                    <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
                      Aucune soumission envoyée pour le moment.
                    </div>
                  )}

                  {!isLoadingSubmissions && teacherSubmissions.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teacherSubmissions.map((submission) => {
                        const status = gradeStatusMeta[submission.status];
                        return (
                          <div key={submission.id} className="rounded-2xl border border-slate-100 p-4 space-y-3 hover:border-slate-200 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-extrabold text-slate-800 leading-snug">{submission.title}</h4>
                              <span className={`shrink-0 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${status.className}`}>
                                {status.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{submission.targetYear}</span>
                              <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{submission.semester || "Sem. N/A"}</span>
                              <span className="text-[11px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">{submission.subject || "Matière N/A"}</span>
                              <span className="text-[11px] font-bold bg-violet-50 text-violet-600 px-2 py-0.5 rounded-md">{submission.examType}</span>
                              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">{submission.entries.length} étudiant(s)</span>
                            </div>
                            {submission.summary && (
                              <p className="text-xs text-slate-500 leading-relaxed">{submission.summary}</p>
                            )}
                            <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-400 space-y-0.5">
                              <p>Envoyée le {formatDateTime(submission.createdAt)}</p>
                              {submission.validatedAt && <p>Validée par {submission.validatedBy || "Admin"} le {formatDateTime(submission.validatedAt)}</p>}
                              {submission.publishedAt && <p>Publiée le {formatDateTime(submission.publishedAt)}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}