"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser, UserRole } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CalendarGrid, { CalendarEvent } from "@/components/Calendar";
import { queryGraphQL } from "@/utils/graphql";
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
interface Publication {
  id: string;
  titre: string;
  categorie: "urgent" | "document" | "notes" | "planning";
  contenu: string;
  date: string;
  auteur: string;
  anneeCible?: string; // e.g. "GL3"
  nomFichier?: string;
  tailleFichier?: string;
  notesTableau?: { matiere: string; ds: string; examen: string; moyenne: string }[];
}

interface PublicationSalle {
  id: string;
  auteur: string;
  avatar: string;
  date: string;
  contenu: string;
  commentaires: { id: string; auteur: string; contenu: string; date: string }[];
}

interface Salle {
  id: string;
  name: string;
  prof: string;
  titreProf: string;
  bgGradient: string;
  anneeCible: string;
  devoir?: {
    id: string;
    titre: string;
    description: string;
    dateLimite: string;
    soumis: boolean;
  };
  publications: PublicationSalle[];
}

interface MessageChat {
  id: string;
  sender: "student" | "admin";
  contenu: string;
  time: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout, updateYear, login } = useUser();
  const [ongletActif, setOngletActif] = useState<"feed" | "chat" | "rooms" | "calendar">("feed");
  const [idSalleSelectionnee, setIdSalleSelectionnee] = useState<string | null>(null);
  
  // Real-time Chat integration (Membre 2)
  const { isConnected: isChatConnected, messages: chatMessages, sendMessage } = useChat({
    userId: user && user.id ? Number(user.id) : 2, // Default student is 2
    otherUserId: 1, // Admin is 1
  });
  
  const welcomeMessage = {
    id: "welcome",
    senderId: 1,
    content: "Bonjour Malek ! Je suis l'agent de permanence du service scolarité de l'INSAT. Comment puis-je vous aider aujourd'hui ?",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  };
  const allMessages = [welcomeMessage, ...chatMessages];
  
  // Custom states for interactivity
  const [etatCommentaires, setEtatCommentaires] = useState<{ [postId: string]: string }>({});
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [fichierDevoir, setFichierDevoir] = useState<File | null>(null);
  const [statutDevoir, setStatutDevoir] = useState<{ [roomId: string]: boolean }>({});
  const [messageNotification, setMessageNotification] = useState<string | null>(null);
  
  // Chat States
  const [messageSaisi, setMessageSaisi] = useState("");
  const [adminEcrit, setAdminEcrit] = useState(false);
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
  }, [allMessages, adminEcrit]);

  const showToast = (msg: string) => {
    setMessageNotification(msg);
    setTimeout(() => {
      setMessageNotification(null);
    }, 4000);
  };

  // Profile Form State
  const [anneeProfil, setAnneeProfil] = useState(user.year || "GL3");
  useEffect(() => {
    if (user.year) {
      setAnneeProfil(user.year);
    }
  }, [user.year]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateYear(anneeProfil);
    showToast(`Année universitaire mise à jour avec succès en ${anneeProfil} !`);
    // Reset room selected just in case active rooms change
    setIdSalleSelectionnee(null);
  };

  // GraphQL and local states for resource consultation
  const [publicationsFlux, setPublicationsFlux] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lazy loading details cache
  const [detailsCharges, setDetailsCharges] = useState<{ [postId: string]: any }>({});
  const [chargementDetails, setChargementDetails] = useState<{ [postId: string]: boolean }>({});

  // Academic calendar dates state
  const [datesAcademiques, setDatesAcademiques] = useState<any[]>([]);

  useEffect(() => {
    if (!user.isLoggedIn) return;

    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const res = await queryGraphQL(`
          query GetResources($year: String!) {
            documents {
              id
              title
              category
              publishedAt
            }
            timetables(targetYear: $year) {
              id
              title
              targetYear
              publishedAt
            }
            grades(targetYear: $year) {
              id
              title
              targetYear
              publishedAt
            }
            academicDates {
              key
              date
              targetRole
            }
          }
        `, { year: user.year || "GL3" });

        if (!active) return;

        const publications: Publication[] = [];

        // 1. Documents
        if (res.documents) {
          res.documents.forEach((doc: any) => {
            const isUrgent = doc.title.toUpperCase().includes('URGENT');
            publications.push({
              id: `doc_${doc.id}`,
              titre: doc.title,
              categorie: isUrgent ? 'urgent' : 'document',
              contenu: '', // Lazy loaded
              date: doc.publishedAt,
              auteur: 'Service Scolarité',
            });
          });
        }

        // 2. Timetables
        if (res.timetables) {
          res.timetables.forEach((t: any) => {
            publications.push({
              id: `timetable_${t.id}`,
              titre: t.title,
              categorie: 'planning',
              contenu: '', // Lazy loaded
              date: t.publishedAt,
              auteur: 'Direction Pédagogique',
              anneeCible: t.targetYear,
            });
          });
        }

        // 3. Grades
        if (res.grades) {
          res.grades.forEach((g: any) => {
            publications.push({
              id: `grade_${g.id}`,
              titre: g.title,
              categorie: 'notes',
              contenu: '', // Lazy loaded
              date: g.publishedAt,
              auteur: 'Service des Examens',
              anneeCible: g.targetYear,
            });
          });
        }

        setPublicationsFlux(publications);
        setDatesAcademiques(res.academicDates || []);
        setError(null);
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError('Erreur lors du chargement des données. Veuillez réessayer.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [user.year, user.isLoggedIn]);

  const chargerDetailPublication = async (postId: string) => {
    if (detailsCharges[postId] || chargementDetails[postId]) return;

    setChargementDetails(prev => ({ ...prev, [postId]: true }));
    try {
      if (postId.startsWith('doc_')) {
        const id = parseInt(postId.replace('doc_', ''), 10);
        const res = await queryGraphQL(`
          query GetDocDetail($id: Int!) {
            document(id: $id) {
              content
              fileName
              fileSize
            }
          }
        `, { id });
        const doc = res.document;
        setDetailsCharges(prev => ({ 
          ...prev, 
          [postId]: {
            ...doc,
            contenu: doc.content,
            nomFichier: doc.fileName,
            tailleFichier: doc.fileSize
          } 
        }));
      } else if (postId.startsWith('timetable_')) {
        const id = parseInt(postId.replace('timetable_', ''), 10);
        const res = await queryGraphQL(`
          query GetTimetableDetail($id: Int!) {
            timetable(id: $id) {
              fileName
              fileSize
              scheduleJson
            }
          }
        `, { id });
        const tt = res.timetable;
        setDetailsCharges(prev => ({ 
          ...prev, 
          [postId]: {
            ...tt,
            nomFichier: tt.fileName,
            tailleFichier: tt.fileSize,
            emploiDuTempsJson: tt.scheduleJson
          } 
        }));
      } else if (postId.startsWith('grade_')) {
        const id = parseInt(postId.replace('grade_', ''), 10);
        const res = await queryGraphQL(`
          query GetGradeDetail($id: Int!) {
            grade(id: $id) {
              gradesJson
            }
          }
        `, { id });
        const grades = JSON.parse(res.grade.gradesJson);
        setDetailsCharges(prev => ({ 
          ...prev, 
          [postId]: { 
            grades,
            notesTableau: grades
          } 
        }));
      }
    } catch (err) {
      console.error('Failed to load post details:', err);
      showToast('Erreur lors du chargement des détails.');
    } finally {
      setChargementDetails(prev => ({ ...prev, [postId]: false }));
    }
  };

  const publicationsFluxFiltrees = publicationsFlux;


  // MOCK DATA: Rooms (Google Classroom style)
  const sallesInitiales: Salle[] = [
    {
      id: "r_gl_comp",
      name: "Compilation & Automates (GL3)",
      prof: "Dr. Mohamed Slim",
      titreProf: "Enseignant Technologue - Département Informatique",
      bgGradient: "from-blue-500 to-indigo-500",
      anneeCible: "GL3",
      devoir: {
        id: "hw_comp_1",
        titre: "Analyseur Lexical en Lex/Flex",
        description: "Écrire un analyseur syntaxique pour un sous-ensemble simple de langage C. Déposer le fichier code source .l accompagné d'un compte rendu PDF.",
        dateLimite: "Dans 2 jours (25 Mai 2026)",
        soumis: false
      },
      publications: [
        {
          id: "rp_comp1",
          auteur: "Dr. Mohamed Slim",
          avatar: "MS",
          date: "Hier à 14:15",
          contenu: "Bonjour à tous. J'ai déposé le support de cours du Chapitre 3 sur l'analyse syntaxique ascendante (LR et LALR). Nous ferons les applications en TD mercredi prochain. Bon travail !",
          commentaires: [
            { id: "rpc1", auteur: "Yassine Gharbi", contenu: "Merci professeur ! Est-ce que le chapitre 4 sera inclus dans le DS ?", date: "Hier à 15:02" },
            { id: "rpc2", auteur: "Dr. Mohamed Slim", contenu: "Non Yassine, le DS s'arrêtera à l'analyse syntaxique descendante (LL1).", date: "Hier à 15:30" }
          ]
        }
      ]
    },
    {
      id: "r_gl_design",
      name: "Conception Orientée Objet & Design Patterns (GL3)",
      prof: "Dr. Mohamed Slim",
      titreProf: "Enseignant Technologue - Département Informatique",
      bgGradient: "from-teal-500 to-emerald-500",
      anneeCible: "GL3",
      devoir: {
        id: "hw_design_1",
        titre: "TP Décorateur & Observateur",
        description: "Implémenter une interface de simulation de rapports financiers en appliquant les patterns Decorator et Observer en Java ou C#. Rendre le code source zippé.",
        dateLimite: "Dans 5 jours (28 Mai 2026)",
        soumis: false
      },
      publications: [
        {
          id: "rp_des1",
          auteur: "Dr. Mohamed Slim",
          avatar: "MS",
          date: "Il y a 2 jours",
          contenu: "Chers étudiants, voici le polycopié de travaux dirigés sur les patterns de structures (Adapter, Decorator, Composite). Veuillez préparer les exercices 1 et 2 pour la séance de laboratoire.",
          commentaires: []
        }
      ]
    },
    {
      id: "r_gl_net",
      name: "Réseaux et Protocoles IP (GL3)",
      prof: "Dr. Kaouthar Belhassen",
      titreProf: "Maitre de Conférences - Laboratoire Réseaux",
      bgGradient: "from-purple-500 to-indigo-500",
      anneeCible: "GL3",
      publications: [
        {
          id: "rp_net1",
          auteur: "Dr. Kaouthar Belhassen",
          avatar: "KB",
          date: "Il y a 3 jours",
          contenu: "Bonjour, le calendrier des séances de rattrapage de TP Réseaux (configuration de routeurs Cisco) est affiché au niveau du panneau du département. Veuillez vérifier vos groupes de TP.",
          commentaires: []
        }
      ]
    },
    // MPI classes
    {
      id: "r_mpi_math",
      name: "Analyse Réelle (MPI)",
      prof: "Prof. Anis Hadded",
      titreProf: "Chef Département Préparatoire Mathématiques",
      bgGradient: "from-pink-500 to-rose-500",
      anneeCible: "MPI",
      devoir: {
        id: "hw_mpi_1",
        titre: "Séries Numériques & Fonctions",
        description: "Résoudre la série de problèmes n°2 distribuée en classe. Compte-rendu scanné propre en PDF exigé.",
        dateLimite: "Dans 3 jours (26 Mai 2026)",
        soumis: false
      },
      publications: [
        {
          id: "rp_math1",
          auteur: "Prof. Anis Hadded",
          avatar: "AH",
          date: "Hier",
          contenu: "Bonjour. J'ai publié la feuille de correction du TD 1 sur les suites de Cauchy. Concentrez-vous bien sur les théorèmes de convergence.",
          commentaires: []
        }
      ]
    },
    // IIA classes
    {
      id: "r_iia_sys",
      name: "Systèmes Asservis & Automates (IIA)",
      prof: "Dr. Kaouthar Belhassen",
      titreProf: "Département Automatique et Robotique",
      bgGradient: "from-orange-500 to-amber-500",
      anneeCible: "IIA",
      publications: [
        {
          id: "rp_iia1",
          auteur: "Dr. Kaouthar Belhassen",
          avatar: "KB",
          date: "Il y a 2 jours",
          contenu: "Chers étudiants d'IIA, voici le guide de modélisation sous Matlab Simulink pour les correcteurs PID industriels.",
          commentaires: []
        }
      ]
    }
  ];

  // Dynamic storage of custom room comments and homework submission state
  const [etatSalles, setEtatSalles] = useState<Salle[]>(sallesInitiales);

  // Active rooms based on student's year selection
  const sallesActives = etatSalles.filter(room => room.anneeCible === user.year);

  // Active room data helper
  const salleSelectionnee = sallesActives.find(r => r.id === idSalleSelectionnee);

  // Leave comment under a prof post
  const ajouterCommentaire = (roomId: string, postId: string) => {
    const commentText = etatCommentaires[postId];
    if (!commentText || !commentText.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      auteur: user.name || "Étudiant INSAT",
      contenu: commentText,
      date: "À l'instant"
    };

    setEtatSalles(prev => prev.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          publications: room.publications.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                commentaires: [...post.commentaires, newComment]
              };
            }
            return post;
          })
        };
      }
      return room;
    }));

    // Reset comment input state
    setEtatCommentaires(prev => ({
      ...prev,
      [postId]: ""
    }));

    showToast("Commentaire publié avec succès !");
  };

  // Mock Homework Submission
  const soumettreDevoir = (roomId: string) => {
    setStatutDevoir(prev => ({
      ...prev,
      [roomId]: true
    }));
    
    // Simulate updating etatSalles homework submitted to true
    setEtatSalles(prev => prev.map(room => {
      if (room.id === roomId && room.devoir) {
        return {
          ...room,
          devoir: {
            ...room.devoir,
            soumis: true
          }
        };
      }
      return room;
    }));

    setFichierDevoir(null);
    showToast("Votre devoir a été transmis à l'enseignant avec succès !");
  };

  // Chat message send (Simulates a dynamic responsive conversation)
  const envoyerMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageSaisi || !messageSaisi.trim()) return;

    const studentQuery = messageSaisi.toLowerCase();
    const textToSend = messageSaisi;
    
    // Call Member 2's socket/REST sendMessage function
    sendMessage(1, textToSend);
    setMessageSaisi("");
    setAdminEcrit(true);

    // Dynamic responses from Mme Sonia based on user questions
    let adminReplyText = "Bonjour ! J'ai bien reçu votre demande. Je vais étudier cela avec la direction des études de l'INSAT et je vous recontacte au plus vite.";
    
    if (studentQuery.includes("relevé") || studentQuery.includes("notes")) {
      adminReplyText = `Parfait, j'ai vérifié votre profil pour la classe de ${user.year}. Votre relevé de notes officiel du Semestre 1 est déjà signé par la direction. Vous pouvez venir le retirer au guichet n°2 demain matin entre 9h et 12h.`;
    } else if (studentQuery.includes("emploi") || studentQuery.includes("planning") || studentQuery.includes("temps")) {
      adminReplyText = `Les emplois du temps définitifs pour le Semestre 2 sont actuellement publiés sur votre flux d'actualités. Pour le groupe ${user.year}, quelques ajustements de salles pour les TP ont été effectués aujourd'hui.`;
    } else if (studentQuery.includes("fraude") || studentQuery.includes("examen") || studentQuery.includes("conseil")) {
      adminReplyText = "Concernant les modalités d'examens et la discipline, tous les règlements généraux récents sont téléchargeables sous l'onglet 'Flux d'actualités' dans la section documents.";
    } else if (studentQuery.includes("inscription") || studentQuery.includes("dossier")) {
      adminReplyText = "Les fiches d'inscription administrative pour l'année universitaire suivante doivent impérativement être déposées sous format papier avant le 15 juin avec le justificatif de paiement des frais.";
    }

    setTimeout(async () => {
      setAdminEcrit(false);
      try {
        await fetch("http://localhost:3003/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: 1,
            receiverId: user.id ? Number(user.id) : 2,
            content: adminReplyText,
          }),
        });
      } catch (err) {
        console.error("Failed to post mock admin reply:", err);
      }
    }, 2000);
  };

  // Dynamic mapping of academic dates to calendar grid events and upcoming events list
  const evenementsCalendrier = datesAcademiques
    .map(d => {
      const parts = d.date.split('-');
      if (parts.length === 3 && parts[0] === '2026' && parts[1] === '05') {
        const day = parseInt(parts[2], 10);
        let type: 'exam' | 'deadline' | 'vacation' | 'grading' = 'exam';
        if (d.key.includes('remise')) type = 'deadline';
        if (d.key.includes('deliberation')) type = 'grading';

        let title = d.key;
        if (d.key === 'ds_remise') title = 'Remise notes DS';
        if (d.key === 'exam_remise') title = 'Remise notes Exam';
        if (d.key === 'ds_affichage') title = 'Affichage notes DS';
        if (d.key === 'exam_affichage') title = 'Affichage notes Exam';
        if (d.key === 'sem1_deliberation') title = 'Délibération S1';
        if (d.key === 'sem2_deliberation') title = 'Délibération S2';
        if (d.key === 'final_deliberation') title = 'Délibération finale';

        return {
          dayNumber: day,
          type,
          title,
        };
      }
      return null;
    })
    .filter(Boolean) as CalendarEvent[];

  const calendarData = datesAcademiques.map(d => {
    let event = d.key;
    if (d.key === 'ds_remise') event = 'Date limite de remise des notes de DS';
    if (d.key === 'exam_remise') event = "Date limite de remise des notes d'examens";
    if (d.key === 'ds_affichage') event = 'Affichage des notes de DS';
    if (d.key === 'exam_affichage') event = "Affichage des notes d'examens";
    if (d.key === 'sem1_deliberation') event = 'Délibération du Semestre 1';
    if (d.key === 'sem2_deliberation') event = 'Délibération du Semestre 2';
    if (d.key === 'final_deliberation') event = "Délibération de fin d'année";

    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const parts = d.date.split('-');
    let formattedDate = d.date;
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const yr = parts[0];
      formattedDate = `${day} ${months[monthIdx]} ${yr}`;
    }

    let badge = 'Calendrier';
    let badgeColor = 'bg-slate-50 text-slate-600 border-slate-100';
    if (d.key.includes('remise')) {
      badge = 'Limite';
      badgeColor = 'bg-orange-50 text-orange-600 border-orange-100';
    } else if (d.key.includes('affichage')) {
      badge = 'Affichage';
      badgeColor = 'bg-purple-50 text-purple-600 border-purple-100';
    } else if (d.key.includes('deliberation')) {
      badge = 'Délibération';
      badgeColor = 'bg-red-50 text-red-600 border-red-100';
    }

    return {
      event,
      date: formattedDate,
      badge,
      badgeColor,
    };
  });

  // Check how many homeworks are active and unsubmitted to notify user
  const devoirsNonSoumis = sallesActives.filter(r => r.devoir && !r.devoir.soumis && !statutDevoir[r.id]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9FBFC] text-slate-800">
      
      {/* Dynamic Toast notifications */}
      {messageNotification && (
        <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-2.5 rounded-2xl bg-slate-900 px-5 py-4 text-xs font-bold text-white shadow-xl animate-slideUp">
          <Sparkles className="h-4 w-4 text-teal-400" />
          <span>{messageNotification}</span>
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
                setIdSalleSelectionnee(null);
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
            onClick={() => { setOngletActif("feed"); setIdSalleSelectionnee(null); }}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              ongletActif === "feed"
                ? "bg-blue-50/70 text-blue-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <FileText className="h-4.5 w-4.5" />
            <span>Flux d'Actualités</span>
          </button>

          {/* Chat Tab */}
          <button
            onClick={() => { setOngletActif("chat"); setIdSalleSelectionnee(null); }}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              ongletActif === "chat"
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
            onClick={() => { setOngletActif("rooms"); }}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              ongletActif === "rooms"
                ? "bg-blue-50/70 text-blue-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <BookOpen className="h-4.5 w-4.5" />
            <span>Rooms (Salles de cours)</span>
            <span className="ml-auto bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-bold">
              {sallesActives.length}
            </span>
          </button>

          {/* Calendar Tab */}
          <button
            onClick={() => { setOngletActif("calendar"); setIdSalleSelectionnee(null); }}
            className={`flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              ongletActif === "calendar"
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
                {ongletActif === "feed" && "Flux d'Actualités INSAT"}
                {ongletActif === "chat" && "Support & Messagerie Scolarité"}
                {ongletActif === "rooms" && (idSalleSelectionnee ? salleSelectionnee?.name : "Salles d'Étude")}
                {ongletActif === "calendar" && "Calendrier Général des DS & Examens"}
              </span>
              <select
                value={user.year || "GL3"}
                onChange={(e) => {
                  updateYear(e.target.value);
                  showToast(`Filière mise à jour : ${e.target.value}`);
                  setIdSalleSelectionnee(null);
                }}
                className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border-none cursor-pointer focus:outline-none font-bold"
              >
                {["MPI", "GL2", "GL3", "GL4", "IIA", "IMI"].map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </h1>
          </div>

          {/* Action Icons right */}
          <div className="flex items-center gap-4">
            
            {/* Custom Homework Due Notification Badge */}
            <div className="relative group cursor-pointer">
              <div className="p-2.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-colors flex items-center justify-center text-slate-500">
                <Bell className="h-5 w-5" />
                {devoirsNonSoumis.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                )}
              </div>
              
              {/* Dropdown notification card */}
              <div className="absolute right-0 mt-3 w-80 rounded-3xl bg-white border border-slate-100 shadow-2xl p-4 hidden group-hover:block z-50">
                <h4 className="text-xs font-extrabold text-slate-800 pb-2 border-b border-slate-50">Rappels de travaux</h4>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {devoirsNonSoumis.length > 0 ? (
                    devoirsNonSoumis.map(r => (
                      <div key={r.id} className="p-2 bg-orange-50/50 border border-orange-100 rounded-xl flex gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-800">{r.devoir?.titre}</p>
                          <p className="text-[9px] text-orange-600 font-semibold">{r.devoir?.dateLimite}</p>
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
            {ongletActif === "feed" && (
              <div className="max-w-2xl mx-auto space-y-6 w-full pb-10">
                {/* Alert Badge for year-targeted feed updates */}
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-900">Affichage Ciblé Activé : {user.year}</h4>
                    <p className="text-[11px] text-blue-700 font-semibold mt-0.5">
                      Ce flux est synchronisé avec votre filière universitaire. Changez de classe dans le sélecteur de la barre latérale pour voir les ressources de votre promo.
                    </p>
                  </div>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-xs font-bold">Chargement des ressources depuis le serveur...</p>
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-red-900">Connexion au serveur impossible</h4>
                      <p className="text-[11px] text-red-700 font-semibold mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                {/* Feed Posts Stream */}
                {!loading && !error && (
                  <div className="flex flex-col gap-6">
                    {publicationsFluxFiltrees.map((post) => {
                      const detail = detailsCharges[post.id];
                      const isLoadingDetail = chargementDetails[post.id];
                      const isExpanded = !!detail;
                      return (
                        <article
                          key={post.id}
                          className={`rounded-3xl border p-6 bg-white transition-all shadow-sm ${
                            post.categorie === "urgent"
                              ? "border-red-100 bg-red-50/20 shadow-red-50/50"
                              : "border-slate-100"
                          }`}
                        >
                          {/* Publication Header */}
                          <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              {post.categorie === "urgent" && (
                                <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-600 text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" /> Urgent
                                </span>
                              )}
                              {post.categorie === "document" && (
                                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-600 text-[9px] font-extrabold uppercase tracking-wider">
                                  Document Officiel
                                </span>
                              )}
                              {post.categorie === "notes" && (
                                <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-600 text-[9px] font-extrabold uppercase tracking-wider">
                                  Relevé de Notes — {post.anneeCible}
                                </span>
                              )}
                              {post.categorie === "planning" && (
                                <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-600 text-[9px] font-extrabold uppercase tracking-wider">
                                  Emploi du temps — {post.anneeCible}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-semibold">{post.date}</span>
                            </div>
                            <div className="text-[10px] font-extrabold text-slate-500">Par : {post.auteur}</div>
                          </div>

                          {/* Publication Body Title */}
                          <h3 className="text-base font-extrabold text-slate-900 mb-2">{post.titre}</h3>

                          {/* Content (lazy loaded) */}
                          {detail?.content && (
                            <p className="text-xs text-slate-500 leading-relaxed mb-4">{detail.contenu}</p>
                          )}

                          {/* Lazy Load Trigger Button */}
                          {!isExpanded && (
                            <button
                              onClick={() => chargerDetailPublication(post.id)}
                              disabled={isLoadingDetail}
                              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors mt-1 mb-3 cursor-pointer disabled:opacity-50"
                            >
                              {isLoadingDetail ? (
                                <><RefreshCw className="h-3 w-3 animate-spin" /> Chargement des détails...</>
                              ) : (
                                <><ChevronRight className="h-3.5 w-3.5" /> Voir les détails</>
                              )}
                            </button>
                          )}

                          {/* Document attachment — lazy loaded */}
                          {isExpanded && (post.categorie === "document" || post.categorie === "urgent") && detail?.fileName && (
                            <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/50 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-white border border-slate-100 text-red-500">
                                  <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="text-[11px] font-bold text-slate-800">{detail.nomFichier}</div>
                                  <div className="text-[9px] text-slate-400 font-semibold">{detail.tailleFichier} • Document PDF téléchargeable</div>
                                </div>
                              </div>
                              <button
                                onClick={() => showToast(`Téléchargement de ${detail.nomFichier} démarré...`)}
                                className="p-2 rounded-xl hover:bg-white hover:text-blue-600 text-slate-400 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          )}

                          {/* Timetable — lazy loaded */}
                          {isExpanded && post.categorie === "planning" && detail?.scheduleJson && (() => {
                            let schedule: Record<string, string> = {};
                            try { schedule = JSON.parse(detail.emploiDuTempsJson); } catch {}
                            const days = Object.keys(schedule);
                            const dayColors: Record<string, string> = {
                              lundi: "bg-blue-50/70 border-blue-100 text-blue-700",
                              mardi: "bg-teal-50/70 border-teal-100 text-teal-700",
                              mercredi: "bg-purple-50/70 border-purple-100 text-purple-700",
                              jeudi: "bg-amber-50/70 border-amber-100 text-amber-700",
                              vendredi: "bg-pink-50/70 border-pink-100 text-pink-700",
                            };
                            return (
                              <div className="space-y-3">
                                {detail.nomFichier && (
                                  <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <div className="flex items-center gap-2.5">
                                      <div className="p-2 rounded-xl bg-white border border-slate-100 text-purple-600">
                                        <FileSpreadsheet className="h-5 w-5" />
                                      </div>
                                      <div>
                                        <div className="text-[11px] font-bold text-slate-800">{detail.nomFichier}</div>
                                        <div className="text-[9px] text-slate-400 font-semibold">{detail.tailleFichier} • Planning Semestriel</div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => showToast("Ouverture de l'emploi du temps...")}
                                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-sm"
                                    >
                                      Télécharger
                                    </button>
                                  </div>
                                )}
                                <div className="border border-slate-100 rounded-2xl overflow-hidden text-[10px] font-semibold text-slate-600 bg-slate-50">
                                  <div className={`grid text-center bg-slate-100 p-2 font-extrabold text-slate-700 border-b border-slate-200`} style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                                    {days.map(d => <div key={d} className="capitalize">{d}</div>)}
                                  </div>
                                  <div className={`grid text-center p-3 gap-2`} style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                                    {days.map(d => (
                                      <div key={d} className={`p-2 border rounded-lg ${dayColors[d] ?? "bg-slate-100 border-slate-200 text-slate-500"}` }>
                                        {schedule[d]}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Grade table — lazy loaded */}
                          {isExpanded && post.categorie === "notes" && detail?.grades && (
                            <div className="mt-2 border border-teal-50 rounded-2xl overflow-hidden shadow-inner bg-teal-50/10">
                              <div className="bg-teal-500/10 px-4 py-2.5 border-b border-teal-100 flex items-center justify-between text-teal-800">
                                <span className="text-[10px] font-extrabold">Relevé de notes — Promotion {post.anneeCible}</span>
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
                                    {detail.notesTableau.map((grade: any, idx: number) => (
                                      <tr key={idx} className="border-b border-slate-100 hover:bg-teal-50/20">
                                        <td className="p-3 font-bold text-slate-800">{grade.matiere}</td>
                                        <td className="p-3 text-center text-slate-500">{grade.ds}</td>
                                        <td className="p-3 text-center text-slate-500">{grade.examen}</td>
                                        <td className="p-3 text-center font-extrabold text-blue-600">{grade.moyenne}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CHAT HUB (Messagerie Administration) */}
            {ongletActif === "chat" && (
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
                      {allMessages.map(msg => {
                        const isFromStudent = Number(msg.senderId) === Number(user.id || 2);
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
                                {msg.id === "welcome" 
                                  ? "15:30" 
                                  : new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                                }
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Typing Indicator */}
                      {adminEcrit && (
                        <div className="flex gap-3 max-w-[85%] mr-auto">
                          <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 font-bold flex items-center justify-center text-xs shrink-0">
                            SC
                          </div>
                          <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3.5 flex items-center justify-center gap-1 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-150"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-300"></span>
                          </div>
                        </div>
                      )}
                      
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input messaging bar */}
                    <form onSubmit={envoyerMessage} className="p-4 border-t border-slate-100 bg-white flex gap-3 shrink-0">
                      <input
                        type="text"
                        disabled={adminEcrit}
                        placeholder="Posez vos questions à la scolarité (ex: relevé de notes, dossier, circulaires)..."
                        value={messageSaisi}
                        onChange={e => setMessageSaisi(e.target.value)}
                        className="flex-1 block rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors placeholder-slate-400 disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={adminEcrit || !messageSaisi.trim()}
                        className="px-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10 flex items-center justify-center disabled:bg-blue-400 cursor-pointer"
                      >
                        <SendHorizontal className="h-4.5 w-4.5" />
                      </button>
                    </form>

                  </div>
            )}

            {/* TAB 2: ROOMS (Salles de cours style Classroom) */}
            {ongletActif === "rooms" && (
              <div className="flex-1 flex flex-col">
                {!idSalleSelectionnee ? (
                  /* Rooms list selection grid */
                  <div className="space-y-6">
                    <div className="text-xs font-bold text-slate-400">Sélectionnez une salle active liée à votre filière ({user.year}) :</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {sallesActives.map(room => (
                        <button
                          key={room.id}
                          onClick={() => setIdSalleSelectionnee(room.id)}
                          className="w-full text-left rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:shadow-slate-100/70 p-6 transition-all group overflow-hidden relative cursor-pointer"
                        >
                          <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${room.bgGradient}`}></div>
                          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mt-2">{room.name}</h3>
                          <p className="text-[11px] text-slate-400 font-semibold mt-1">Enseignant : {room.prof}</p>
                          <p className="text-[10px] text-slate-500 mt-4 leading-relaxed font-semibold">
                            {room.publications[0] ? room.publications[0].contenu.substring(0, 100) + "..." : "Aucune annonce récente."}
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
                      onClick={() => setIdSalleSelectionnee(null)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      ← Retour aux Rooms
                    </button>

                    {/* Salle banner */}
                    <div className={`p-6 rounded-3xl bg-gradient-to-r ${salleSelectionnee?.bgGradient} text-white shadow-lg shadow-indigo-100/50`}>
                      <h2 className="text-xl font-extrabold">{salleSelectionnee?.name}</h2>
                      <p className="text-xs opacity-90 mt-1 font-semibold">{salleSelectionnee?.prof} • {salleSelectionnee?.titreProf}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Left/Middle: Publication stream and comments */}
                      <div className="md:col-span-2 space-y-6">
                        <div className="text-xs font-bold text-slate-400">Flux d'actualités du cours</div>
                        
                        {salleSelectionnee?.publications.map(post => (
                          <div key={post.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-extrabold text-xs">
                                {post.avatar}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-800">{post.auteur}</div>
                                <div className="text-[9px] text-slate-400 font-semibold">{post.date}</div>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed font-semibold whitespace-pre-line">{post.contenu}</p>
                            
                            {/* Comments Section */}
                            <div className="pt-4 border-t border-slate-50 space-y-4">
                              <div className="text-[10px] font-extrabold text-slate-400 flex items-center gap-1.5">
                                <MessageCircle className="h-4 w-4" />
                                <span>Commentaires de classe ({post.commentaires.length})</span>
                              </div>
                              
                              {/* Comments Stream */}
                              <div className="space-y-3.5">
                                {post.commentaires.map(c => (
                                  <div key={c.id} className="flex gap-2.5 items-start p-3 bg-slate-50 rounded-2xl">
                                    <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                      {c.auteur.split(" ").map(n=>n[0]).join("")}
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-800">{c.auteur}</span>
                                        <span className="text-[8px] text-slate-400 font-semibold">{c.date}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-600 font-semibold">{c.contenu}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Add Comment Input */}
                              <div className="flex gap-2.5 mt-2">
                                <input
                                  type="text"
                                  placeholder="Laisser un commentaire ou poser une question..."
                                  value={etatCommentaires[post.id] || ""}
                                  onChange={e => setEtatCommentaires(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  onKeyDown={e => { if (e.key === "Enter") ajouterCommentaire(salleSelectionnee.id, post.id); }}
                                  className="flex-1 block rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                                />
                                <button
                                  onClick={() => ajouterCommentaire(salleSelectionnee.id, post.id)}
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
                        
                        {salleSelectionnee?.devoir ? (
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

                            <h4 className="text-xs font-extrabold text-slate-800">{salleSelectionnee.devoir.titre}</h4>
                            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                              {salleSelectionnee.devoir.description}
                            </p>

                            <div className="pt-2 border-t border-slate-50 space-y-3">
                              <div className="text-[10px] font-bold text-slate-600">Statut de la remise :</div>
                              
                              {/* Submit Switch representation */}
                              {salleSelectionnee.devoir.soumis || statutDevoir[salleSelectionnee.id] ? (
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
                                          setFichierDevoir(e.target.files[0]);
                                        }
                                      }}
                                    />
                                    <Upload className="h-6 w-6 text-slate-400 mb-2" />
                                    <div className="text-[9px] font-bold text-slate-600">
                                      {fichierDevoir ? fichierDevoir.name : "Sélectionner ou glisser le code source / PDF"}
                                    </div>
                                    <div className="text-[8px] text-slate-400 font-semibold mt-0.5">Fichiers autorisés : ZIP, PDF (Max. 10 Mo)</div>
                                  </div>

                                  {fichierDevoir && (
                                    <button
                                      onClick={() => soumettreDevoir(salleSelectionnee.id)}
                                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-extrabold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                                    >
                                      Transmettre le Devoir
                                    </button>
                                  )}
                                </div>
                              )}
                              
                              <p className="text-[9px] text-red-500 font-semibold text-center mt-2 bg-red-50 py-1 rounded-md">
                                Délai : {salleSelectionnee.devoir.dateLimite}
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
            {ongletActif === "calendar" && (
              <div className="space-y-6">
                
                <CalendarGrid
                  title="Calendrier Académique — Dates Officielles INSAT"
                  subtitle={`Filière : ${user.year}`}
                  events={evenementsCalendrier}
                />

                {/* Upcoming Events List */}
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden p-6">
                  <h4 className="text-xs font-extrabold text-slate-800 mb-4">Échéances Académiques Officielles</h4>
                  {calendarData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3 text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
                      <p className="text-xs font-semibold">Chargement du calendrier...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {calendarData.map((evt, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl border ${evt.badgeColor}`}>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${evt.badgeColor}`}>{evt.badge}</span>
                            <span className="text-xs font-bold text-slate-700">{evt.event}</span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 shrink-0 ml-2">{evt.date}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>Toutes les dates affichées sont fixées par l'administration INSAT et synchronisées en temps réel via le serveur calendrier.</span>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

    </div>
  );
}
