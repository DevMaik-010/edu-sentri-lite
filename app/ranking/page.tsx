"use client";

import { useEffect, useState } from "react";
import { obtenerRanking, RankingUser } from "@/services/codigo";
import {
  Trophy,
  Medal,
  Award,
  Users,
  TrendingUp,
  Target,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRanking = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const data = await obtenerRanking(50);
    setRanking(data);

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    const cargarRanking = async () => {
      await fetchRanking();
    };

    cargarRanking();
  }, []);

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-500" />;
      default:
        return null;
    }
  };

  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-400/50";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-slate-400/10 border-gray-300/50";
      case 3:
        return "bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-400/50";
      default:
        return "bg-white/5 border-white/10 hover:bg-white/10";
    }
  };

  // Estadísticas calculadas
  const totalParticipantes = ranking.length;
  const mejorPuntaje = ranking.length > 0 ? ranking[0]?.puntaje : 0;
  const promedioPuntaje =
    ranking.length > 0
      ? Math.round(ranking.reduce((a, b) => a + b.puntaje, 0) / ranking.length)
      : 0;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 opacity-20 dark:opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(90deg, transparent 48%, rgba(59, 130, 246, 0.1) 48%, rgba(59, 130, 246, 0.1) 52%, transparent 52%),
            linear-gradient(transparent 48%, rgba(59, 130, 246, 0.1) 48%, rgba(59, 130, 246, 0.1) 52%, transparent 52%)
          `,
          backgroundSize: "30px 30px",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
        {/* Header con Logo y Botón Volver */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/10"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Ranking de Simulacros
            </h1>
          </div>

          <ThemeToggle />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="mt-4 text-blue-300">Cargando ranking...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel Izquierdo - Estadísticas */}
            <div className="lg:col-span-1 space-y-4">
              {/* Logo Grande */}
              <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl p-6 text-center shadow-lg shadow-slate-200/50 dark:shadow-slate-900/30">
                <Image
                  src="/logo.png"
                  alt="EduSentri"
                  width={120}
                  height={120}
                  className="mx-auto drop-shadow-2xl mb-4"
                />
                <p className="text-blue-600 dark:text-blue-300 text-xl font-bold">
                  Plataforma de Simulacros
                </p>
              </div>

              {/* Tarjetas de Estadísticas */}
              <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl p-5 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/30">
                <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-300 uppercase tracking-wider mb-4">
                  Estadísticas
                </h3>

                <div className="space-y-4">
                  {/* Total Participantes */}
                  <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                    <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                      <Users className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {totalParticipantes}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-300">
                        Participantes
                      </p>
                    </div>
                  </div>

                  {/* Mejor Puntaje */}
                  <div className="flex items-center gap-4 p-3 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl border border-yellow-200 dark:border-yellow-500/20">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg">
                      <Trophy className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {mejorPuntaje}
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-300">
                        Mejor Puntaje
                      </p>
                    </div>
                  </div>

                  {/* Promedio */}
                  <div className="flex items-center gap-4 p-3 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-200 dark:border-green-500/20">
                    <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-500 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        {promedioPuntaje}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-300">
                        Promedio General
                      </p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-200 dark:border-purple-500/20">
                    <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                      <Target className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">
                        100
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-300">
                        Puntaje Máximo
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Derecho - Lista de Participantes */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-slate-900/30">
                <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                    Top Participantes
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchRanking(true)}
                    disabled={refreshing}
                    className="gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/10"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                    {refreshing ? "Actualizando..." : "Recargar"}
                  </Button>
                </div>

                {ranking.length === 0 ? (
                  <div className="text-center py-16">
                    <Trophy className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                      Aún no hay participantes
                    </p>
                    <p className="text-slate-500 text-sm mt-2">
                      ¡Sé el primero en completar la prueba!
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    <div className="divide-y divide-slate-100 dark:divide-white/5">
                      {ranking.map((user, index) => (
                        <div
                          key={user.id}
                          className={`flex items-center gap-4 p-4 transition-all duration-200 ${getPositionStyle(index + 1)}`}
                        >
                          {/* Posición */}
                          <div
                            className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                            ${
                              index < 3
                                ? "bg-linear-to-br from-white/20 to-white/5 text-white"
                                : "bg-slate-700/50 text-slate-400"
                            }
                          `}
                          >
                            {getMedalIcon(index + 1) || index + 1}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-800 dark:text-white truncate">
                              {user.nombre}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {new Date(user.creado).toLocaleDateString(
                                "es-ES",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>

                          {/* Puntaje */}
                          <div className="text-right">
                            <div
                              className={`text-xl font-bold ${
                                index === 0
                                  ? "text-yellow-400"
                                  : index === 1
                                    ? "text-gray-300"
                                    : index === 2
                                      ? "text-amber-400"
                                      : "text-blue-400"
                              }`}
                            >
                              {user.puntaje}
                            </div>
                            <p className="text-xs text-slate-500">pts</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
