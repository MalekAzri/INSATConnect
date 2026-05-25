"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CalendarGrid, { CalendarEvent } from "@/components/Calendar";
import { backendFetchJson } from "@/lib/backend";
import { 
  Bell, 
  Menu, 
  Download, 
  FileText, 
  MessageSquare, 
  Calendar, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  FileSpreadsheet,
  Sparkles,
  BookOpen,
  Plus,
  Users,
  Image as ImageIcon,
  SendHorizontal,
  ChevronLeft,
  X
} from "lucide-react";

// Types for Mock Data
interface RoomPost {
  id: string;
  author: string;
  avatar: string;
  date: string;
  content: string;
  type: "announcement" | "document";
  fileName?: string;
  fileSize?: string;
  isMe?: boolean;
}

interface Homework {
  id: string;
  title: string;
  description: string;
  deadline: string;
  submissionsCount: number;
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

interface TeacherCalendarRow {
  event: string;
  date: string;
  badge: string;
}

interface TeacherGradeRow {
  studentName: string;
  subject: string;
  ds: string;
  exam: string;
  avg: string;
}

const classTargets = ["MPI", "GL2", "GL3", "GL4", "IIA", "IMI", "RT"] as const;

const emptyGradeRow = (): TeacherGradeRow => ({
  studentName: "",
  subject: "",
  ds: "",
  exam: "",
  avg: "",
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
    studentName: new Set(["studentname", "student", "etudiant", "nometudiant", "nom"]),
    subject: new Set(["subject", "matiere", "module", "cours"]),
    ds: new Set(["ds", "noteds", "devoir", "devoirsurveille"]),
    exam: new Set(["exam", "examen", "noteexam"]),
    avg: new Set(["avg", "average", "moyenne", "moy"]),
  };

  const normalizedHeader = firstRow.map((cell) => normalizeHeader(cell));
  const headerIndexes = {
    studentName: normalizedHeader.findIndex((key) => headerAliases.studentName.has(key)),
    subject: normalizedHeader.findIndex((key) => headerAliases.subject.has(key)),
    ds: normalizedHeader.findIndex((key) => headerAliases.ds.has(key)),
    exam: normalizedHeader.findIndex((key) => headerAliases.exam.has(key)),
    avg: normalizedHeader.findIndex((key) => headerAliases.avg.has(key)),
  };

  const hasRecognizedHeader =
    headerIndexes.studentName >= 0 &&
    headerIndexes.subject >= 0 &&
    headerIndexes.ds >= 0 &&
    headerIndexes.exam >= 0;

  const startIndex = hasRecognizedHeader ? 1 : 0;

  const rows = matrix
    .slice(startIndex)
    .map((cells) => {
      const getCell = (index: number, fallbackIndex: number) =>
        index >= 0 ? (cells[index] ?? "") : (cells[fallbackIndex] ?? "");

      const studentName = getCell(headerIndexes.studentName, 0).trim();
      const subject = getCell(headerIndexes.subject, 1).trim();
      const dsText = getCell(headerIndexes.ds, 2).replace(",", ".").trim();
      const examText = getCell(headerIndexes.exam, 3).replace(",", ".").trim();
      const avgTextRaw = getCell(headerIndexes.avg, 4).replace(",", ".").trim();

      if (!studentName && !subject && !dsText && !examText && !avgTextRaw) {
        return null;
      }

      let avgText = avgTextRaw;
      const dsNum = Number(dsText);
      const examNum = Number(examText);
      if (!avgText && Number.isFinite(dsNum) && Number.isFinite(examNum)) {
        avgText = ((dsNum + examNum) / 2).toFixed(2);
      }

      return {
        studentName,
        subject,
        ds: dsText,
        exam: examText,
        avg: avgText,
      };
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
  dateStr: string,
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

  // Active Room State
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [gradeTargetYear, setGradeTargetYear] = useState("GL3");
  const [gradeSemester, setGradeSemester] = useState("S1");
  const [gradeTitle, setGradeTitle] = useState("");
  const [gradeSummary, setGradeSummary] = useState("");
  const [gradeRows, setGradeRows] = useState<TeacherGradeRow[]>([emptyGradeRow()]);
  const [importedGradesFileName, setImportedGradesFileName] = useState<string | null>(null);
  const [teacherSubmissions, setTeacherSubmissions] = useState<BackendGradeSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [isSubmittingGrades, setIsSubmittingGrades] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarRows, setCalendarRows] = useState<TeacherCalendarRow[]>([
    { event: "Calendrier académique en attente", date: "Aucune date configurée", badge: "Info" },
  ]);
  const gradeCsvInputRef = useRef<HTMLInputElement>(null);

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

  // MOCK DATA: Teacher's Rooms
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: "r1",
      name: "Compilation & Automates",
      subject: "Informatique Théorique",
      bgGradient: "from-blue-500 to-indigo-600",
      targetYear: "GL3",
      posts: [
        {
          id: "p1",
          author: "Dr. Mohamed Slim",
          avatar: "MS",
          date: "Aujourd'hui, 09:00",
          content: "Bonjour à tous. Le support de cours du Chapitre 3 est en ligne.",
          type: "document",
          fileName: "Chapitre3_AnalyseSyntaxique.pdf",
          fileSize: "2.1 Mo",
          isMe: true
        }
      ],
      homeworks: [
        {
          id: "hw1",
          title: "Analyseur Lexical en Lex/Flex",
          description: "Écrire un analyseur syntaxique pour un sous-ensemble simple de langage C.",
          deadline: "25 Mai 2026",
          submissionsCount: 14
        }
      ]
    },
    {
      id: "r2",
      name: "Conception Orientée Objet",
      subject: "Génie Logiciel",
      bgGradient: "from-teal-500 to-emerald-600",
      targetYear: "GL3",
      posts: [],
      homeworks: []
    }
  ]);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  useEffect(() => {
    if (selectedRoom?.targetYear) {
      setGradeTargetYear(selectedRoom.targetYear.toUpperCase());
    }
  }, [selectedRoom?.targetYear]);

  useEffect(() => {
    const loadCalendar = async () => {
      try {
        const config = await backendFetchJson<BackendCalendarConfig | null>(
          "/admin-agent/calendar",
        );
        if (!config) return;

        const c = {
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
        };

        const nextEvents = [
          toCalendarEvent(c.s1_ds, "exam", "Date début DS S1"),
          toCalendarEvent(c.s1_grades_ds, "grading", "Date limite remise notes DS S1"),
          toCalendarEvent(c.s1_publish_ds, "deadline", "Affichage notes DS S1"),
          toCalendarEvent(c.s1_exam, "exam", "Date début examens S1"),
          toCalendarEvent(c.s1_grades_exam, "grading", "Date limite remise notes examens S1"),
          toCalendarEvent(c.s1_publish_exam, "deadline", "Affichage notes examens S1"),
          toCalendarEvent(c.s1_delib, "deadline", "Délibération semestre 1"),
          toCalendarEvent(c.s2_ds, "exam", "Date début DS S2"),
          toCalendarEvent(c.s2_grades_ds, "grading", "Date limite remise notes DS S2"),
          toCalendarEvent(c.s2_publish_ds, "deadline", "Affichage notes DS S2"),
          toCalendarEvent(c.s2_exam, "exam", "Date début examens S2"),
          toCalendarEvent(c.s2_grades_exam, "grading", "Date limite remise notes examens S2"),
          toCalendarEvent(c.s2_publish_exam, "deadline", "Affichage notes examens S2"),
          toCalendarEvent(c.s2_delib, "deadline", "Délibération semestre 2"),
          toCalendarEvent(c.end_year, "deadline", "Délibération fin d'année"),
        ].filter((event): event is CalendarEvent => event !== null);

        const nextRows: TeacherCalendarRow[] = [
          { event: "Date début DS S1", date: formatDate(c.s1_ds), badge: "Examens" },
          { event: "Date limite remise notes DS S1", date: formatDate(c.s1_grades_ds), badge: "Évaluation" },
          { event: "Affichage notes DS S1", date: formatDate(c.s1_publish_ds), badge: "Affichage" },
          { event: "Date début examens S1", date: formatDate(c.s1_exam), badge: "Examens" },
          { event: "Date limite remise notes examens S1", date: formatDate(c.s1_grades_exam), badge: "Évaluation" },
          { event: "Affichage notes examens S1", date: formatDate(c.s1_publish_exam), badge: "Affichage" },
          { event: "Délibération semestre 1", date: formatDate(c.s1_delib), badge: "Calendrier" },
          { event: "Date début DS S2", date: formatDate(c.s2_ds), badge: "Examens" },
          { event: "Date limite remise notes DS S2", date: formatDate(c.s2_grades_ds), badge: "Évaluation" },
          { event: "Affichage notes DS S2", date: formatDate(c.s2_publish_ds), badge: "Affichage" },
          { event: "Date début examens S2", date: formatDate(c.s2_exam), badge: "Examens" },
          { event: "Date limite remise notes examens S2", date: formatDate(c.s2_grades_exam), badge: "Évaluation" },
          { event: "Affichage notes examens S2", date: formatDate(c.s2_publish_exam), badge: "Affichage" },
          { event: "Délibération semestre 2", date: formatDate(c.s2_delib), badge: "Calendrier" },
          { event: "Délibération fin d'année", date: formatDate(c.end_year), badge: "Calendrier" },
        ];

        setCalendarEvents(nextEvents);
        setCalendarRows(nextRows);
      } catch (error) {
        console.error(error);
        showToast("Impossible de charger le calendrier académique.");
      }
    };

    void loadCalendar();
  }, []);

  // Room Creation Form State
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomSubject, setNewRoomSubject] = useState("");
  const [newRoomYear, setNewRoomYear] = useState("GL3");
  const [newRoomGradient, setNewRoomGradient] = useState("from-purple-500 to-fuchsia-600");

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !newRoomSubject.trim()) return;

    const newRoom: Room = {
      id: `r_${Date.now()}`,
      name: newRoomName,
      subject: newRoomSubject,
      targetYear: newRoomYear,
      bgGradient: newRoomGradient,
      posts: [],
      homeworks: []
    };

    setRooms([newRoom, ...rooms]);
    setIsCreatingRoom(false);
    setNewRoomName("");
    setNewRoomSubject("");
    showToast(`Salle "${newRoomName}" créée avec succès !`);
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

  const handleCreatePost = () => {
    if (!postContent.trim() || !selectedRoomId) return;

    const newPost: RoomPost = {
      id: `p_${Date.now()}`,
      author: user.name || "Enseignant",
      avatar: user.name ? user.name[0] : "E",
      date: "À l'instant",
      content: postContent,
      type: attachedFile ? "document" : "announcement",
      fileName: attachedFile ? attachedFile.name : undefined,
      fileSize: attachedFile ? (attachedFile.size / (1024 * 1024)).toFixed(2) + " Mo" : undefined,
      isMe: true
    };

    setRooms(rooms.map(r => r.id === selectedRoomId ? { ...r, posts: [newPost, ...r.posts] } : r));
    setPostContent("");
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    showToast("Publication ajoutée !");
  };

  const handleCreateHomework = () => {
    if (!hwTitle.trim() || !hwDesc.trim() || !hwDeadline.trim() || !selectedRoomId) return;

    const newHw: Homework = {
      id: `hw_${Date.now()}`,
      title: hwTitle,
      description: hwDesc,
      deadline: hwDeadline,
      submissionsCount: 0
    };

    setRooms(rooms.map(r => r.id === selectedRoomId ? { ...r, homeworks: [newHw, ...r.homeworks] } : r));
    setHwTitle("");
    setHwDesc("");
    setHwDeadline("");
    setComposeType("post");
    showToast("Devoir assigné !");
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
      "studentName,subject,ds,exam,avg\n" +
      "Nom Etudiant 1,Compilation,14.5,15,14.75\n" +
      "Nom Etudiant 2,Compilation,10,12,11\n";

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

    const nonEmptyRows = gradeRows.filter(
      (row) =>
        row.studentName.trim() ||
        row.subject.trim() ||
        row.ds.trim() ||
        row.exam.trim() ||
        row.avg.trim(),
    );

    if (!nonEmptyRows.length) {
      showToast("Ajoutez au moins une ligne de notes.");
      return;
    }

    try {
      const entries = nonEmptyRows.map((row, index) => {
        const studentName = row.studentName.trim();
        const subject = row.subject.trim();
        const ds = Number(row.ds);
        const exam = Number(row.exam);
        const avg = Number(row.avg);

        if (!studentName || !subject) {
          throw new Error(`Ligne ${index + 1}: nom étudiant et matière obligatoires.`);
        }

        if (
          !Number.isFinite(ds) ||
          !Number.isFinite(exam) ||
          !Number.isFinite(avg) ||
          ds < 0 ||
          exam < 0 ||
          avg < 0 ||
          ds > 20 ||
          exam > 20 ||
          avg > 20
        ) {
          throw new Error(`Ligne ${index + 1}: les notes doivent être entre 0 et 20.`);
        }

        return { studentName, subject, ds, exam, avg };
      });

      setIsSubmittingGrades(true);
      await backendFetchJson<BackendGradeSubmission>("/admin-agent/grades/submissions", {
        method: "POST",
        body: JSON.stringify({
          teacherName: user.name || "Enseignant",
          teacherEmail: user.email || undefined,
          targetYear: gradeTargetYear,
          semester: gradeSemester,
          title: gradeTitle.trim(),
          summary: gradeSummary.trim() || undefined,
          entries,
        }),
      });

      setGradeTitle("");
      setGradeSummary("");
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
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-2.5 rounded-2xl bg-slate-900 px-5 py-4 text-xs font-bold text-white shadow-xl animate-slideUp">
          <Sparkles className="h-4 w-4 text-teal-400" />
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
          <div className="flex items-center gap-4 pl-3 border-l border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
              {user.name ? user.name[0] : "E"}
            </div>
            <span className="hidden sm:inline text-xs font-extrabold text-slate-700">
              {user.name?.split(" ")[0]}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F9FBFC] p-6">
          <div className="mx-auto max-w-5xl h-full flex flex-col">
            
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
                
                <form onSubmit={handleCreateRoom} className="space-y-5">
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
                          onClick={handleCreatePost}
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
                          onClick={handleCreateHomework}
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
                        <button className="text-teal-600 text-xs font-bold hover:underline">Voir les soumissions</button>
                      </div>
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
                              <div className="text-[10px] text-slate-400 font-semibold">{post.fileSize}</div>
                            </div>
                          </div>
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
                    {calendarRows.map((evt, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${evt.badge === "Examens" ? "bg-red-500" : evt.badge === "Évaluation" ? "bg-amber-500" : evt.badge === "Affichage" ? "bg-purple-500" : "bg-slate-500"}`}></div>
                          <span className="text-xs font-bold text-slate-700">{evt.event}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold">{evt.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GRADES */}
            {activeTab === "grades" && (
              <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800">Soumettre des notes</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      Cette soumission sera ensuite validée puis publiée par l&apos;administration.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitGradeSubmission} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase mb-2">Classe</label>
                        <select
                          value={gradeTargetYear}
                          onChange={(e) => setGradeTargetYear(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                        >
                          {classTargets.map((target) => (
                            <option key={target} value={target}>
                              {target}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-700 uppercase mb-2">Semestre</label>
                        <select
                          value={gradeSemester}
                          onChange={(e) => setGradeSemester(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                        >
                          <option value="S1">Semestre 1</option>
                          <option value="S2">Semestre 2</option>
                          <option value="Annuel">Annuel</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-2">Titre</label>
                      <input
                        type="text"
                        required
                        value={gradeTitle}
                        onChange={(e) => setGradeTitle(e.target.value)}
                        placeholder="Ex: GL3 - Compilation - Session principale"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase mb-2">Résumé (optionnel)</label>
                      <textarea
                        value={gradeSummary}
                        onChange={(e) => setGradeSummary(e.target.value)}
                        placeholder="Précisions éventuelles pour l'administration..."
                        className="w-full px-4 py-3 min-h-[82px] bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 resize-none"
                      />
                    </div>

                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-600 uppercase tracking-wider">
                        Détail des notes (DS / Examen / Moyenne)
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
                          <input
                            ref={gradeCsvInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleGradeFileImport}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => gradeCsvInputRef.current?.click()}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200"
                          >
                            <FileText className="h-4 w-4" /> Importer un fichier CSV
                          </button>
                          <button
                            type="button"
                            onClick={downloadGradesCsvTemplate}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200"
                          >
                            <Download className="h-4 w-4" /> Télécharger modèle CSV
                          </button>
                          {importedGradesFileName && (
                            <span className="text-[11px] font-semibold text-slate-500">
                              Fichier importé: {importedGradesFileName}
                            </span>
                          )}
                        </div>

                        {gradeRows.map((row, index) => (
                          <div key={`grade-row-${index}`} className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_.8fr_.8fr_.8fr_auto] gap-2">
                            <input
                              type="text"
                              placeholder="Étudiant"
                              value={row.studentName}
                              onChange={(e) => updateGradeRow(index, "studentName", e.target.value)}
                              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-400"
                            />
                            <input
                              type="text"
                              placeholder="Matière"
                              value={row.subject}
                              onChange={(e) => updateGradeRow(index, "subject", e.target.value)}
                              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-400"
                            />
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.01"
                              placeholder="DS"
                              value={row.ds}
                              onChange={(e) => updateGradeRow(index, "ds", e.target.value)}
                              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-400"
                            />
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.01"
                              placeholder="Exam"
                              value={row.exam}
                              onChange={(e) => updateGradeRow(index, "exam", e.target.value)}
                              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-400"
                            />
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.01"
                              placeholder="Moy."
                              value={row.avg}
                              onChange={(e) => updateGradeRow(index, "avg", e.target.value)}
                              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-400"
                            />
                            <button
                              type="button"
                              onClick={() => removeGradeRow(index)}
                              className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-100"
                            >
                              Suppr.
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={addGradeRow}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100"
                        >
                          <Plus className="h-4 w-4" /> Ajouter une ligne
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingGrades}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 disabled:bg-teal-300 hover:bg-teal-700 shadow-lg shadow-teal-500/20 transition-all"
                      >
                        {isSubmittingGrades ? "Envoi..." : "Envoyer à l'administration"}
                        <SendHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-slate-800">Mes soumissions</h3>
                    <button
                      type="button"
                      onClick={() => void loadTeacherSubmissions()}
                      className="text-xs font-bold text-teal-600 hover:underline"
                    >
                      Actualiser
                    </button>
                  </div>

                  {isLoadingSubmissions && (
                    <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      Chargement des soumissions...
                    </div>
                  )}

                  {!isLoadingSubmissions && teacherSubmissions.length === 0 && (
                    <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      Aucune soumission envoyée pour le moment.
                    </div>
                  )}

                  {!isLoadingSubmissions && teacherSubmissions.map((submission) => {
                    const status = gradeStatusMeta[submission.status];
                    return (
                      <div key={submission.id} className="rounded-2xl border border-slate-100 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-800">{submission.title}</h4>
                            <p className="text-[11px] font-semibold text-slate-400">
                              {submission.targetYear} · {submission.semester || "Semestre N/A"} · {submission.entries.length} lignes
                            </p>
                          </div>
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${status.className}`}>
                            {status.label}
                          </span>
                        </div>

                        {submission.summary && (
                          <p className="text-xs text-slate-600">{submission.summary}</p>
                        )}

                        <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-500 space-y-1">
                          <p>Envoyée le {formatDateTime(submission.createdAt)}</p>
                          {submission.validatedAt && (
                            <p>Validée par {submission.validatedBy || "Admin"} le {formatDateTime(submission.validatedAt)}</p>
                          )}
                          {submission.publishedAt && (
                            <p>Publiée le {formatDateTime(submission.publishedAt)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
