"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CalendarGrid, { CalendarEvent } from "@/components/Calendar";
import { useChat, BackendMessage, ConversationSummary } from "@/hooks/useChat";
import { backendFetchJson, buildBackendUrl } from "@/lib/backend";
import { 
  Bell, 
  Menu, 
  ChevronRight, 
  MessageSquare, 
  Calendar, 
  User, 
  LogOut, 
  Send, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  BookOpen,
  SendHorizontal,
  Settings,
  Plus,
  FileText,
  FileSpreadsheet,
  Inbox,
  Search,
  Circle
} from "lucide-react";

interface Post {
  id: string;
  title: string;
  category: "urgent" | "document" | "notes" | "planning";
  content: string;
  date: string;
  author: string;
  targetYear?: string; // e.g. "GL3", "Tous"
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
}

interface BackendPublication {
  id: string;
  title: string;
  category: "urgent" | "document" | "notes" | "planning";
  content: string;
  author: string;
  targetYear?: string | null;
  fileName?: string | null;
  filePath?: string | null;
  fileSizeBytes?: number | null;
  createdAt: string;
}

interface BackendCalendarConfig {
  dsRemise: string;
  examRemise: string;
  dsAffichage: string;
  examAffichage: string;
  sem1Deliberation: string;
  sem2Deliberation: string;
  deliberationFinale: string;
  s1_ds?: string | null;
  s1_exam?: string | null;
  s1_grades_ds?: string | null;
  s1_publish_ds?: string | null;
  s1_grades_exam?: string | null;
  s1_publish_exam?: string | null;
  s1_delib?: string | null;
  s2_ds?: string | null;
  s2_exam?: string | null;
  s2_grades_ds?: string | null;
  s2_publish_ds?: string | null;
  s2_grades_exam?: string | null;
  s2_publish_exam?: string | null;
  s2_delib?: string | null;
  end_year?: string | null;
}

interface BackendCalendarResponse {
  config: BackendCalendarConfig;
  sync?: { synced: boolean; reason?: string };
}

type GradeSubmissionStatus = "pending" | "validated" | "published";

interface BackendGradeEntry {
  studentName: string;
  subject: string;
  ds: number;
  exam: number;
  avg: number;
}

interface BackendGradeSubmission {
  id: string;
  teacherName: string;
  teacherEmail?: string | null;
  targetYear: string;
  semester?: string | null;
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

interface PublishGradesResponse {
  publication: BackendPublication;
  submissionsUpdated: number;
  targetYear: string;
}

const gradeStatusMeta: Record<
  GradeSubmissionStatus,
  { label: string; className: string }
> = {
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

const formatPostDate = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFileSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return undefined;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
};

const toPost = (publication: BackendPublication): Post => ({
  id: publication.id,
  title: publication.title,
  category: publication.category,
  content: publication.content,
  date: formatPostDate(publication.createdAt),
  author: publication.author,
  targetYear: publication.targetYear ?? "Tous",
  fileName: publication.fileName ?? undefined,
  fileSize: formatFileSize(publication.fileSizeBytes),
  fileUrl: publication.filePath ? buildBackendUrl(publication.filePath) : undefined,
});

const buildCalendarEvents = (calConfig: Record<string, string>): CalendarEvent[] => {
  const eventsToCreate: CalendarEvent[] = [];

  const addEvent = (dateStr: string, type: CalendarEvent["type"], title: string) => {
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return;
    eventsToCreate.push({
      dayNumber: d.getDate(),
      type,
      title,
      date: dateStr,
    });
  };

  addEvent(calConfig.s1_ds, "exam", "Date début DS S1");
  addEvent(calConfig.s1_grades_ds, "grading", "Remise Notes DS S1");
  addEvent(calConfig.s1_publish_ds, "deadline", "Affichage DS S1");

  addEvent(calConfig.s1_exam, "exam", "Date début examens S1");
  addEvent(calConfig.s1_grades_exam, "grading", "Remise Notes Examens S1");
  addEvent(calConfig.s1_publish_exam, "deadline", "Affichage Examens S1");

  addEvent(calConfig.s1_delib, "deadline", "Délibérations S1");

  addEvent(calConfig.s2_ds, "exam", "Date début DS S2");
  addEvent(calConfig.s2_grades_ds, "grading", "Remise Notes DS S2");
  addEvent(calConfig.s2_publish_ds, "deadline", "Affichage DS S2");

  addEvent(calConfig.s2_exam, "exam", "Date début examens S2");
  addEvent(calConfig.s2_grades_exam, "grading", "Remise Notes Examens S2");
  addEvent(calConfig.s2_publish_exam, "deadline", "Affichage Examens S2");

  addEvent(calConfig.s2_delib, "deadline", "Délibérations S2");
  addEvent(calConfig.end_year, "deadline", "Délibérations de fin d'année");

  return eventsToCreate;
};

const toCalendarPayload = (calConfig: Record<string, string>) => ({
  s1_ds: calConfig.s1_ds,
  s1_exam: calConfig.s1_exam,
  s1_grades_ds: calConfig.s1_grades_ds,
  s1_publish_ds: calConfig.s1_publish_ds,
  s1_grades_exam: calConfig.s1_grades_exam,
  s1_publish_exam: calConfig.s1_publish_exam,
  s1_delib: calConfig.s1_delib,
  s2_ds: calConfig.s2_ds,
  s2_exam: calConfig.s2_exam,
  s2_grades_ds: calConfig.s2_grades_ds,
  s2_publish_ds: calConfig.s2_publish_ds,
  s2_grades_exam: calConfig.s2_grades_exam,
  s2_publish_exam: calConfig.s2_publish_exam,
  s2_delib: calConfig.s2_delib,
  end_year: calConfig.end_year,
  dsRemise: calConfig.s1_grades_ds,
  examRemise: calConfig.s1_grades_exam,
  dsAffichage: calConfig.s1_publish_ds,
  examAffichage: calConfig.s1_publish_exam,
  sem1Deliberation: calConfig.s1_delib,
  sem2Deliberation: calConfig.s2_delib,
  deliberationFinale: calConfig.end_year,
});

const fromBackendCalendar = (config: BackendCalendarConfig) => ({
  s1_ds: config.s1_ds ?? config.dsRemise,
  s1_exam: config.s1_exam ?? config.examRemise,
  s1_grades_ds: config.s1_grades_ds ?? config.dsRemise,
  s1_publish_ds: config.s1_publish_ds ?? config.dsAffichage,
  s1_grades_exam: config.s1_grades_exam ?? config.examRemise,
  s1_publish_exam: config.s1_publish_exam ?? config.examAffichage,
  s1_delib: config.s1_delib ?? config.sem1Deliberation,
  s2_ds: config.s2_ds ?? config.dsRemise,
  s2_exam: config.s2_exam ?? config.examRemise,
  s2_grades_ds: config.s2_grades_ds ?? config.dsRemise,
  s2_publish_ds: config.s2_publish_ds ?? config.dsAffichage,
  s2_grades_exam: config.s2_grades_exam ?? config.examRemise,
  s2_publish_exam: config.s2_publish_exam ?? config.examAffichage,
  s2_delib: config.s2_delib ?? config.sem2Deliberation,
  end_year: config.end_year ?? config.deliberationFinale,
});

// ─── Chat types ──────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  sender: "student" | "admin";
  text: string;
  time: string;
}
interface Conversation {
  id: string;
  studentName: string;
  studentClass: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: ChatMessage[];
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useUser();
  const [activeTab, setActiveTab] = useState<
    "feed" | "calendar" | "grades" | "chat"
  >("feed");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Redirect to login if user directly lands on dashboard without being authenticated
  useEffect(() => {
    if (!user.isLoggedIn) {
      router.push("/login");
    }
  }, [user.isLoggedIn, router]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // CHAT STATE - connected to real backend
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatSearch, setChatSearch] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  const { 
    messages: activeConvMessages, 
    conversations, 
    sendMessage: sendChatMessage,
    isConnected: isChatConnected,
    isLoading: isChatLoading,
    fetchConversationsList,
    fetchConversation,
  } = useChat({ userId: user.id, otherUserId: selectedStudentId });

  // Load conversations list when admin lands on the chat tab
  useEffect(() => {
    if (activeTab === 'chat' && user.id) {
      fetchConversationsList();
    }
  }, [activeTab, user.id, fetchConversationsList]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConvMessages]);

  const filteredConvs = conversations.filter(c =>
    c.user.name.toLowerCase().includes(chatSearch.toLowerCase())
  );

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedStudentId) return;
    sendChatMessage(selectedStudentId, chatInput.trim());
    setChatInput("");
  };

  const handleSelectConv = (studentId: number) => {
    setSelectedStudentId(studentId);
    if (user.id) fetchConversation(user.id, studentId);
  };

  // FEED STATE
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState<"urgent" | "document" | "planning">("planning");
  const [newPostTarget, setNewPostTarget] = useState("Tous");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    setIsPublishing(true);

    try {
      const formData = new FormData();
      formData.append("title", newPostTitle.trim());
      formData.append("category", newPostCategory);
      formData.append("content", newPostContent.trim());
      formData.append("author", user.name || "Scolarité INSAT");
      if (newPostTarget && newPostTarget !== "Tous") {
        formData.append("targetYear", newPostTarget.trim().toUpperCase());
      }
      if (attachedFile) {
        formData.append("file", attachedFile);
      }

      const response = await fetch(buildBackendUrl("/admin-agent/publications"), {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Échec de création de publication.");
      }

      const createdPublication = (await response.json()) as BackendPublication;
      if (createdPublication.category !== "notes") {
        setFeedPosts((prev) => [toPost(createdPublication), ...prev]);
      }
      setNewPostTitle("");
      setNewPostContent("");
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("Publication envoyée !");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      showToast(`Erreur publication: ${message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // GRADES STATE
  const [gradeSubmissions, setGradeSubmissions] = useState<BackendGradeSubmission[]>(
    [],
  );
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [gradeStatusFilter, setGradeStatusFilter] = useState<
    "all" | GradeSubmissionStatus
  >("all");
  const [gradeTargetFilter, setGradeTargetFilter] = useState("ALL");
  const [publishDrafts, setPublishDrafts] = useState<
    Record<string, { title: string; content: string }>
  >({});
  const [validatingSubmissionId, setValidatingSubmissionId] = useState<string | null>(
    null,
  );
  const [publishingSubmissionId, setPublishingSubmissionId] = useState<string | null>(
    null,
  );

  const openGradesTab = () => {
    setActiveTab("grades");
    setGradeStatusFilter("all");
    setGradeTargetFilter("ALL");
  };

  const loadGradeSubmissions = async () => {
    setIsLoadingGrades(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "100");
      if (gradeStatusFilter !== "all") {
        params.set("status", gradeStatusFilter);
      }
      if (gradeTargetFilter !== "ALL") {
        params.set("targetYear", gradeTargetFilter);
      }
      const data = await backendFetchJson<BackendGradeSubmission[]>(
        `/admin-agent/grades/submissions?${params.toString()}`,
      );
      setGradeSubmissions(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      showToast(`Impossible de charger les soumissions de notes: ${message}`);
    } finally {
      setIsLoadingGrades(false);
    }
  };

  const handleValidateSubmission = async (submissionId: string) => {
    setValidatingSubmissionId(submissionId);
    try {
      await backendFetchJson<BackendGradeSubmission>(
        `/admin-agent/grades/submissions/${submissionId}/validate`,
        {
          method: "PATCH",
          body: JSON.stringify({
            validatedBy: user.name || "Agent admin",
          }),
        },
      );
      showToast("Soumission validée.");
      await loadGradeSubmissions();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      showToast(`Validation impossible: ${message}`);
    } finally {
      setValidatingSubmissionId(null);
    }
  };

  const handlePublishGrades = async ({
    targetYear,
    submissionIds,
    title,
    content,
  }: {
    targetYear: string;
    submissionIds?: string[];
    title?: string;
    content?: string;
  }) => {
    const normalizedTarget = targetYear.trim().toUpperCase();
    if (!normalizedTarget) {
      showToast("Choisissez une promotion cible.");
      return;
    }

    if (submissionIds?.length) {
      setPublishingSubmissionId(submissionIds[0]);
    }

    try {
      const result = await backendFetchJson<PublishGradesResponse>(
        "/admin-agent/grades/publish",
        {
          method: "POST",
          body: JSON.stringify({
            targetYear: normalizedTarget,
            submissionIds: submissionIds?.length ? submissionIds : undefined,
            publishedBy: user.name || "Service de scolarité",
            title: title?.trim() || undefined,
            content: content?.trim() || undefined,
            notifyStudents: true,
          }),
        },
      );

      if (result.publication.category !== "notes") {
        setFeedPosts((prev) => [toPost(result.publication), ...prev]);
      }
      showToast(
        `Notes publiées pour ${result.targetYear} (${result.submissionsUpdated} soumission(s)).`,
      );
      await loadGradeSubmissions();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      showToast(`Publication des notes impossible: ${message}`);
    } finally {
      setPublishingSubmissionId(null);
    }
  };

  const updatePublishDraft = (
    submissionId: string,
    field: "title" | "content",
    value: string,
  ) => {
    setPublishDrafts((prev) => ({
      ...prev,
      [submissionId]: {
        title: prev[submissionId]?.title ?? "",
        content: prev[submissionId]?.content ?? "",
        [field]: value,
      },
    }));
  };

  const getPublishDraft = (submissionId: string) =>
    publishDrafts[submissionId] ?? { title: "", content: "" };

  // CALENDAR STATE
  const [isCalendarConfigured, setIsCalendarConfigured] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isSavingCalendar, setIsSavingCalendar] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editDate, setEditDate] = useState("");

  const [calConfig, setCalConfig] = useState({
    s1_ds: "", s1_exam: "", 
    s1_grades_ds: "", s1_publish_ds: "",
    s1_grades_exam: "", s1_publish_exam: "", 
    s1_delib: "",
    s2_ds: "", s2_exam: "", 
    s2_grades_ds: "", s2_publish_ds: "",
    s2_grades_exam: "", s2_publish_exam: "", 
    s2_delib: "", end_year: ""
  });

  const handleCalConfigChange = (field: string, value: string) => {
    setCalConfig(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const loadFeed = async () => {
      setIsLoadingFeed(true);
      try {
        const publications = await backendFetchJson<BackendPublication[]>(
          "/admin-agent/publications?limit=100",
        );
        setFeedPosts(publications.filter((publication) => publication.category !== "notes").map(toPost));
      } catch (error) {
        console.error(error);
        showToast("Impossible de charger les publications backend.");
      } finally {
        setIsLoadingFeed(false);
      }
    };

    loadFeed();
  }, []);

  useEffect(() => {
    const loadCalendar = async () => {
      try {
        const config = await backendFetchJson<BackendCalendarConfig | null>(
          "/admin-agent/calendar",
        );
        if (!config) return;

        const normalizedConfig = fromBackendCalendar(config);
        setCalConfig(normalizedConfig);
        setCalendarEvents(buildCalendarEvents(normalizedConfig));
        setIsCalendarConfigured(true);
      } catch (error) {
        console.error(error);
      }
    };

    loadCalendar();
  }, []);

  useEffect(() => {
    if (activeTab !== "grades") return;
    void loadGradeSubmissions();
  }, [activeTab, gradeStatusFilter, gradeTargetFilter]);

  useEffect(() => {
    if (!user.isLoggedIn) return;

    const es = new EventSource(
      buildBackendUrl("/admin-agent/notifications/stream?role=admin"),
    );

    es.addEventListener("grades.published", () => {
      showToast("Notification: des notes viennent d'être publiées.");
    });

    es.addEventListener("publication.created", () => {
      // No-op for admin because the feed is already immediately updated on create.
    });

    es.onerror = () => {
      // Keep silent to avoid noisy toasts on transient reconnects.
    };

    return () => es.close();
  }, [user.isLoggedIn]);

  const submitCalendarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCalendar(true);

    try {
      const payload = toCalendarPayload(calConfig);
      const result = await backendFetchJson<BackendCalendarResponse>(
        "/admin-agent/calendar?syncCalendar=true",
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );

      setCalendarEvents(buildCalendarEvents(calConfig));
      setIsCalendarConfigured(true);

      if (result.sync?.synced === false) {
        showToast("Calendrier enregistré, mais sync externe échouée.");
      } else {
        showToast("Calendrier académique configuré avec succès !");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      showToast(`Erreur calendrier: ${message}`);
    } finally {
      setIsSavingCalendar(false);
    }
  };

  const eventTitleToField: Record<string, string> = {
    "Date début DS S1": "s1_ds",
    "Semaine DS S1": "s1_ds",
    "Remise Notes DS S1": "s1_grades_ds",
    "Affichage DS S1": "s1_publish_ds",
    "Date début examens S1": "s1_exam",
    "Semaine Examens S1": "s1_exam",
    "Remise Notes Examens S1": "s1_grades_exam",
    "Affichage Examens S1": "s1_publish_exam",
    "Délibérations S1": "s1_delib",
    "Date début DS S2": "s2_ds",
    "Semaine DS S2": "s2_ds",
    "Remise Notes DS S2": "s2_grades_ds",
    "Affichage DS S2": "s2_publish_ds",
    "Date début examens S2": "s2_exam",
    "Semaine Examens S2": "s2_exam",
    "Remise Notes Examens S2": "s2_grades_exam",
    "Affichage Examens S2": "s2_publish_exam",
    "Délibérations S2": "s2_delib",
    "Délibérations de fin d'année": "end_year",
  };

  const handleEditEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editDate) return;
    
    const d = new Date(editDate);
    const newDay = d.getDate();
    
    setCalendarEvents(calendarEvents.map(evt =>
      evt.title === editingEvent.title && evt.type === editingEvent.type
        ? { ...evt, dayNumber: newDay, date: editDate }
        : evt
    ));

    const field = eventTitleToField[editingEvent.title];
    if (field) {
      const updatedConfig = { ...calConfig, [field]: editDate };
      setCalConfig(updatedConfig);

      try {
        await backendFetchJson<BackendCalendarResponse>(
          "/admin-agent/calendar?syncCalendar=true",
          {
            method: "PUT",
            body: JSON.stringify(toCalendarPayload(updatedConfig)),
          },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur inconnue";
        showToast(`Modification locale ok, sync backend échouée: ${message}`);
      }
    }

    setEditingEvent(null);
    showToast(`Événement "${editingEvent.title}" modifié !`);
  };

  const gradeTargets = Array.from(
    new Set(gradeSubmissions.map((submission) => submission.targetYear.toUpperCase())),
  ).sort();

  const pendingSubmissions = gradeSubmissions.filter(
    (submission) => submission.status === "pending",
  );
  const validatedSubmissions = gradeSubmissions.filter(
    (submission) => submission.status === "validated",
  );
  const publishedSubmissions = gradeSubmissions.filter(
    (submission) => submission.status === "published",
  );

  const renderSubmissionCard = (submission: BackendGradeSubmission) => {
    const status = gradeStatusMeta[submission.status];
    const publishDraft = getPublishDraft(submission.id);

    return (
      <div key={submission.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${status.className}`}>
                {status.label}
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border bg-slate-50 text-slate-500 border-slate-200">
                {submission.targetYear}
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border bg-slate-50 text-slate-500 border-slate-200">
                {submission.semester || "Semestre N/A"}
              </span>
            </div>
            <h4 className="text-base font-black text-slate-800">{submission.title}</h4>
            <p className="text-xs text-slate-500 font-semibold">
              Soumise par {submission.teacherName} · {submission.entries.length} ligne(s) · {formatPostDate(submission.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {submission.status === "pending" && (
              <button
                type="button"
                onClick={() => void handleValidateSubmission(submission.id)}
                disabled={validatingSubmissionId === submission.id}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white transition-colors"
              >
                {validatingSubmissionId === submission.id ? "Validation..." : "Valider"}
              </button>
            )}

            {submission.status === "published" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Déjà publiée
              </span>
            )}
          </div>
        </div>

        {submission.summary && (
          <p className="text-sm text-slate-600">{submission.summary}</p>
        )}

        {submission.status === "validated" && (
          <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-4 space-y-3">
            <p className="text-[11px] font-extrabold uppercase text-pink-700">
              Publication de cette soumission uniquement
            </p>
            <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.8fr_auto] gap-2">
              <input
                type="text"
                value={publishDraft.title}
                onChange={(e) => updatePublishDraft(submission.id, "title", e.target.value)}
                placeholder={`Titre (optionnel) ex: Notes ${submission.targetYear}`}
                className="bg-white border border-pink-100 rounded-xl p-2.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-pink-300"
              />
              <input
                type="text"
                value={publishDraft.content}
                onChange={(e) => updatePublishDraft(submission.id, "content", e.target.value)}
                placeholder="Message étudiant (optionnel)"
                className="bg-white border border-pink-100 rounded-xl p-2.5 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-pink-300"
              />
              <button
                type="button"
                onClick={() =>
                  void handlePublishGrades({
                    targetYear: submission.targetYear,
                    submissionIds: [submission.id],
                    title: publishDraft.title,
                    content: publishDraft.content,
                  })
                }
                disabled={publishingSubmissionId === submission.id}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white transition-colors"
              >
                {publishingSubmissionId === submission.id ? "Publication..." : "Publier"}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-100 p-3 bg-slate-50/50">
            <p className="text-[11px] font-extrabold uppercase text-slate-500 mb-2">Traçabilité</p>
            <p className="text-xs text-slate-600">Créée: {formatPostDate(submission.createdAt)}</p>
            <p className="text-xs text-slate-600">
              Validée: {submission.validatedAt ? `${submission.validatedBy || "Admin"} · ${formatPostDate(submission.validatedAt)}` : "Non"}
            </p>
            <p className="text-xs text-slate-600">
              Publiée: {submission.publishedAt ? `${submission.publishedBy || "Admin"} · ${formatPostDate(submission.publishedAt)}` : "Non"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 p-3 bg-slate-50/50">
            <p className="text-[11px] font-extrabold uppercase text-slate-500 mb-2">Aperçu des lignes</p>
            <div className="space-y-1.5">
              {submission.entries.slice(0, 4).map((entry, index) => (
                <p key={`${submission.id}-${entry.studentName}-${entry.subject}-${index}`} className="text-xs text-slate-600">
                  {entry.studentName} · {entry.subject} · DS {entry.ds} · EX {entry.exam} · AVG {entry.avg}
                </p>
              ))}
              {submission.entries.length > 4 && (
                <p className="text-xs font-semibold text-slate-500">
                  +{submission.entries.length - 4} ligne(s) supplémentaire(s)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9FBFC] text-slate-800">
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-2.5 rounded-2xl bg-slate-900 px-5 py-4 text-xs font-bold text-white shadow-xl animate-slideUp">
          <Sparkles className="h-4 w-4 text-pink-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Editing Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 animate-slideUp">
            <h3 className="text-lg font-black text-slate-800 mb-1">Modifier l'événement</h3>
            <p className="text-sm font-medium text-slate-500 mb-6">Nouvelle date pour <span className="font-bold text-pink-600">{editingEvent.title}</span></p>
            
            <form onSubmit={handleEditEventSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Sélectionnez une nouvelle date</label>
                <input 
                  type="date" 
                  required
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditingEvent(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">Annuler</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-pink-600 hover:bg-pink-700 shadow-lg shadow-pink-500/20 transition-all">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-100 shrink-0">
        <Link href="/" className="flex h-20 items-center gap-2 px-6 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-600 text-white font-black tracking-tighter shadow-md shadow-pink-500/10">
            iC
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-800">
            INSAT<span className="text-pink-600"> Connect</span>
          </span>
        </Link>

        {/* Admin Mini Card */}
        <div className="p-5 border-b border-slate-100 bg-[#F9FBFC]/50 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-pink-500/20">
              {user.name ? user.name.split(" ").map(n=>n[0]).join("").substring(0,2) : "AD"}
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-800 leading-tight">{user.name || "Scolarité"}</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Espace Administrateur</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab("feed")}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "feed" ? "bg-pink-50/70 text-pink-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <MessageSquare className={`h-4 w-4 ${activeTab === "feed" ? "text-pink-500" : "text-slate-400"}`} />
            Fil d'Actualité
          </button>
          
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "calendar" ? "bg-pink-50/70 text-pink-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Calendar className={`h-4 w-4 ${activeTab === "calendar" ? "text-pink-500" : "text-slate-400"}`} />
            Calendrier Académique
          </button>

          <button
            onClick={openGradesTab}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "grades" ? "bg-pink-50/70 text-pink-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <FileSpreadsheet className={`h-4 w-4 ${activeTab === "grades" ? "text-pink-500" : "text-slate-400"}`} />
            Validation des Notes
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "chat" ? "bg-pink-50/70 text-pink-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Inbox className={`h-4 w-4 ${activeTab === "chat" ? "text-pink-500" : "text-slate-400"}`} />
            <span className="flex-1 text-left">Messages Étudiants</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={() => { logout(); router.push("/"); }} className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight">
                {activeTab === "feed"
                  ? "Fil d'Actualité"
                  : activeTab === "calendar"
                    ? "Configuration du Calendrier"
                    : activeTab === "grades"
                      ? "Validation & Publication des Notes"
                      : "Messages Étudiants"}
              </h1>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                INSAT Tunis <ChevronRight className="h-3 w-3" /> Administration
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-pink-500 ring-2 ring-white"></span>
            </button>
            <div className="flex items-center gap-4 pl-3 border-l border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-xs">
                {user.name ? user.name[0] : "A"}
              </div>
              <span className="hidden sm:inline text-xs font-extrabold text-slate-700">
                {user.name?.split(" ")[0] || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {/* TAB: FEED */}
          {activeTab === "feed" && (
            <div className="max-w-3xl mx-auto w-full space-y-6">
              
              {/* Compose Post */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
                <form onSubmit={handleCreatePost}>
                  <div className="flex gap-4 mb-4 border-b border-slate-100 pb-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Titre de l'annonce</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Avis concernant les inscriptions..."
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-300"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mb-4">
                    <div className="w-1/2">
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Catégorie</label>
                      <select 
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value as "urgent" | "document" | "planning")}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-pink-300"
                      >
                        <option value="planning">Planning & Emploi</option>
                        <option value="urgent">Urgent / Alerte</option>
                        <option value="document">Document Administratif</option>
                      </select>
                    </div>
                    <div className="w-1/2">
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Ciblage (Classes)</label>
                      <select 
                        value={newPostTarget}
                        onChange={(e) => setNewPostTarget(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-pink-300"
                      >
                        <option value="Tous">Tous les étudiants</option>
                        <option value="GL3">GL3</option>
                        <option value="MPI">MPI (1ère année)</option>
                        <option value="IIA">IIA</option>
                        <option value="IMI">IMI</option>
                        <option value="RT">RT</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <textarea 
                      required
                      placeholder="Contenu de l'annonce..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-300 min-h-[120px] resize-none"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={(e) => { if (e.target.files && e.target.files.length > 0) setAttachedFile(e.target.files[0]); }}
                        className="hidden" 
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-colors border ${attachedFile ? "bg-pink-50 text-pink-600 border-pink-200" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                      >
                        <FileText className="h-4 w-4" /> {attachedFile ? attachedFile.name : "Joindre un fichier"}
                      </button>
                    </div>
                    <button 
                      type="submit"
                      disabled={!newPostTitle.trim() || !newPostContent.trim() || isPublishing}
                      className="bg-pink-600 disabled:bg-pink-300 hover:bg-pink-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-pink-500/20 transition-all flex items-center gap-2"
                    >
                      {isPublishing ? "Publication..." : "Publier l'annonce"} <SendHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Feed Listing */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-pink-500" /> Annonces Publiées
                </h3>
                
                {isLoadingFeed && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-500">
                    Chargement des publications...
                  </div>
                )}

                {!isLoadingFeed && feedPosts.length === 0 && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-500">
                    Aucune publication disponible.
                  </div>
                )}

                {!isLoadingFeed && feedPosts.map(post => {
                  let style = 'border-slate-100';
                  let badge = 'bg-slate-100 text-slate-600';
                  
                  if (post.category === 'urgent') { style = 'border-red-200 shadow-red-500/5'; badge = 'bg-red-100 text-red-600 border-red-200'; }
                  if (post.category === 'planning') { badge = 'bg-blue-100 text-blue-600 border-blue-200'; }
                  if (post.category === 'notes') { badge = 'bg-emerald-100 text-emerald-600 border-emerald-200'; }

                  return (
                    <div key={post.id} className={`bg-white rounded-3xl border p-5 shadow-sm ${style}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${badge}`}>
                              {post.category}
                            </span>
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border bg-slate-50 text-slate-500 border-slate-200">
                              Cible: {post.targetYear}
                            </span>
                          </div>
                          <h4 className="text-base font-black text-slate-800 leading-tight">{post.title}</h4>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      
                      {post.fileName && (
                        <div className="mb-4 flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-red-500 shadow-sm">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{post.fileName}</div>
                            <div className="text-[10px] text-slate-400 font-semibold">{post.fileSize}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 pt-3 border-t border-slate-50">
                        <span>Publié par {post.author}</span>
                        <span>{post.date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: CALENDAR */}
          {activeTab === "calendar" && (
            <div className="max-w-4xl mx-auto w-full">
              {!isCalendarConfigured ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                    <h2 className="text-lg font-black text-slate-800">Configuration du Calendrier Académique</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">Saisissez les dates clés de l'année. Une fois validé, le calendrier global sera généré et visible par tous.</p>
                  </div>
                  
                  <form onSubmit={submitCalendarConfig} className="p-6 space-y-8">
                    
                    {/* Semestre 1 */}
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">1</span> 
                        Semestre 1
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Date début DS</label>
                          <input type="date" required value={calConfig.s1_ds} onChange={e => handleCalConfigChange('s1_ds', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Date début examens</label>
                          <input type="date" required value={calConfig.s1_exam} onChange={e => handleCalConfigChange('s1_exam', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Date limite remise notes DS</label>
                          <input type="date" required value={calConfig.s1_grades_ds} onChange={e => handleCalConfigChange('s1_grades_ds', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Affichage des résultats DS</label>
                          <input type="date" required value={calConfig.s1_publish_ds} onChange={e => handleCalConfigChange('s1_publish_ds', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Date limite remise notes Examens</label>
                          <input type="date" required value={calConfig.s1_grades_exam} onChange={e => handleCalConfigChange('s1_grades_exam', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Affichage des résultats Examens</label>
                          <input type="date" required value={calConfig.s1_publish_exam} onChange={e => handleCalConfigChange('s1_publish_exam', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Délibérations S1</label>
                          <input type="date" required value={calConfig.s1_delib} onChange={e => handleCalConfigChange('s1_delib', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                      </div>
                    </div>

                    {/* Semestre 2 */}
                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">2</span> 
                        Semestre 2
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Date début DS</label>
                          <input type="date" required value={calConfig.s2_ds} onChange={e => handleCalConfigChange('s2_ds', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Date début examens</label>
                          <input type="date" required value={calConfig.s2_exam} onChange={e => handleCalConfigChange('s2_exam', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Date limite remise notes DS</label>
                          <input type="date" required value={calConfig.s2_grades_ds} onChange={e => handleCalConfigChange('s2_grades_ds', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Affichage des résultats DS</label>
                          <input type="date" required value={calConfig.s2_publish_ds} onChange={e => handleCalConfigChange('s2_publish_ds', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Date limite remise notes Examens</label>
                          <input type="date" required value={calConfig.s2_grades_exam} onChange={e => handleCalConfigChange('s2_grades_exam', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Affichage des résultats Examens</label>
                          <input type="date" required value={calConfig.s2_publish_exam} onChange={e => handleCalConfigChange('s2_publish_exam', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Délibérations S2</label>
                          <input type="date" required value={calConfig.s2_delib} onChange={e => handleCalConfigChange('s2_delib', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Délibérations de fin d'année</label>
                          <input type="date" required value={calConfig.end_year} onChange={e => handleCalConfigChange('end_year', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button 
                        type="submit"
                        disabled={isSavingCalendar}
                        className="bg-pink-600 disabled:bg-pink-300 hover:bg-pink-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2"
                      >
                        {isSavingCalendar ? "Enregistrement..." : "Générer le calendrier"} <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black text-slate-800">Calendrier Généré</h2>
                      <p className="text-sm text-slate-500">Vous pouvez modifier les dates en cliquant sur un événement depuis le panneau latéral.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setCalConfig({
                          s1_ds: "", s1_exam: "",
                          s1_grades_ds: "", s1_publish_ds: "",
                          s1_grades_exam: "", s1_publish_exam: "",
                          s1_delib: "",
                          s2_ds: "", s2_exam: "",
                          s2_grades_ds: "", s2_publish_ds: "",
                          s2_grades_exam: "", s2_publish_exam: "",
                          s2_delib: "", end_year: ""
                        });
                        setCalendarEvents([]);
                        setIsCalendarConfigured(false);
                      }}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Réinitialiser le calendrier
                    </button>
                  </div>
                  
                  <CalendarGrid 
                    title="Calendrier Académique Global"
                    subtitle="INSAT Tunis"
                    events={calendarEvents}
                    onEventEdit={(evt) => {
                      setEditingEvent(evt);
                      setEditDate(evt.date || "");
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB: GRADES */}
          {activeTab === "grades" && (
            <div className="max-w-5xl mx-auto w-full space-y-6">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-black text-slate-800">
                    Pipeline Enseignant → Admin → Étudiants
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    1) validation des soumissions reçues, 2) publication ciblée par promotion.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Filtre statut</label>
                    <select
                      value={gradeStatusFilter}
                      onChange={(e) =>
                        setGradeStatusFilter(e.target.value as "all" | GradeSubmissionStatus)
                      }
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-pink-300"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="pending">En attente</option>
                      <option value="validated">Validées</option>
                      <option value="published">Publiées</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Filtre promotion</label>
                    <select
                      value={gradeTargetFilter}
                      onChange={(e) => setGradeTargetFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-pink-300"
                    >
                      <option value="ALL">Toutes les promotions</option>
                      {gradeTargets.map((target) => (
                        <option key={`filter-${target}`} value={target}>
                          {target}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => void loadGradeSubmissions()}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold transition-colors"
                    >
                      Actualiser la liste
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3">
                    <p className="text-[11px] font-extrabold uppercase text-amber-700">En attente</p>
                    <p className="text-2xl font-black text-amber-800">{pendingSubmissions.length}</p>
                    <p className="text-[11px] font-semibold text-amber-700/80">À valider par l'admin</p>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
                    <p className="text-[11px] font-extrabold uppercase text-blue-700">Validées</p>
                    <p className="text-2xl font-black text-blue-800">{validatedSubmissions.length}</p>
                    <p className="text-[11px] font-semibold text-blue-700/80">Prêtes à publier</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
                    <p className="text-[11px] font-extrabold uppercase text-emerald-700">Publiées</p>
                    <p className="text-2xl font-black text-emerald-800">{publishedSubmissions.length}</p>
                    <p className="text-[11px] font-semibold text-emerald-700/80">Déjà visibles côté étudiant</p>
                  </div>
                </div>
              </div>

              {isLoadingGrades && (
                <div className="bg-white border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-500">
                  Chargement des soumissions...
                </div>
              )}

              {!isLoadingGrades && gradeSubmissions.length === 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-500 space-y-2">
                  <p>Aucune soumission trouvée avec les filtres actuels.</p>
                  <p>
                    Statut: <span className="font-bold">{gradeStatusFilter}</span> · Promotion:{" "}
                    <span className="font-bold">{gradeTargetFilter}</span>
                  </p>
                  <button
                    type="button"
                    onClick={openGradesTab}
                    className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}

              {!isLoadingGrades && pendingSubmissions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-amber-700 uppercase tracking-wider">
                    Étape 1 · Soumissions en attente de validation
                  </h3>
                  {pendingSubmissions.map(renderSubmissionCard)}
                </div>
              )}

              {!isLoadingGrades && validatedSubmissions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-blue-700 uppercase tracking-wider">
                    Étape 2 · Soumissions validées à publier
                  </h3>
                  {validatedSubmissions.map(renderSubmissionCard)}
                </div>
              )}

              {!isLoadingGrades && publishedSubmissions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-emerald-700 uppercase tracking-wider">
                    Étape 3 · Soumissions déjà publiées
                  </h3>
                  {publishedSubmissions.map(renderSubmissionCard)}
                </div>
              )}
            </div>
          )}

          {/* TAB: CHAT */}
          {activeTab === "chat" && (
            <div className="h-full flex gap-0 rounded-3xl overflow-hidden border border-slate-100 shadow-sm bg-white" style={{maxHeight: "calc(100vh - 11rem)"}}>
              
              {/* Conversations list */}
              <div className="w-72 shrink-0 flex flex-col border-r border-slate-100 bg-slate-50/50">
                <div className="p-4 border-b border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={chatSearch}
                      onChange={e => setChatSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-pink-300 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredConvs.length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-400">
                      <p className="font-bold">Aucune conversation</p>
                      <p>Les messages des étudiants apparaîtront ici.</p>
                    </div>
                  )}
                  {filteredConvs.map(conv => (
                    <button
                      key={conv.user.id}
                      onClick={() => handleSelectConv(conv.user.id)}
                      className={`w-full flex items-start gap-3 p-4 border-b border-slate-100 text-left transition-colors ${
                        selectedStudentId === conv.user.id ? "bg-pink-50" : "hover:bg-white"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-pink-200">
                        {conv.user.name.split(" ").map((n: string) => n[0]).join("").substring(0,2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-extrabold ${selectedStudentId === conv.user.id ? "text-pink-700" : "text-slate-800"}`}>
                            {conv.user.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold shrink-0 ml-1">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mb-0.5">{conv.user.role}</div>
                        <p className="text-[11px] text-slate-500 truncate font-medium">{conv.lastMessage.content}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat panel */}
              {selectedStudentId ? (
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-white shrink-0">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-pink-200">
                      {conversations.find(c => c.user.id === selectedStudentId)?.user.name.split(" ").map((n: string) => n[0]).join("").substring(0,2) ?? "??"}
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-slate-800">
                        {conversations.find(c => c.user.id === selectedStudentId)?.user.name ?? "Étudiant"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
                        <span className="text-[10px] font-bold text-slate-400">Étudiant INSAT</span>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {isChatLoading && (
                      <div className="text-center text-xs text-slate-400 py-4">Chargement...</div>
                    )}
                    {!isChatLoading && activeConvMessages.length === 0 && (
                      <div className="text-center text-xs text-slate-400 py-8">
                        <p className="font-bold">Aucun message dans cette conversation.</p>
                      </div>
                    )}
                    {activeConvMessages.map(msg => {
                      const isFromAdmin = msg.senderId === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isFromAdmin ? "justify-end" : "justify-start"}`}>
                          {!isFromAdmin && (
                            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-pink-400 to-rose-500 text-white flex items-center justify-center font-bold text-[10px] shadow-sm mr-2 shrink-0 self-end">
                              {conversations.find(c => c.user.id === selectedStudentId)?.user.name.split(" ").map((n: string) => n[0]).join("").substring(0,2) ?? "??"}
                            </div>
                          )}
                          <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                            isFromAdmin
                              ? "bg-pink-600 text-white rounded-br-sm shadow-lg shadow-pink-500/20"
                              : "bg-slate-100 text-slate-800 rounded-bl-sm"
                          }`}>
                            <p>{msg.content}</p>
                            <p className={`text-[10px] mt-1 font-semibold ${isFromAdmin ? "text-pink-200" : "text-slate-400"}`}>
                              {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-100 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder={`Répondre à ${conversations.find(c => c.user.id === selectedStudentId)?.user.name ?? "l'étudiant"}...`}
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="p-3 rounded-2xl bg-pink-600 hover:bg-pink-700 disabled:bg-pink-200 text-white shadow-lg shadow-pink-500/20 transition-all"
                      >
                        <SendHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Inbox className="h-10 w-10 text-slate-200" />
                  <p className="text-sm font-bold">Aucune conversation backend disponible</p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
