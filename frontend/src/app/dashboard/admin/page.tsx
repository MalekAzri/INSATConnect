"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CalendarGrid, { CalendarEvent } from "@/components/Calendar";
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
}

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
  const [activeTab, setActiveTab] = useState<"feed" | "calendar" | "chat">("feed");
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

  // CHAT STATE
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatSearch, setChatSearch] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "c1",
      studentName: "Amira Lahiani",
      studentClass: "GL3",
      lastMessage: "Bonjour, j'ai une question sur mon relevé de notes.",
      time: "09:14",
      unread: 2,
      messages: [
        { id: "m1", sender: "student", text: "Bonjour madame, j'ai une question sur mon relevé de notes.", time: "09:12" },
        { id: "m2", sender: "student", text: "Est-ce que je peux avoir une attestation de scolarité ?", time: "09:14" }
      ]
    },
    {
      id: "c2",
      studentName: "Mohamed Abdelwahed",
      studentClass: "IIA2",
      lastMessage: "Ma carte étudiante est expirée, que faire ?",
      time: "08:45",
      unread: 1,
      messages: [
        { id: "m3", sender: "student", text: "Bonjour, ma carte étudiante est expirée, que dois-je faire ?", time: "08:45" }
      ]
    },
    {
      id: "c3",
      studentName: "Omar Trigui",
      studentClass: "RT3",
      lastMessage: "Merci pour votre réponse.",
      time: "Hier",
      unread: 0,
      messages: [
        { id: "m5", sender: "student", text: "Bonjour, quand est-ce que les résultats du S1 seront affichés ?", time: "Hier 14:20" },
        { id: "m6", sender: "admin", text: "Les résultats seront affichés le 15 juin après délibération.", time: "Hier 15:05" },
        { id: "m7", sender: "student", text: "Merci pour votre réponse.", time: "Hier 15:10" }
      ]
    }
  ]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>("c1");

  const selectedConv = conversations.find(c => c.id === selectedConvId) ?? null;
  const filteredConvs = conversations.filter(c =>
    c.studentName.toLowerCase().includes(chatSearch.toLowerCase()) ||
    c.studentClass.toLowerCase().includes(chatSearch.toLowerCase())
  );

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedConvId) return;
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "admin",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    };
    setConversations(prev => prev.map(c =>
      c.id === selectedConvId
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg.text, time: newMsg.time, unread: 0 }
        : c
    ));
    setChatInput("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleSelectConv = (id: string) => {
    setSelectedConvId(id);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  // FEED STATE
  const [feedPosts, setFeedPosts] = useState<Post[]>([
    {
      id: "p1",
      title: "URGENT: Tolérance Zéro Contre la Fraude aux Examens",
      category: "urgent",
      content: "Il est rappelé à tous les étudiants de l'INSAT que toute tentative de fraude ou utilisation de matériel non autorisé (téléphones connectés, écouteurs, documents non signés) durant les devoirs surveillés entraînera la traduction immédiate devant le conseil de discipline de l'université. Nous comptons sur votre rigueur académique.",
      date: "Il y a 2 heures",
      author: "Direction des Études",
      targetYear: "Tous"
    }
  ]);

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState<"urgent" | "document" | "notes" | "planning">("notes");
  const [newPostTarget, setNewPostTarget] = useState("Tous");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    const newPost: Post = {
      id: `p_${Date.now()}`,
      title: newPostTitle,
      category: newPostCategory,
      content: newPostContent,
      date: "À l'instant",
      author: user.name || "Scolarité INSAT",
      targetYear: newPostTarget,
      fileName: attachedFile ? attachedFile.name : undefined,
      fileSize: attachedFile ? (attachedFile.size / (1024 * 1024)).toFixed(2) + " Mo" : undefined
    };

    setFeedPosts([newPost, ...feedPosts]);
    setNewPostTitle("");
    setNewPostContent("");
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    showToast("Publication envoyée !");
  };

  // CALENDAR STATE
  const [isCalendarConfigured, setIsCalendarConfigured] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
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

  const submitCalendarConfig = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert dates to CalendarEvents
    // We assume May 2026 is the demo month, so we'll just extract the day from the selected dates if they are in May.
    // For a real app, CalendarEvent would store a full date string, but our mock calendar uses dayNumber for the current month.
    // We'll adapt: if user picks a date, we parse it and extract the day for our demo calendar.
    const eventsToCreate: CalendarEvent[] = [];

    const addEvent = (dateStr: string, type: CalendarEvent["type"], title: string) => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      // Only add to our demo grid if it's in May 2026 (or just add the day anyway for demo purposes)
      eventsToCreate.push({
        dayNumber: d.getDate(),
        type,
        title,
        id: `${type}_${Date.now()}_${Math.random()}`
      } as any); // Ignoring strict typing for 'id' property we will add later if needed
    };

    addEvent(calConfig.s1_ds, 'exam', "Semaine DS S1");
    addEvent(calConfig.s1_grades_ds, 'grading', "Remise Notes DS S1");
    addEvent(calConfig.s1_publish_ds, 'deadline', "Affichage DS S1");
    
    addEvent(calConfig.s1_exam, 'exam', "Semaine Examens S1");
    addEvent(calConfig.s1_grades_exam, 'grading', "Remise Notes Examens S1");
    addEvent(calConfig.s1_publish_exam, 'deadline', "Affichage Examens S1");
    
    addEvent(calConfig.s1_delib, 'deadline', "Délibérations S1");

    addEvent(calConfig.s2_ds, 'exam', "Semaine DS S2");
    addEvent(calConfig.s2_grades_ds, 'grading', "Remise Notes DS S2");
    addEvent(calConfig.s2_publish_ds, 'deadline', "Affichage DS S2");
    
    addEvent(calConfig.s2_exam, 'exam', "Semaine Examens S2");
    addEvent(calConfig.s2_grades_exam, 'grading', "Remise Notes Examens S2");
    addEvent(calConfig.s2_publish_exam, 'deadline', "Affichage Examens S2");
    
    addEvent(calConfig.s2_delib, 'deadline', "Délibérations S2");
    addEvent(calConfig.end_year, 'deadline', "Délibérations de fin d'année");

    setCalendarEvents(eventsToCreate);
    setIsCalendarConfigured(true);
    showToast("Calendrier académique configuré avec succès !");
  };

  const handleEditEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editDate) return;
    
    const d = new Date(editDate);
    const newDay = d.getDate();
    
    setCalendarEvents(calendarEvents.map(evt => 
      evt.title === editingEvent.title && evt.type === editingEvent.type ? { ...evt, dayNumber: newDay } : evt
    ));
    setEditingEvent(null);
    showToast(`Événement "${editingEvent.title}" modifié !`);
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
            onClick={() => setActiveTab("chat")}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "chat" ? "bg-pink-50/70 text-pink-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Inbox className={`h-4 w-4 ${activeTab === "chat" ? "text-pink-500" : "text-slate-400"}`} />
            <span className="flex-1 text-left">Messages Étudiants</span>
            {conversations.reduce((acc, c) => acc + c.unread, 0) > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-extrabold text-white">
                {conversations.reduce((acc, c) => acc + c.unread, 0)}
              </span>
            )}
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
                {activeTab === "feed" ? "Fil d'Actualité" : activeTab === "calendar" ? "Configuration du Calendrier" : "Messages Étudiants"}
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
                        onChange={(e: any) => setNewPostCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-pink-300"
                      >
                        <option value="notes">Scolarité & Notes</option>
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
                      disabled={!newPostTitle.trim() || !newPostContent.trim()}
                      className="bg-pink-600 disabled:bg-pink-300 hover:bg-pink-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-pink-500/20 transition-all flex items-center gap-2"
                    >
                      Publier l'annonce <SendHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Feed Listing */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-pink-500" /> Annonces Publiées
                </h3>
                
                {feedPosts.map(post => {
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
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Semaine des DS</label>
                          <input type="date" required value={calConfig.s1_ds} onChange={e => handleCalConfigChange('s1_ds', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Semaine des Examens</label>
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
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Semaine des DS</label>
                          <input type="date" required value={calConfig.s2_ds} onChange={e => handleCalConfigChange('s2_ds', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:border-pink-300" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Semaine des Examens</label>
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
                        className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2"
                      >
                        Générer le calendrier <ChevronRight className="h-4 w-4" />
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
                      onClick={() => setIsCalendarConfigured(false)}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Reconfigurer
                    </button>
                  </div>
                  
                  <CalendarGrid 
                    title="Calendrier Académique Global"
                    subtitle="INSAT Tunis"
                    events={calendarEvents}
                    onEventEdit={(evt) => {
                      setEditingEvent(evt);
                      // Set a default date string for the input (mocking May 2026)
                      setEditDate(`2026-05-${evt.dayNumber.toString().padStart(2, '0')}`);
                    }}
                  />
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
                  {filteredConvs.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConv(conv.id)}
                      className={`w-full flex items-start gap-3 p-4 border-b border-slate-100 text-left transition-colors ${
                        selectedConvId === conv.id ? "bg-pink-50" : "hover:bg-white"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-pink-200">
                        {conv.studentName.split(" ").map(n => n[0]).join("").substring(0,2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-extrabold ${selectedConvId === conv.id ? "text-pink-700" : "text-slate-800"}`}>
                            {conv.studentName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold shrink-0 ml-1">{conv.time}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold mb-0.5">{conv.studentClass}</div>
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[11px] text-slate-500 truncate font-medium">{conv.lastMessage}</p>
                          {conv.unread > 0 && (
                            <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[9px] font-extrabold text-white">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat panel */}
              {selectedConv ? (
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-white shrink-0">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-pink-200">
                      {selectedConv.studentName.split(" ").map(n => n[0]).join("").substring(0,2)}
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-slate-800">{selectedConv.studentName}</div>
                      <div className="flex items-center gap-1.5">
                        <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
                        <span className="text-[10px] font-bold text-slate-400">{selectedConv.studentClass} · En ligne</span>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {selectedConv.messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                        {msg.sender === "student" && (
                          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-pink-400 to-rose-500 text-white flex items-center justify-center font-bold text-[10px] shadow-sm mr-2 shrink-0 self-end">
                            {selectedConv.studentName.split(" ").map(n => n[0]).join("").substring(0,2)}
                          </div>
                        )}
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                          msg.sender === "admin"
                            ? "bg-pink-600 text-white rounded-br-sm shadow-lg shadow-pink-500/20"
                            : "bg-slate-100 text-slate-800 rounded-bl-sm"
                        }`}>
                          <p>{msg.text}</p>
                          <p className={`text-[10px] mt-1 font-semibold ${msg.sender === "admin" ? "text-pink-200" : "text-slate-400"}`}>{msg.time}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendChatMessage} className="p-4 border-t border-slate-100 bg-white shrink-0">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder={`Répondre à ${selectedConv.studentName}...`}
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
                  <p className="text-sm font-bold">Sélectionnez une conversation</p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
