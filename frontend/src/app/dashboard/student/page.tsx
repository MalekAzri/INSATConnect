"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUser, UserRole } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CalendarGrid, { CalendarEvent } from "@/components/Calendar";
import { useChat } from "@/hooks/useChat";
import { backendFetchJson, backendGraphQLFetchJson, buildBackendUrl } from "@/lib/backend";
import { GET_PUBLICATIONS, GET_ACADEMIC_CALENDAR } from "@/graphql/queries";
import { 
  Bell, 
  Menu, 
  ChevronRight, 
  Download, 
  FileText, 
  MessageSquare, 
  Calendar, 
  GraduationCap, 
  User, 
  LogOut, 
  Send, 
  Upload, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  MessageCircle,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  BookOpen,
  SendHorizontal
} from "lucide-react";

// Types
interface Post {
  id: string;
  title: string;
  category: "urgent" | "document" | "notes" | "planning";
  content: string;
  date: string;
  author: string;
  targetYear?: string; // e.g. "GL3"
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  grades?: { subject: string; ds: string; exam: string; avg: string }[];
}

interface BackendPublication {
  id: string;
  title: string;
  category: string;
  content: string;
  author: string;
  targetYear?: string | null;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  filePath?: string | null;
  createdAt: string;
  grades?: { subject: string; ds: string; exam: string; avg: string }[] | null;
}

interface GraphqlPublication {
  id: string;
  titre: string;
  categorie: string;
  contenu: string;
  date: string;
  auteur: string;
  targetYear?: string | null;
  fichierUrl?: string | null;
  fileName?: string | null;
  fileSize?: string | null;
}

interface GraphqlAcademicEvent {
  id: string;
  nom: string;
  dateDebut?: string | null;
  dateFin?: string | null;
  type: 'DS' | 'EXAMEN' | 'AFFICHAGE' | 'DELIBERATION' | 'FIN_ANNEE';
}

const formatPostDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date inconnue";
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const toStudentPost = (p: BackendPublication): Post => ({
  id: p.id,
  title: p.title,
  category: p.category as Post["category"],
  content: p.content,
  date: formatPostDate(p.createdAt),
  author: p.author,
  targetYear: p.targetYear ?? undefined,
  fileName: p.fileName ?? undefined,
  fileSize: p.fileSizeBytes ? `${(p.fileSizeBytes / (1024 * 1024)).toFixed(2)} Mo` : undefined,
  fileUrl: p.filePath ? buildBackendUrl(p.filePath) : undefined,
  grades: p.grades ?? undefined,
});

const toStudentPostFromGraphql = (p: GraphqlPublication): Post => ({
  id: p.id,
  title: p.titre,
  category: p.categorie as Post["category"],
  content: p.contenu,
  date: formatPostDate(p.date),
  author: p.auteur,
  targetYear: p.targetYear ?? undefined,
  fileName: p.fileName ?? undefined,
  fileSize: p.fileSize ?? undefined,
  fileUrl: p.fichierUrl ?? undefined,
});

interface RoomPost {
  id: string;
  author: string;
  avatar: string;
  date: string;
  content: string;
  comments: { id: string; author: string; content: string; date: string }[];
}

interface Room {
  id: string;
  name: string;
  prof: string;
  profTitle: string;
  bgGradient: string;
  targetYear: string;
  homework?: {
    id: string;
    title: string;
    description: string;
    deadline: string;
    submitted: boolean;
  };
  posts: RoomPost[];
}

interface ChatMessage {
  id: string;
  sender: "student" | "admin";
  content: string;
  time: string;
}

const mapAcademicEventsToCalendarEvents = (events: GraphqlAcademicEvent[]): CalendarEvent[] => {
  const calendarEvents: CalendarEvent[] = [];

  for (const event of events) {
    const date = event.dateDebut || event.dateFin;
    if (!date) continue;

    const d = new Date(date);
    if (Number.isNaN(d.getTime())) continue;

    const type: CalendarEvent["type"] =
      event.type === 'DS' || event.type === 'EXAMEN'
        ? 'exam'
        : 'deadline';

    calendarEvents.push({
      dayNumber: d.getDate(),
      type,
      title: event.nom,
      date,
    });
  }

  return calendarEvents;
};

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout, updateYear, login } = useUser();
  const [activeTab, setActiveTab] = useState<"feed" | "chat" | "rooms" | "calendar">("feed");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [backendCalendarEvents, setBackendCalendarEvents] = useState<CalendarEvent[]>([]);
  const [allFeedPosts, setAllFeedPosts] = useState<Post[]>([]);
  const [realtimeNotifications, setRealtimeNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Custom states for interactivity
  const [commentsState, setCommentsState] = useState<{ [postId: string]: string }>({});
  const [newCommentVal, setNewCommentVal] = useState("");
  const [homeworkFile, setHomeworkFile] = useState<File | null>(null);
  const [homeworkStatus, setHomeworkStatus] = useState<{ [roomId: string]: boolean }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Chat States - connected to real backend
  const ADMIN_USER_ID = 1; // admin user ID as set by the DB seed
  const { messages: chatMessages, sendMessage: sendChatMessage, isConnected: isChatConnected, isLoading: isChatLoading } = useChat({
    userId: user.id,
    otherUserId: ADMIN_USER_ID,
  });
  const [typedMessage, setTypedMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Redirect to login if user directly lands on dashboard without being authenticated
  useEffect(() => {
    if (!user.isLoggedIn) {
      router.push("/login");
    }
  }, [user.isLoggedIn, router]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  useEffect(() => {
    backendGraphQLFetchJson<{ calendrierAcademique: GraphqlAcademicEvent[] }>(GET_ACADEMIC_CALENDAR)
      .then(data => {
        if (Array.isArray(data?.calendrierAcademique)) {
          setBackendCalendarEvents(mapAcademicEventsToCalendarEvents(data.calendrierAcademique));
        }
      })
      .catch(() => {});
  }, []);

  const loadFeed = useCallback(() => {
    backendGraphQLFetchJson<{ publications: GraphqlPublication[] }>(GET_PUBLICATIONS, {
      targetYear: user.year || "GL3",
    })
      .then(data => {
        setAllFeedPosts(Array.isArray(data?.publications) ? data.publications.map(toStudentPostFromGraphql) : []);
      })
      .catch(() => {});
  }, [user.year]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    // 1. Fetch initial history from DB
    backendFetchJson<any[]>(`/student-agent/notifications/history?role=student&year=${user.year || "GL3"}`)
      .then(history => {
        if (Array.isArray(history)) {
          setRealtimeNotifications(history);
        }
      })
      .catch(console.error);

    // 2. Subscribe to real-time events via SSE
    const sseUrl = buildBackendUrl(`/student-agent/notifications/stream?role=student&year=${user.year || "GL3"}`);
    const source = new EventSource(sseUrl);

    const handleSseEvent = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'heartbeat') return;

        if (data.type === 'publication.created') {
          loadFeed();
        }

        setRealtimeNotifications((prev) => {
          if (prev.some((p) => p.id === data.id)) return prev;
          return [data, ...prev];
        });

        if (data.message) {
          showToast(data.message);
        }
      } catch (err) {
        console.error('SSE parse error', err);
      }
    };

    source.addEventListener('message', handleSseEvent);
    source.addEventListener('publication.created', handleSseEvent);

    return () => {
      source.removeEventListener('message', handleSseEvent);
      source.removeEventListener('publication.created', handleSseEvent);
      source.close();
    };
  }, [user.year]);

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      showToast("Impossible de télécharger le fichier.");
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Profile Form State
  const [profileYear, setProfileYear] = useState(user.year || "GL3");
  useEffect(() => {
    if (user.year) {
      setProfileYear(user.year);
    }
  }, [user.year]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateYear(profileYear);
    showToast(`Année universitaire mise à jour avec succès en ${profileYear} !`);
    // Reset room selected just in case active rooms change
    setSelectedRoomId(null);
  };


  // Filter posts based on student's university year.
  // Note: general posts have no targetYear. Grades posts specify targetYear and are filtered.
  const filteredFeedPosts = allFeedPosts.filter(
    (post) => !post.targetYear || post.targetYear === user.year
  );

  // Dynamic storage of custom room comments and homework submission state
  const [roomsState, setRoomsState] = useState<Room[]>([]);

  // Active rooms based on student's year selection
  const activeRooms = roomsState.filter(room => room.targetYear === user.year);

  // Active room data helper
  const selectedRoom = activeRooms.find(r => r.id === selectedRoomId);

  // Leave comment under a prof post
  const handleAddComment = (roomId: string, postId: string) => {
    const commentText = commentsState[postId];
    if (!commentText || !commentText.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      author: user.name || "Étudiant INSAT",
      content: commentText,
      date: "À l'instant"
    };

    setRoomsState(prev => prev.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          posts: room.posts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                comments: [...post.comments, newComment]
              };
            }
            return post;
          })
        };
      }
      return room;
    }));

    // Reset comment input state
    setCommentsState(prev => ({
      ...prev,
      [postId]: ""
    }));

    showToast("Commentaire publié avec succès !");
  };

  const handleHomeworkSubmit = (roomId: string) => {
    setHomeworkStatus(prev => ({
      ...prev,
      [roomId]: true
    }));
    setRoomsState(prev => prev.map(room => {
      if (room.id === roomId && room.homework) {
        return {
          ...room,
          homework: {
            ...room.homework,
            submitted: true
          }
        };
      }
      return room;
    }));

    setHomeworkFile(null);
    showToast("Votre devoir a été transmis à l'enseignant avec succès !");
  };

  // Chat message send - connected to real backend
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    sendChatMessage(ADMIN_USER_ID, typedMessage.trim());
    setTypedMessage("");
  };

  // Check how many homeworks are active and unsubmitted to notify user
  const unsubmittedHomeworks = activeRooms.filter(r => r.homework && !r.homework.submitted && !homeworkStatus[r.id]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9FBFC] text-slate-800">
      
      {/* Dynamic Toast notifications */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-2.5 rounded-2xl bg-slate-900 px-5 py-4 text-xs font-bold text-white shadow-xl animate-slideUp">
          <Sparkles className="h-4 w-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. SIDEBAR Navigation */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-100 shrink-0">
        
        {/* Sidebar Header Brand */}
        <Link href="/" className="flex h-20 items-center gap-2 px-6 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black tracking-tighter shadow-md shadow-blue-500/10">
            iC
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-800">
            INSAT<span className="text-blue-600"> Connect</span>
          </span>
        </Link>

        {/* Student Mini Card */}
        <div className="p-5 border-b border-slate-100 bg-[#F9FBFC]/50 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
              {user.name ? user.name.split(" ").map(n=>n[0]).join("") : "ET"}
            </div>
            <div>
              <div className="text-xs font-extrabold text-slate-800 leading-tight">{user.name || "Étudiant INSAT"}</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                <span>En Ligne</span>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100/60">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Classe / Filière</label>
            <select
              value={user.year || "GL3"}
              onChange={(e) => {
                updateYear(e.target.value);
                showToast(`Filière mise à jour : ${e.target.value}`);
                setSelectedRoomId(null);
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
            >
              {["MPI", "GL2", "GL3", "GL4", "IIA", "IMI"].map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {/* Feed Tab */}
          <button
            onClick={() => { setActiveTab("feed"); setSelectedRoomId(null); }}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "feed"
                ? "bg-blue-50/70 text-blue-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <FileText className="h-4.5 w-4.5" />
            <span>Flux d'Actualités</span>
          </button>

          {/* Chat Tab */}
          <button
            onClick={() => { setActiveTab("chat"); setSelectedRoomId(null); }}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "chat"
                ? "bg-blue-50/70 text-blue-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="h-4.5 w-4.5" />
            <span>Messagerie Scolarité</span>
            <span className="ml-auto bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[9px] font-bold">
              En Ligne
            </span>
          </button>

          {/* Rooms Tab */}
          <button
            onClick={() => { setActiveTab("rooms"); }}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "rooms"
                ? "bg-blue-50/70 text-blue-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <BookOpen className="h-4.5 w-4.5" />
            <span>Rooms (Salles de cours)</span>
            <span className="ml-auto bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-bold">
              {activeRooms.length}
            </span>
          </button>

          {/* Calendar Tab */}
          <button
            onClick={() => { setActiveTab("calendar"); setSelectedRoomId(null); }}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "calendar"
                ? "bg-blue-50/70 text-blue-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Calendar className="h-4.5 w-4.5" />
            <span>Calendar (Calendrier)</span>
          </button>
        </nav>

        {/* Logout */}
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

      {/* 2. MAIN LAYOUT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-10">
          
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Trigger (not fully detailed but elegant UI element) */}
            <button className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-500">
              <Menu className="h-5 w-5" />
            </button>
            
            <h1 className="text-lg font-extrabold text-slate-800 capitalize flex items-center gap-2">
              <span>
                {activeTab === "feed" && "Flux d'Actualités INSAT"}
                {activeTab === "chat" && "Support & Messagerie Scolarité"}
                {activeTab === "rooms" && (selectedRoomId ? selectedRoom?.name : "Salles d'Étude")}
                {activeTab === "calendar" && "Calendrier Général des DS & Examens"}
              </span>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                {user.year}
              </span>
            </h1>
          </div>

          {/* Action Icons right */}
          <div className="flex items-center gap-4">
            
            {/* Custom Notification Badge */}
            <div
              className="relative cursor-pointer"
              onMouseEnter={() => setIsNotificationsOpen(true)}
              onMouseLeave={() => setIsNotificationsOpen(false)}
            >
              <div className="p-2.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-colors flex items-center justify-center text-slate-500 relative">
                <Bell className="h-5 w-5" />
                <span className="ml-1 text-xs">{realtimeNotifications.length}</span>
                {(unsubmittedHomeworks.length > 0 || realtimeNotifications.length > 0) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                )}
              </div>
              
              {/* Dropdown notification card */}
              <div className={`absolute right-0 mt-3 w-80 rounded-3xl bg-white border border-slate-100 shadow-2xl p-4 z-50 ${isNotificationsOpen ? 'block' : 'hidden'}`}>
                
                {/* Real-time Notifications */}
                <h4 className="text-xs font-extrabold text-slate-800 pb-2 border-b border-slate-50">Notifications récentes</h4>
                <div className="mt-2 mb-4 space-y-2 max-h-48 overflow-y-auto">
                  {realtimeNotifications.length > 0 ? (
                    realtimeNotifications.map((notif, idx) => (
                      <div key={idx} className="p-2 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-2">
                        <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-800">{notif.message}</p>
                          <p className="text-[9px] text-blue-600 font-semibold">{new Date(notif.timestamp || Date.now()).toLocaleString("fr-FR")}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-[10px] font-semibold text-center">
                      Aucune nouvelle notification
                    </div>
                  )}
                </div>

                <h4 className="text-xs font-extrabold text-slate-800 pb-2 border-b border-slate-50">Rappels de travaux</h4>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {unsubmittedHomeworks.length > 0 ? (
                    unsubmittedHomeworks.map(r => (
                      <div key={r.id} className="p-2 bg-orange-50/50 border border-orange-100 rounded-xl flex gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-800">{r.homework?.title}</p>
                          <p className="text-[9px] text-orange-600 font-semibold">{r.homework?.deadline}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-[10px] font-semibold">
                      Aucun devoir urgent en attente. Félicitations !
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Profile Pill */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                {user.name ? user.name[0] : "E"}
              </div>
              <span className="hidden sm:inline text-xs font-extrabold text-slate-700">
                {user.name?.split(" ")[0]}
              </span>
            </div>

          </div>
        </header>

        {/* Scrollable Container Content */}
        <main className="flex-1 overflow-y-auto bg-[#F9FBFC] p-6">
          <div className="mx-auto max-w-5xl h-full flex flex-col">
            
            {/* TAB 1: FEED (Actualités style Instagram) */}
            {activeTab === "feed" && (
              <div className="max-w-2xl mx-auto space-y-6 w-full pb-10">
                {/* Alert Badge for year-targeted feed updates */}
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-900">Affichage Ciblé Activé : {user.year}</h4>
                    <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                      Ce flux est synchronisé avec votre filière universitaire. Si vous changez de classe dans le sélecteur de la barre latérale, les relevés de notes et calendriers s'adapteront instantanément.
                    </p>
                  </div>
                </div>

                {/* Feed Posts Stream */}
                <div className="flex flex-col gap-6">
                      {filteredFeedPosts.map((post) => (
                        <article 
                          key={post.id} 
                          className={`rounded-3xl border p-6 bg-white transition-all shadow-sm ${
                            post.category === "urgent" 
                              ? "border-red-100 bg-red-50/20 shadow-red-50/50" 
                              : "border-slate-100"
                          }`}
                        >
                          {/* Post Header */}
                          <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              {post.category === "urgent" && (
                                <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-600 text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" /> Urgent
                                </span>
                              )}
                              {post.category === "document" && (
                                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-600 text-[9px] font-extrabold uppercase tracking-wider">
                                  Document Officiel
                                </span>
                              )}
                              {post.category === "notes" && (
                                <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-600 text-[9px] font-extrabold uppercase tracking-wider">
                                  Relevé de Notes Promotionnel
                                </span>
                              )}
                              {post.category === "planning" && (
                                <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-600 text-[9px] font-extrabold uppercase tracking-wider">
                                  Emploi du temps
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-semibold">{post.date}</span>
                            </div>
                            <div className="text-[10px] font-extrabold text-slate-500">Par : {post.author}</div>
                          </div>

                          {/* Post Body Title */}
                          <h3 className="text-base font-extrabold text-slate-900 mb-2">{post.title}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed mb-4">{post.content}</p>

                          {/* File Attachment — shown for any post with a file */}
                          {post.fileName && (
                            <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-white border border-slate-100 text-red-500">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="text-[11px] font-bold text-slate-800">{post.fileName}</div>
                                  <div className="text-[9px] text-slate-400 font-semibold">{post.fileSize ?? ""} • Fichier téléchargeable</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {post.fileUrl && (
                                  <button
                                    onClick={() => window.open(post.fileUrl, "_blank")}
                                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-sm hover:border-slate-300"
                                  >
                                    Consulter
                                  </button>
                                )}
                                {post.fileUrl && (
                                  <button
                                    onClick={() => handleDownload(post.fileUrl!, post.fileName!)}
                                    className="p-2 rounded-xl hover:bg-white hover:text-blue-600 text-slate-400 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Targeted Grade Lists */}
                          {post.category === "notes" && post.grades && (
                            <div className="mt-4 border border-teal-50 rounded-2xl overflow-hidden shadow-inner bg-teal-50/10">
                              <div className="bg-teal-500/10 px-4 py-2.5 border-b border-teal-100 flex items-center justify-between text-teal-800">
                                <span className="text-[10px] font-extrabold">Relevé de notes - Promotion {user.year}</span>
                                <span className="text-[9px] font-bold bg-teal-100 px-2 py-0.5 rounded-full">Provisoire</span>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-[11px] font-semibold text-slate-700 text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-extrabold bg-slate-50/50">
                                      <th className="p-3">Matière / Module</th>
                                      <th className="p-3 text-center">Note DS</th>
                                      <th className="p-3 text-center">Note Examen</th>
                                      <th className="p-3 text-center">Moyenne Finale</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {post.grades.map((grade, idx) => (
                                      <tr key={idx} className="border-b border-slate-100 hover:bg-teal-50/20">
                                        <td className="p-3 font-bold text-slate-800">{grade.subject}</td>
                                        <td className="p-3 text-center text-slate-500">{grade.ds}</td>
                                        <td className="p-3 text-center text-slate-500">{grade.exam}</td>
                                        <td className="p-3 text-center font-extrabold text-blue-600">{grade.avg}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                        </article>
                      ))}
                    </div>
              </div>
            )}

            {/* TAB 2: CHAT HUB (Messagerie Administration) */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden h-[600px] shrink-0 max-w-4xl mx-auto w-full">
                    
                    {/* Chat Header */}
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 font-bold flex items-center justify-center text-sm shadow-sm">
                            SC
                          </div>
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isChatConnected ? 'bg-teal-500' : 'bg-slate-300'}`}></span>
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-slate-800">Service Scolarité</div>
                          <div className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                            <span>Administration INSAT</span>
                          </div>
                        </div>
                      </div>
                      
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase ${
                        isChatConnected ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isChatConnected ? 'Connecté' : 'Hors ligne'}
                      </span>
                    </div>

                    {/* Messages stream */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/20">
                      {isChatLoading && (
                        <div className="text-center text-xs text-slate-400 py-4">Chargement des messages...</div>
                      )}
                      {!isChatLoading && chatMessages.length === 0 && (
                        <div className="text-center text-xs text-slate-400 py-8">
                          <p className="font-bold">Aucun message pour l&apos;instant.</p>
                          <p>Posez votre première question à la scolarité !</p>
                        </div>
                      )}
                      {chatMessages.map(msg => {
                        const isFromStudent = msg.senderId === user.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-3 max-w-[85%] ${
                              isFromStudent ? "ml-auto flex-row-reverse" : "mr-auto"
                            }`}
                          >
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isFromStudent
                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                                : "bg-pink-100 text-pink-600"
                            }`}>
                              {isFromStudent ? (user.name ? user.name[0] : "M") : "SC"}
                            </div>
                            
                            {/* Message Box */}
                            <div className="space-y-1">
                              <div className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                                isFromStudent
                                  ? "bg-blue-600 text-white rounded-tr-none"
                                  : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                              }`}>
                                {msg.content}
                              </div>
                              <p className={`text-[8px] text-slate-400 font-semibold ${isFromStudent ? "text-right" : ""}`}>
                                {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input messaging bar */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex gap-3 shrink-0">
                      <input
                        type="text"
                        placeholder="Posez vos questions à la scolarité (ex: relevé de notes, dossier, circulaires)..."
                        value={typedMessage}
                        onChange={e => setTypedMessage(e.target.value)}
                        className="flex-1 block rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors placeholder-slate-400"
                      />
                      <button
                        type="submit"
                        disabled={!typedMessage.trim()}
                        className="px-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10 flex items-center justify-center disabled:bg-blue-400 cursor-pointer"
                      >
                        <SendHorizontal className="h-4.5 w-4.5" />
                      </button>
                    </form>

                  </div>
            )}

            {/* TAB 2: ROOMS (Salles de cours style Classroom) */}
            {activeTab === "rooms" && (
              <div className="flex-1 flex flex-col">
                {!selectedRoomId ? (
                  /* Rooms list selection grid */
                  <div className="space-y-6">
                    <div className="text-xs font-bold text-slate-400">Sélectionnez une salle active liée à votre filière ({user.year}) :</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {activeRooms.map(room => (
                        <button
                          key={room.id}
                          onClick={() => setSelectedRoomId(room.id)}
                          className="w-full text-left rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:shadow-slate-100/70 p-6 transition-all group overflow-hidden relative cursor-pointer"
                        >
                          <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${room.bgGradient}`}></div>
                          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mt-2">{room.name}</h3>
                          <p className="text-[11px] text-slate-400 font-semibold mt-1">Enseignant : {room.prof}</p>
                          <p className="text-[10px] text-slate-500 mt-4 leading-relaxed font-semibold">
                            {room.posts[0] ? room.posts[0].content.substring(0, 100) + "..." : "Aucune annonce récente."}
                          </p>
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50 text-[10px] font-extrabold text-blue-600">
                            <span>Accéder à la Classroom</span>
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Inside a specific room - Classroom Details */
                  <div className="space-y-6">
                    
                    {/* Header return */}
                    <button 
                      onClick={() => setSelectedRoomId(null)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      ← Retour aux Rooms
                    </button>

                    {/* Room banner */}
                    <div className={`p-6 rounded-3xl bg-gradient-to-r ${selectedRoom?.bgGradient} text-white shadow-lg shadow-indigo-100/50`}>
                      <h2 className="text-xl font-extrabold">{selectedRoom?.name}</h2>
                      <p className="text-xs opacity-90 mt-1 font-semibold">{selectedRoom?.prof} • {selectedRoom?.profTitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Left/Middle: Post stream and comments */}
                      <div className="md:col-span-2 space-y-6">
                        <div className="text-xs font-bold text-slate-400">Flux d'actualités du cours</div>
                        
                        {selectedRoom?.posts.map(post => (
                          <div key={post.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-extrabold text-xs">
                                {post.avatar}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-800">{post.author}</div>
                                <div className="text-[9px] text-slate-400 font-semibold">{post.date}</div>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed font-semibold whitespace-pre-line">{post.content}</p>
                            
                            {/* Comments Section */}
                            <div className="pt-4 border-t border-slate-50 space-y-4">
                              <div className="text-[10px] font-extrabold text-slate-400 flex items-center gap-1.5">
                                <MessageCircle className="h-4 w-4" />
                                <span>Commentaires de classe ({post.comments.length})</span>
                              </div>
                              
                              {/* Comments Stream */}
                              <div className="space-y-3.5">
                                {post.comments.map(c => (
                                  <div key={c.id} className="flex gap-2.5 items-start p-3 bg-slate-50 rounded-2xl">
                                    <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                      {c.author.split(" ").map(n=>n[0]).join("")}
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-800">{c.author}</span>
                                        <span className="text-[8px] text-slate-400 font-semibold">{c.date}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-600 font-semibold">{c.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Add Comment Input */}
                              <div className="flex gap-2.5 mt-2">
                                <input
                                  type="text"
                                  placeholder="Laisser un commentaire ou poser une question..."
                                  value={commentsState[post.id] || ""}
                                  onChange={e => setCommentsState(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  onKeyDown={e => { if (e.key === "Enter") handleAddComment(selectedRoom.id, post.id); }}
                                  className="flex-1 block rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                                />
                                <button
                                  onClick={() => handleAddComment(selectedRoom.id, post.id)}
                                  className="p-2.5 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10 cursor-pointer"
                                >
                                  <Send className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Right Pane: Homework due panel */}
                      <div className="space-y-6">
                        <div className="text-xs font-bold text-slate-400">Travail à remettre</div>
                        
                        {selectedRoom?.homework ? (
                          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 text-[9px] font-extrabold uppercase">
                                Devoir Exigé
                              </span>
                              <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Remise</span>
                              </span>
                            </div>

                            <h4 className="text-xs font-extrabold text-slate-800">{selectedRoom.homework.title}</h4>
                            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                              {selectedRoom.homework.description}
                            </p>

                            <div className="pt-2 border-t border-slate-50 space-y-3">
                              <div className="text-[10px] font-bold text-slate-600">Statut de la remise :</div>
                              
                              {/* Submit Switch representation */}
                              {selectedRoom.homework.submitted || homeworkStatus[selectedRoom.id] ? (
                                <div className="p-3 bg-teal-50 border border-teal-100 rounded-2xl flex items-center gap-2.5 text-teal-800">
                                  <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0" />
                                  <div>
                                    <div className="text-[10px] font-bold">Devoir Remis</div>
                                    <div className="text-[9px] text-teal-600 font-semibold">Transmis avec succès</div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3.5">
                                  <div className="p-3.5 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors relative flex flex-col items-center justify-center text-center cursor-pointer">
                                    <input 
                                      type="file" 
                                      className="absolute inset-0 opacity-0 cursor-pointer" 
                                      onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                          setHomeworkFile(e.target.files[0]);
                                        }
                                      }}
                                    />
                                    <Upload className="h-6 w-6 text-slate-400 mb-2" />
                                    <div className="text-[9px] font-bold text-slate-600">
                                      {homeworkFile ? homeworkFile.name : "Sélectionner ou glisser le code source / PDF"}
                                    </div>
                                    <div className="text-[8px] text-slate-400 font-semibold mt-0.5">Fichiers autorisés : ZIP, PDF (Max. 10 Mo)</div>
                                  </div>

                                  {homeworkFile && (
                                    <button
                                      onClick={() => handleHomeworkSubmit(selectedRoom.id)}
                                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-extrabold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                                    >
                                      Transmettre le Devoir
                                    </button>
                                  )}
                                </div>
                              )}
                              
                              <p className="text-[9px] text-red-500 font-semibold text-center mt-2 bg-red-50 py-1 rounded-md">
                                Délai : {selectedRoom.homework.deadline}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 bg-slate-50 rounded-3xl text-center text-slate-400 text-[10px] font-semibold border border-slate-100">
                            Aucune tâche active pour ce cours.
                          </div>
                        )}

                      </div>

                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ACADEMIC CALENDAR */}
            {activeTab === "calendar" && (
              <div className="space-y-6">
                
                <CalendarGrid
                  title="Chronologie Académique - Devoirs Surveillés & Examens"
                  events={backendCalendarEvents}
                />

                {/* Upcoming Events List */}
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden p-6">
                  <h4 className="text-xs font-extrabold text-slate-800 mb-4">Événements à venir</h4>
                  <div className="space-y-3">
                    {backendCalendarEvents.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">Aucun événement à venir.</p>
                    ) : backendCalendarEvents.slice(0, 3).map((evt, idx) => (
                       <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${evt.type === 'exam' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                            <span className="text-xs font-bold text-slate-700">{evt.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">{evt.date ?? ""}</span>
                       </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>Important : Les plannings détaillés par matière des DS et Examens seront partagés par l'administration via le flux principal de scolarité.</span>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

    </div>
  );
}
