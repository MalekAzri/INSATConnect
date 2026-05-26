"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, UserRole } from "@/context/UserContext";
import { backendFetchJson } from "@/lib/backend";
import { GraduationCap, Briefcase, ShieldAlert, ArrowRight, Building } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useUser();
  const [role, setRole] = useState<UserRole>("student");
  const [year, setYear] = useState<string>("GL3");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // If already logged in, redirect to student space
  useEffect(() => {
    if (user.isLoggedIn) {
      if (user.role === "student") {
        router.push("/dashboard/student");
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await backendFetchJson<{
        access_token: string;
        user: { id: number; email: string; name: string; role: string; year?: string };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("insat_token", res.access_token);
      const roleMap: Record<string, UserRole> = {
        etudiant: "student",
        student: "student",
        teacher: "teacher",
        administration: "admin",
        admin: "admin",
      };
      const backendRole: UserRole = roleMap[res.user.role] ?? "student";
      login(backendRole, res.user.year ?? year, res.user.name, res.user.email, res.user.id);

      if (backendRole === "student") {
        router.push("/dashboard/student");
      } else if (backendRole === "teacher") {
        router.push("/dashboard/teacher");
      } else {
        router.push("/dashboard/admin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F9FBFC] px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Soft Blobs (Moodi Studio style) */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-teal-200/40 opacity-70 blur-3xl sm:h-96 sm:w-96"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-pink-200/40 opacity-70 blur-3xl sm:h-96 sm:w-96"></div>
      
      {/* Tiny decorative floating shapes */}
      <div className="absolute top-12 right-[15%] h-3 w-3 rounded-full bg-teal-400 animate-pulse"></div>
      <div className="absolute bottom-16 left-[10%] h-4 w-4 rounded-full bg-pink-400 animate-pulse delay-1000"></div>

      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105">
              <span className="text-xl font-black tracking-tighter">iC</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-800">
              INSAT<span className="text-blue-600"> Connect</span>
            </span>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
            Espace de Connexion
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sélectionnez votre rôle et accédez à votre espace universitaire
          </p>
        </div>

        {/* Login Card Container */}
        <div className="glass rounded-3xl p-8 shadow-xl shadow-slate-100/50 border border-white/60">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-3">
                Je suis :
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* Student */}
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    role === "student"
                      ? "border-blue-600 bg-blue-50/50 text-blue-600 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <GraduationCap className="h-6 w-6 mb-2" />
                  <span className="text-xs font-semibold">Étudiant</span>
                </button>

                {/* Teacher */}
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    role === "teacher"
                      ? "border-blue-600 bg-blue-50/50 text-blue-600 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <Briefcase className="h-6 w-6 mb-2" />
                  <span className="text-xs font-semibold">Enseignant</span>
                </button>

                {/* Admin */}
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    role === "admin"
                      ? "border-blue-600 bg-blue-50/50 text-blue-600 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-600"
                  }`}
                >
                  <Building className="h-6 w-6 mb-2" />
                  <span className="text-xs font-semibold">Administration</span>
                </button>
              </div>
            </div>

            {/* Dynamic University Year Field for Students */}
            {role === "student" && (
              <div className="space-y-2 animate-fadeIn">
                <label htmlFor="year-select" className="text-sm font-medium text-slate-700 block">
                  Année Universitaire
                </label>
                <select
                  id="year-select"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="MPI">MPI (Classes Préparatoires)</option>
                  <option value="GL2">GL2 (2ème année Génie Logiciel)</option>
                  <option value="GL3">GL3 (3ème année Génie Logiciel)</option>
                  <option value="GL4">GL4 (4ème année Génie Logiciel)</option>
                  <option value="IIA">IIA (Informatique Industrielle & Auto.)</option>
                  <option value="IMI">IMI (Instrumentation & Mesures)</option>
                </select>
                <p className="text-xs text-slate-400">
                  Cette classe déterminera l'affichage ciblé de vos notes, cours et emplois du temps. Vous pourrez la mettre à jour depuis votre profil.
                </p>
              </div>
            )}

            {/* Personal Details */}
            <div className="space-y-4">
              <div>
                <label htmlFor="email-input" className="text-sm font-medium text-slate-700 block mb-1">
                  Adresse Email INSAT
                </label>
                <input
                  id="email-input"
                  type="email"
                  required
                  placeholder="nom.prenom@insat.u-cartago.tn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors placeholder-slate-400"
                />
              </div>

              <div>
                <label htmlFor="password-input" className="text-sm font-medium text-slate-700 block mb-1">
                  Mot de Passe
                </label>
                <input
                  id="password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors placeholder-slate-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:shadow-none cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connexion en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Se connecter <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
