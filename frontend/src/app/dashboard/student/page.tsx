"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser, UserRole } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CalendarGrid, { CalendarEvent } from "@/components/Calendar";
import { useChat } from "@/hooks/useChat";
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

// Types for Mock Data
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
  grades?: { subject: string; ds: string; exam: string; avg: string }[];
}

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

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout, updateYear, login } = useUser();
  const [activeTab, setActiveTab] = useState<"feed" | "chat" | "rooms" | "calendar">("feed");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  
  // Custom states for interactivity
  const [commentsState, setCommentsState] = useState<{ [postId: string]: string }>({});
  const [newCommentVal, setNewCommentVal] = useState("");
  const [homeworkFile, setHomeworkFile] = useState<File | null>(null);
  const [homeworkStatus, setHomeworkStatus] = useState<{ [roomId: string]: boolean }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Chat States - connected to real backend
  const ADMIN_USER_ID = 1; // Simulated admin ID
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

  // MOCK DATA: Feed Posts published by Admin
  const allFeedPosts: Post[] = [
    {
      id: "p1",
      title: "URGENT: Tolérance Zéro Contre la Fraude aux Examens",
      category: "urgent",
      content: "Il est rappelé à tous les étudiants de l'INSAT que toute tentative de fraude ou utilisation de matériel non autorisé (téléphones connectés, écouteurs, documents non signés) durant les devoirs surveillés entraînera la traduction immédiate devant le conseil de discipline de l'université. Nous comptons sur votre rigueur académique.",
      date: "Il y a 2 heures",
      author: "Direction des Études"
    },
    {
      id: "p2",
      title: "Fiche d'Inscription Administrative 2026-2027",
      category: "document",
      content: "Veuillez trouver ci-joint le formulaire officiel de réinscription administrative pour la prochaine année universitaire. Le dossier complet doit être déposé au guichet de la scolarité avant le 15 juin 2026.",
      date: "Hier",
      author: "Bureau Scolarité",
      fileName: "Formulaire_Inscription_INSAT_2026.pdf",
      fileSize: "2.4 Mo"
    },
    {
      id: "p3",
      title: "Circulaire de Demande de Relevé de Notes Officiel",
      category: "document",
      content: "Pour toute demande de relevé de notes de semestres précédents, veuillez télécharger et remplir ce formulaire, puis l'envoyer par mail ou le remettre directement au guichet du service scolarité.",
      date: "Il y a 2 jours",
      author: "Service Scolarité",
      fileName: "Demande_Releve_Notes_INSAT.pdf",
      fileSize: "850 Ko"
    },
    {
      id: "p_gl3",
      title: "Affichage des Notes - Génie Logiciel GL3 (Semestre 1)",
      category: "notes",
      content: "Les notes du premier semestre (Session Principale) pour la filière GL3 sont désormais disponibles. Félicitations à toute la promotion pour le taux de réussite exceptionnel de cette année !",
      date: "Il y a 3 jours",
      author: "Service des Examens",
      targetYear: "GL3",
      grades: [
        { subject: "Conception Orientée Objet & Design Patterns", ds: "14.5", exam: "13.0", avg: "13.6" },
        { subject: "Théorie de la Compilation & Automates", ds: "12.0", exam: "11.5", avg: "11.7" },
        { subject: "Réseaux et Protocoles IP", ds: "15.0", exam: "14.0", avg: "14.4" },
        { subject: "Développement Web & APIs", ds: "16.5", exam: "15.5", avg: "15.9" }
      ]
    },
    {
      id: "p_gl4",
      title: "Affichage des Notes - Spécialité GL4 (Semestre 1)",
      category: "notes",
      content: "Le jury d'examen a délibéré et validé l'affichage des notes du S1 pour les étudiants de GL4 (Génie Logiciel 4ème année). Les relevés provisoires peuvent être demandés en ligne.",
      date: "Il y a 3 jours",
      author: "Service des Examens",
      targetYear: "GL4",
      grades: [
        { subject: "Architecture Logicielles Avancées (Microservices)", ds: "16.0", exam: "15.0", avg: "15.4" },
        { subject: "DevOps & Cloud Computing", ds: "15.5", exam: "14.5", avg: "14.9" },
        { subject: "Sécurité & Cryptographie Appliquée", ds: "13.0", exam: "12.5", avg: "12.7" }
      ]
    },
    {
      id: "p_mpi",
      title: "Affichage des Notes - Cycle Préparatoire MPI (Semestre 1)",
      category: "notes",
      content: "Les résultats des examens du Semestre 1 pour les classes MPI (Maths-Physique-Informatique) sont affichés. Veuillez consulter le récapitulatif des moyennes générales.",
      date: "Il y a 3 jours",
      author: "Service des Examens",
      targetYear: "MPI",
      grades: [
        { subject: "Analyse Réelle & Limites", ds: "10.5", exam: "09.5", avg: "09.9" },
        { subject: "Algèbre Linéaire & Espaces Vectoriels", ds: "11.0", exam: "10.0", avg: "10.4" },
        { subject: "Physique Générale: Optique & Mécanique", ds: "12.5", exam: "11.0", avg: "11.6" }
      ]
    },
    {
      id: "p_iia",
      title: "Affichage des Notes - IIA (Informatique Industrielle & Auto.)",
      category: "notes",
      content: "Les notes de la session de DS et Examens S1 pour la filière IIA sont en ligne. Les consultations de copies auront lieu le lundi matin.",
      date: "Il y a 4 jours",
      author: "Service des Examens",
      targetYear: "IIA",
      grades: [
        { subject: "Systèmes Asservis & Régulations de Processus", ds: "13.5", exam: "12.0", avg: "12.6" },
        { subject: "Microcontrôleurs & Architecture Systèmes", ds: "14.0", exam: "13.5", avg: "13.7" }
      ]
    },
    {
      id: "p_imi",
      title: "Affichage des Notes - Instrumentation & Mesures Industrielles IMI",
      category: "notes",
      content: "Les relevés de notes du Semestre 1 pour la promotion IMI ont été validés par le comité de délibération.",
      date: "Il y a 4 jours",
      author: "Service des Examens",
      targetYear: "IMI",
      grades: [
        { subject: "Capteurs Industriels & Instrumentation de Mesure", ds: "13.0", exam: "12.0", avg: "12.4" },
        { subject: "Thermodynamique Technique", ds: "11.5", exam: "11.0", avg: "11.2" }
      ]
    },
    {
      id: "p4",
      title: "Emploi du Temps Semestriel (Version PDF)",
      category: "planning",
      content: "Voici le planning hebdomadaire de cours mis en place à l'INSAT. Ce planning intègre les cours en amphi, les séances de TD et les laboratoires de travaux pratiques.",
      date: "Il y a 5 jours",
      author: "Direction Pédagogique",
      fileName: "Emploi_du_Temps_INSAT_S2.pdf",
      fileSize: "1.8 Mo"
    }
  ];

  // Filter posts based on student's university year.
  // Note: general posts have no targetYear. Grades posts specify targetYear and are filtered.
  const filteredFeedPosts = allFeedPosts.filter(
    (post) => !post.targetYear || post.targetYear === user.year
  );

  // MOCK DATA: Rooms (Google Classroom style)
  const initialRooms: Room[] = [
    {
      id: "r_gl_comp",
      name: "Compilation & Automates (GL3)",
      prof: "Dr. Mohamed Slim",
      profTitle: "Enseignant Technologue - Département Informatique",
      bgGradient: "from-blue-500 to-indigo-500",
      targetYear: "GL3",
      homework: {
        id: "hw_comp_1",
        title: "Analyseur Lexical en Lex/Flex",
        description: "Écrire un analyseur syntaxique pour un sous-ensemble simple de langage C. Déposer le fichier code source .l accompagné d'un compte rendu PDF.",
        deadline: "Dans 2 jours (25 Mai 2026)",
        submitted: false
      },
      posts: [
        {
          id: "rp_comp1",
          author: "Dr. Mohamed Slim",
          avatar: "MS",
          date: "Hier à 14:15",
          content: "Bonjour à tous. J'ai déposé le support de cours du Chapitre 3 sur l'analyse syntaxique ascendante (LR et LALR). Nous ferons les applications en TD mercredi prochain. Bon travail !",
          comments: [
            { id: "rpc1", author: "Yassine Gharbi", content: "Merci professeur ! Est-ce que le chapitre 4 sera inclus dans le DS ?", date: "Hier à 15:02" },
            { id: "rpc2", author: "Dr. Mohamed Slim", content: "Non Yassine, le DS s'arrêtera à l'analyse syntaxique descendante (LL1).", date: "Hier à 15:30" }
          ]
        }
      ]
    },
    {
      id: "r_gl_design",
      name: "Conception Orientée Objet & Design Patterns (GL3)",
      prof: "Dr. Mohamed Slim",
      profTitle: "Enseignant Technologue - Département Informatique",
      bgGradient: "from-teal-500 to-emerald-500",
      targetYear: "GL3",
      homework: {
        id: "hw_design_1",
        title: "TP Décorateur & Observateur",
        description: "Implémenter une interface de simulation de rapports financiers en appliquant les patterns Decorator et Observer en Java ou C#. Rendre le code source zippé.",
        deadline: "Dans 5 jours (28 Mai 2026)",
        submitted: false
      },
      posts: [
        {
          id: "rp_des1",
          author: "Dr. Mohamed Slim",
          avatar: "MS",
          date: "Il y a 2 jours",
          content: "Chers étudiants, voici le polycopié de travaux dirigés sur les patterns de structures (Adapter, Decorator, Composite). Veuillez préparer les exercices 1 et 2 pour la séance de laboratoire.",
          comments: []
        }
      ]
    },
    {
      id: "r_gl_net",
      name: "Réseaux et Protocoles IP (GL3)",
      prof: "Dr. Kaouthar Belhassen",
      profTitle: "Maitre de Conférences - Laboratoire Réseaux",
      bgGradient: "from-purple-500 to-indigo-500",
      targetYear: "GL3",
      posts: [
        {
          id: "rp_net1",
          author: "Dr. Kaouthar Belhassen",
          avatar: "KB",
          date: "Il y a 3 jours",
          content: "Bonjour, le calendrier des séances de rattrapage de TP Réseaux (configuration de routeurs Cisco) est affiché au niveau du panneau du département. Veuillez vérifier vos groupes de TP.",
          comments: []
        }
      ]
    },
    // MPI classes
    {
      id: "r_mpi_math",
      name: "Analyse Réelle (MPI)",
      prof: "Prof. Anis Hadded",
      profTitle: "Chef Département Préparatoire Mathématiques",
      bgGradient: "from-pink-500 to-rose-500",
      targetYear: "MPI",
      homework: {
        id: "hw_mpi_1",
        title: "Séries Numériques & Fonctions",
        description: "Résoudre la série de problèmes n°2 distribuée en classe. Compte-rendu scanné propre en PDF exigé.",
        deadline: "Dans 3 jours (26 Mai 2026)",
        submitted: false
      },
      posts: [
        {
          id: "rp_math1",
          author: "Prof. Anis Hadded",
          avatar: "AH",
          date: "Hier",
          content: "Bonjour. J'ai publié la feuille de correction du TD 1 sur les suites de Cauchy. Concentrez-vous bien sur les théorèmes de convergence.",
          comments: []
        }
      ]
    },
    // IIA classes
    {
      id: "r_iia_sys",
      name: "Systèmes Asservis & Automates (IIA)",
      prof: "Dr. Kaouthar Belhassen",
      profTitle: "Département Automatique et Robotique",
      bgGradient: "from-orange-500 to-amber-500",
      targetYear: "IIA",
      posts: [
        {
          id: "rp_iia1",
          author: "Dr. Kaouthar Belhassen",
          avatar: "KB",
          date: "Il y a 2 jours",
          content: "Chers étudiants d'IIA, voici le guide de modélisation sous Matlab Simulink pour les correcteurs PID industriels.",
          comments: []
        }
      ]
    }
  ];

  // Dynamic storage of custom room comments and homework submission state
  const [roomsState, setRoomsState] = useState<Room[]>(initialRooms);

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

  // Mock Homework Submission
  const handleHomeworkSubmit = (roomId: string) => {
    setHomeworkStatus(prev => ({
      ...prev,
      [roomId]: true
    }));
    
    // Simulate updating roomsState homework submitted to true
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

  // MOCK DATA: Academic Calendar (DS & Examens)
  const calendarData = [
    { event: "Début des Cours Semestre 1", date: "15 Septembre 2025", badge: "Académique", badgeColor: "bg-blue-50 text-blue-600 border-blue-100" },
    { event: "Semaine de Devoirs Surveillés (DS1)", date: "10 Nov - 15 Nov 2025", badge: "Évaluation", badgeColor: "bg-amber-50 text-amber-600 border-amber-100" },
    { event: "Arrêt des Cours S1", date: "20 Décembre 2025", badge: "Calendrier", badgeColor: "bg-slate-50 text-slate-600 border-slate-100" },
    { event: "Examens Finaux du S1", date: "05 Jan - 15 Jan 2026", badge: "Examens", badgeColor: "bg-red-50 text-red-600 border-red-100" },
    { event: "Publication des Notes du S1", date: "05 Février 2026", badge: "Affichage", badgeColor: "bg-purple-50 text-purple-600 border-purple-100" },
    { event: "Début des Cours Semestre 2", date: "12 Février 2026", badge: "Académique", badgeColor: "bg-blue-50 text-blue-600 border-blue-100" },
    { event: "Semaine de Devoirs Surveillés (DS2)", date: "15 Mar - 20 Mar 2026", badge: "Évaluation", badgeColor: "bg-amber-50 text-amber-600 border-amber-100" },
    { event: "Arrêt des Cours S2", date: "23 Mai 2026", badge: "Calendrier", badgeColor: "bg-slate-50 text-slate-600 border-slate-100" },
    { event: "Examens Finaux du S2", date: "01 Juin - 10 Juin 2026", badge: "Examens", badgeColor: "bg-red-50 text-red-600 border-red-100" },
    { event: "Affichage des Notes Finales & Sessions de Rachat", date: "30 Juin 2026", badge: "Affichage", badgeColor: "bg-purple-50 text-purple-600 border-purple-100" }
  ];

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
            
            {/* Custom Homework Due Notification Badge */}
            <div className="relative group cursor-pointer">
              <div className="p-2.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-colors flex items-center justify-center text-slate-500">
                <Bell className="h-5 w-5" />
                {unsubmittedHomeworks.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                )}
              </div>
              
              {/* Dropdown notification card */}
              <div className="absolute right-0 mt-3 w-80 rounded-3xl bg-white border border-slate-100 shadow-2xl p-4 hidden group-hover:block z-50">
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

                          {/* Interactive PDF Document Attachment */}
                          {post.category === "document" && post.fileName && (
                            <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-white border border-slate-100 text-red-500">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="text-[11px] font-bold text-slate-800">{post.fileName}</div>
                                  <div className="text-[9px] text-slate-400 font-semibold">{post.fileSize} • Document PDF téléchargeable</div>
                                </div>
                              </div>
                              <button 
                                onClick={() => showToast(`Téléchargement de ${post.fileName} démarré...`)}
                                className="p-2 rounded-xl hover:bg-white hover:text-blue-600 text-slate-400 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                              >
                                <Download className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          )}

                          {/* Interactive Schedule File */}
                          {post.category === "planning" && post.fileName && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 rounded-xl bg-white border border-slate-100 text-purple-600">
                                    <FileSpreadsheet className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <div className="text-[11px] font-bold text-slate-800">{post.fileName}</div>
                                    <div className="text-[9px] text-slate-400 font-semibold">{post.fileSize} • Planning Semestriel</div>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => showToast("Ouverture de l'emploi du temps...")}
                                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-sm hover:border-slate-300"
                                >
                                  Consulter
                                </button>
                              </div>
                              
                              {/* Schedule visual representation */}
                              <div className="border border-slate-100 rounded-2xl overflow-hidden text-[10px] font-semibold text-slate-600 bg-slate-50">
                                <div className="grid grid-cols-5 text-center bg-slate-100 p-2 font-extrabold text-slate-700 border-b border-slate-200">
                                  <div>Lundi</div>
                                  <div>Mardi</div>
                                  <div>Mercredi</div>
                                  <div>Jeudi</div>
                                  <div>Vendredi</div>
                                </div>
                                <div className="grid grid-cols-5 text-center p-3 gap-2">
                                  <div className="p-2 bg-blue-50/70 border border-blue-100 rounded-lg text-blue-700">08:30 - Cours Compilation</div>
                                  <div className="p-2 bg-teal-50/70 border border-teal-100 rounded-lg text-teal-700">10:15 - Cours Design Patterns</div>
                                  <div className="p-2 bg-slate-100 rounded-lg text-slate-400 border border-dashed border-slate-200">Libre</div>
                                  <div className="p-2 bg-purple-50/70 border border-purple-100 rounded-lg text-purple-700">08:30 - TP Réseaux IP</div>
                                  <div className="p-2 bg-blue-50/70 border border-blue-100 rounded-lg text-blue-700">14:00 - TD Compilation</div>
                                </div>
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
                  events={[
                    { dayNumber: 15, type: 'exam', title: 'DS1' },
                    { dayNumber: 18, type: 'deadline', title: 'Rendu Projet' },
                    { dayNumber: 23, type: 'vacation', title: 'Arrêt S2' },
                  ]}
                />

                {/* Upcoming Events List */}
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden p-6">
                  <h4 className="text-xs font-extrabold text-slate-800 mb-4">Événements à venir</h4>
                  <div className="space-y-3">
                    {calendarData.slice(0, 3).map((evt, idx) => (
                       <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${evt.badge === 'Examens' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                            <span className="text-xs font-bold text-slate-700">{evt.event}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">{evt.date}</span>
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
