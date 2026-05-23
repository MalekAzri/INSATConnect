"use client";

import React from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import {
  GraduationCap,
  Briefcase,
  Users,
  MessageSquare,
  Calendar,
  FileText,
  CheckCircle2,
  ArrowRight,
  Layers,
  Sparkles,
  Zap,
  Shield,
  Clock,
  Building2
} from "lucide-react";

export default function Home() {
  const { user } = useUser();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F9FBFC] text-slate-800">
      {/* Background Soft Blobs (Moodi Studio theme) */}
      <div className="absolute top-[-10%] left-[-10%] -z-10 h-[500px] w-[500px] rounded-full bg-teal-200/30 opacity-60 blur-[100px]"></div>
      <div className="absolute top-[40%] right-[-10%] -z-10 h-[600px] w-[600px] rounded-full bg-pink-200/30 opacity-55 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[20%] -z-10 h-[450px] w-[450px] rounded-full bg-blue-100/40 opacity-70 blur-[100px]"></div>

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100/40 bg-white/70 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <span className="text-lg font-black tracking-tighter">iC</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              INSAT<span className="text-blue-600"> Connect</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#services" className="hover:text-blue-600 transition-colors">Espaces</a>
            <a href="#impact" className="hover:text-blue-600 transition-colors">Avantages</a>
            <a href="#team" className="hover:text-blue-600 transition-colors">Notre Équipe</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            {user.isLoggedIn ? (
              <Link
                href="/dashboard/student"
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 hover:shadow-blue-500/20 transition-all cursor-pointer"
              >
                Mon Espace ({user.role === "student" ? user.year : "Admin"}) <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 hover:shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Accès Portail <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-center">

            {/* Left Column: Headline */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-600 border border-blue-100">
                <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                <span>Le portail intelligent de l'INSAT Tunis</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl leading-[1.1] !font-sans">
                Simplicité, créativité et liens directs avec <span className="text-blue-600">INSAT Connect</span>
              </h1>

              <p className="mx-auto lg:mx-0 max-w-2xl text-lg md:text-xl leading-relaxed text-slate-500 font-medium">
                La plateforme de liaison directe entre l'administration de l'INSAT, les étudiants et les enseignants pour une scolarité fluide, des cours interactifs et des échanges instantanés.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/30 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Découvrir mon espace <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#services"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 px-8 py-4 text-base font-bold text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  En savoir plus
                </a>
              </div>

            </div>

            {/* Right Column: Visual Component Mockup (Moodi Studio Style) */}
            <div className="lg:col-span-5 relative flex justify-center">
              {/* Central Premium Graphic */}
              <div className="relative w-full max-w-[380px] sm:max-w-[420px] aspect-square rounded-[40px] bg-gradient-to-tr from-blue-50 to-indigo-50 border border-white p-6 shadow-2xl shadow-slate-100 flex items-center justify-center">

                {/* Center circle */}
                <div className="w-48 h-48 rounded-full bg-white shadow-xl shadow-indigo-100/50 flex flex-col items-center justify-center text-center p-4 border border-indigo-50/50">
                  <div className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 flex mb-2">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div className="font-bold text-slate-800 text-sm">INSAT Connect</div>
                  <div className="text-[10px] text-slate-400 font-medium">Portail de Communication</div>
                </div>

                {/* Floating Cards (representing widgets in references) */}

                {/* Widget 1: Rooms */}
                <div className="absolute top-6 -left-6 glass rounded-2xl p-3 shadow-lg shadow-slate-100/50 border border-white/80 w-44 flex items-center gap-3 animate-float">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Rooms de Cours</div>
                    <div className="text-[10px] text-slate-400 font-semibold">Salles style Classroom</div>
                  </div>
                </div>

                {/* Widget 2: Chat */}
                <div className="absolute top-1/2 -right-10 glass rounded-2xl p-3 shadow-lg shadow-slate-100/50 border border-white/80 w-40 flex items-center gap-3 animate-float delay-500">
                  <div className="p-2 rounded-xl bg-pink-50 text-pink-500">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Scolarité</div>
                    <div className="text-[10px] text-slate-400 font-semibold">En ligne</div>
                  </div>
                </div>

                {/* Widget 3: Calendar */}
                <div className="absolute bottom-6 left-6 glass rounded-2xl p-3 shadow-lg shadow-slate-100/50 border border-white/80 w-44 flex items-center gap-3 animate-float delay-1000">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Calendar</div>
                    <div className="text-[10px] text-slate-400 font-semibold">Dates DS & Examens</div>
                  </div>
                </div>

                {/* Soft abstract circle markers in background */}
                <div className="absolute top-1/4 right-[15%] w-3 h-3 rounded-full bg-pink-400/80"></div>
                <div className="absolute bottom-1/3 left-[15%] w-4 h-4 rounded-full bg-teal-400/80"></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SERVICES / ESPACES SECTION */}
      <section id="services" className="py-20 bg-white border-y border-slate-100 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase">Nos Espaces Ciblés</h2>
            <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Une plateforme unique, trois rôles connectés
            </p>
            <p className="text-slate-500 font-medium">
              Chaque membre de l'institut possède son espace dédié avec des fonctionnalités adaptées pour simplifier l'organisation administrative et pédagogique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">

            {/* Card 1: Student */}
            <div className="rounded-3xl border border-slate-100 bg-[#F9FBFC] p-8 shadow-sm hover:shadow-xl hover:shadow-slate-100/80 transition-all group flex flex-col justify-between">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-6 group-hover:scale-105 transition-transform">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Espace Étudiant</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  Rejoignez des Salles de Cours interactives, accédez au feed de notes ciblé selon votre classe (ex. GL3), consultez les circulaires officielles et clavardez avec l'administration.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    <span>Rooms style Google Classroom</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    <span>Affichage ciblé des notes par filière</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    <span>Calendrier académique des DS & Examens</span>
                  </li>
                </ul>
              </div>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700">
                Se connecter en étudiant <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Card 2: Teacher */}
            <div className="rounded-3xl border border-slate-100 bg-[#F9FBFC] p-8 shadow-sm hover:shadow-xl hover:shadow-slate-100/80 transition-all group flex flex-col justify-between">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-6 group-hover:scale-105 transition-transform">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Espace Enseignant</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  Créez des salons d'étude pour vos classes. Partagez instantanément des cours, TD, devoirs à rendre et interagissez avec les étudiants via des commentaires.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    <span>Création de salons d'étude dédiés</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    <span>Diffusion de fichiers et polycopiés</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    <span>Collecte interactive des devoirs</span>
                  </li>
                </ul>
              </div>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700">
                Accéder au portail Prof <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Card 3: Administration */}
            <div className="rounded-3xl border border-slate-100 bg-[#F9FBFC] p-8 shadow-sm hover:shadow-xl hover:shadow-slate-100/80 transition-all group flex flex-col justify-between">
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-500 mb-6 group-hover:scale-105 transition-transform">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Espace Administration</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  Gérez la scolarité de manière agile : publication des avertissements de fraude, diffusion des circulaires officielles, emplois du temps et affichage ciblé des notes par année universitaire.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    <span>Flux de diffusion d'informations globales</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    <span>Ciblage précis des notes (ex. GL3)</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                    <span>Messagerie instantanée avec les étudiants</span>
                  </li>
                </ul>
              </div>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-pink-500 hover:text-pink-600">
                Se connecter en Admin <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ADVANTAGES SECTION */}
      <section id="impact" className="py-20 px-6 lg:px-8 relative">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase">Avantages</h2>
            <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Pourquoi choisir INSAT Connect ?
            </p>
            <p className="text-slate-500 font-medium">
              Une plateforme pensée pour simplifier la vie universitaire et renforcer les liens entre tous les acteurs de l'INSAT.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {/* Advantage 1 */}
            <div className="glass rounded-3xl p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-white/60 text-center space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto">
                <Building2 className="h-7 w-7" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">Connexion Administration</h4>
              <p className="text-xs text-slate-400 font-semibold">Étudiants connectés directement à leur administration et leurs professeurs</p>
            </div>

            {/* Advantage 2 */}
            <div className="glass rounded-3xl p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-white/60 text-center space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mx-auto">
                <Zap className="h-7 w-7" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">Communication Instantanée</h4>
              <p className="text-xs text-slate-400 font-semibold">Échanges en temps réel entre profs et étudiants</p>
            </div>

            {/* Advantage 3 */}
            <div className="glass rounded-3xl p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-white/60 text-center space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-pink-500 mx-auto">
                <Clock className="h-7 w-7" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">Gain de Temps</h4>
              <p className="text-xs text-slate-400 font-semibold">Scolarité libérée des papiers et des files d'attente</p>
            </div>

            {/* Advantage 4 */}
            <div className="glass rounded-3xl p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-white/60 text-center space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mx-auto">
                <Shield className="h-7 w-7" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">Sécurisé & Fiable</h4>
              <p className="text-xs text-slate-400 font-semibold">Données protégées et accès contrôlé par rôle</p>
            </div>

          </div>
        </div>
      </section>

      {/* TEAM SECTION (Inspired by Team in references) */}
      <section id="team" className="py-20 bg-slate-50 border-t border-slate-100 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase">Notre Équipe Étudiante</h2>
            <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Les voix derrière le projet INSAT Connect
            </p>
            <p className="text-slate-500 font-medium">
              Une équipe de 6 étudiants en <span className="font-bold text-blue-600">Génie Logiciel 3</span> ayant conçu et développé la plateforme INSAT Connect.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">

            {/* Student 1: Amira Lahiani */}
            <div className="glass rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-white/60 text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-3xl font-bold border-2 border-white shadow-md">
                  AL
                </div>

              </div>
              <div>
                <h4 className="font-bold text-slate-800">Amira Lahiani</h4>
              </div>
            </div>

            {/* Student 2: Malek Azri */}
            <div className="glass rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-white/60 text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto text-3xl font-bold border-2 border-white shadow-md">
                  MA
                </div>

              </div>
              <div>
                <h4 className="font-bold text-slate-800">Malek Azri</h4>
              </div>
            </div>

            {/* Student 3: Emna Harzallah */}
            <div className="glass rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-white/60 text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mx-auto text-3xl font-bold border-2 border-white shadow-md">
                  EH
                </div>

              </div>
              <div>
                <h4 className="font-bold text-slate-800">Emna Harzallah</h4>
              </div>
            </div>

            {/* Student 4: Mohamed Abdelwahed */}
            <div className="glass rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-white/60 text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto text-3xl font-bold border-2 border-white shadow-md">
                  MA
                </div>

              </div>
              <div>
                <h4 className="font-bold text-slate-800">Mohamed Abdelwahed</h4>
              </div>
            </div>

            {/* Student 5: Menyar Frifita */}
            <div className="glass rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-white/60 text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mx-auto text-3xl font-bold border-2 border-white shadow-md">
                  MF
                </div>

              </div>
              <div>
                <h4 className="font-bold text-slate-800">Menyar Frifita</h4>
              </div>
            </div>

            {/* Student 6: Omar Trigui */}
            <div className="glass rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-white/60 text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mx-auto text-3xl font-bold border-2 border-white shadow-md">
                  OT
                </div>

              </div>
              <div>
                <h4 className="font-bold text-slate-800">Omar Trigui</h4>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-12 px-6 lg:px-8 border-t border-slate-800">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black tracking-tighter">
              iC
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              INSAT<span className="text-blue-400"> Connect</span>
            </span>
          </div>

          <p className="text-xs text-slate-400 font-medium text-center md:text-left">
            © {new Date().getFullYear()} INSAT Connect. Fait pour l'Institut National des Sciences Appliquées et de Technologie de Tunis. Tous droits réservés.
          </p>

          <div className="flex gap-6 text-sm font-semibold text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Politique</a>
            <a href="#" className="hover:text-white transition-colors">INSAT Site</a>
            <a href="/login" className="hover:text-white transition-colors">Portail</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
