"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import type { Profile } from "@/types/profile";
import { getProfile } from "@/lib/services/profile.service";
import { Target, Trophy, BookOpen, Flame } from "lucide-react";

import Header from "@/components/dashboard/Header";
import StatCard from "@/components/dashboard/StatCard";
import SubjectProgress from "@/components/dashboard/SubjectProgress";
import QuickActions from "@/components/dashboard/QuickActions";
import ProgressChart from "@/components/dashboard/ProgressChart";
import Achievements from "@/components/dashboard/Achievements";
import RecentSimulations from "@/components/dashboard/RecentSimulations";
import GoalCard from "@/components/dashboard/GoalCard";

export default function DashboardPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [userName, setUserName] = useState("");

    const progress =
      profile && profile.target_score > 0
        ? Math.min((profile.average_score / profile.target_score) * 100, 100)
        : 0;

    useEffect(() => {
      const checkUser = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
          return;
        }

        const profileData = await getProfile(session.user.id);

        if (profileData) {
          setProfile(profileData);
          setUserName(profileData.full_name);
        } else {
          setUserName(
            session.user.user_metadata.full_name ||
            session.user.email ||
            "Usuario"
          );
        }

        setLoading(false);
      };

      checkUser();
    }, [router]);

    const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push("/login");
    };

    if (loading) {
      return null;
    }

  return (
    <main className="min-h-screen bg-slate-100">

      {/* Navbar */}
      <Header
        userName={userName}
        onLogout={handleLogout}
      />
      {/*Barra de progreso*/}
      <div className="mx-auto max-w-7xl px-8 pt-8">

      <div className="mt-6 rounded-3xl bg-white p-6 shadow">
        <div className="flex justify-between">
          <h2 className="font-semibold text-slate-700">
            Progreso hacia tu meta
          </h2>

          <span className="font-bold text-blue-600">
            {profile?.average_score}/{profile?.target_score}
          </span>
        </div>

        <div className="mt-4 h-4 w-full rounded-full bg-slate-200">
          <div
            className="h-4 rounded-full bg-blue-600 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

    </div>

      {/* Contenido */}
      <div className="mx-auto max-w-7xl p-8">

        {/* Tarjetas */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Puntaje promedio"
            value={profile?.average_score ?? 0}
            icon={<Trophy size={30} />}
            color="blue"
          />

          <StatCard
            title="Meta"
            value={profile?.target_score ?? 0}
            icon={<Target size={30} />}
            color="green"
          />

          <StatCard
            title="Simulacros"
            value={profile?.simulations ?? 0}
            icon={<BookOpen size={30} />}
            color="orange"
          />

          <StatCard
            title="Racha"
            value={profile?.streak ?? 0}
            icon={<Flame size={30} />}
            color="red"
          />

          </div>

          {/* Gráfica + Acciones */}
          <div className="mt-8 grid gap-8 lg:grid-cols-3">

            <div className="lg:col-span-2">
              <ProgressChart />
            </div>

            <QuickActions />

          </div>

          {/* Rendimiento + Logros */}
          <div className="mt-8 grid gap-8 lg:grid-cols-3">

            <div className="lg:col-span-2 rounded-3xl bg-white p-8 shadow">
              <h2 className="mb-8 text-2xl font-bold text-slate-800">
                📚 Rendimiento por materia
              </h2>

              <div className="space-y-6">
                <SubjectProgress
                  subject="Matemáticas"
                  percentage={82}
                />

                <SubjectProgress
                  subject="Lectura Crítica"
                  percentage={76}
                />

                <SubjectProgress
                  subject="Ciencias Naturales"
                  percentage={69}
                />

                <SubjectProgress
                  subject="Sociales"
                  percentage={88}
                />

                <SubjectProgress
                  subject="Inglés"
                  percentage={91}
                />

              </div>

            </div>

            {/* Últimos simulacros */}
            <div className="mt-8">
              <RecentSimulations />
            </div>

            <div className="mt-8">
            <GoalCard
              currentScore={profile?.average_score ?? 0}
              targetScore={profile?.target_score ?? 500}
            />
          </div>

            {/* Logros */}
            <Achievements />

          </div>

        </div>

      </main>
    );
   }