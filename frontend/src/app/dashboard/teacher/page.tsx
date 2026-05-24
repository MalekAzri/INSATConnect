"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CalendarGrid, { CalendarEvent } from "@/components/Calendar";
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

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, logout, login } = useUser();
  const [activeTab, setActiveTab] = useState<"rooms" | "calendar">("rooms");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Room State
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

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
            onClick={() => setActiveTab("calendar")}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "calendar" ? "bg-teal-50/70 text-teal-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Calendar className="h-4.5 w-4.5" />
            <span>Calendrier DS & Examens</span>
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
              {selectedRoomId ? (
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
                        {["MPI", "GL2", "GL3", "GL4", "IIA", "IMI"].map(y => <option key={y} value={y}>{y}</option>)}
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
                  events={[
                    { dayNumber: 15, type: 'exam', title: 'Début DS1' },
                    { dayNumber: 25, type: 'grading', title: 'Remise Notes DS1' },
                    { dayNumber: 10, type: 'exam', title: 'Soutenance' },
                    { dayNumber: 30, type: 'grading', title: 'Délibérations' },
                  ]}
                />
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
