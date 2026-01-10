"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Target, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import type { IntentoHistorico } from "@/types/pregunta";
import { calcularEstadisticas } from "@/lib/historial";
import {
  coloresPorDisciplina,
  iconosPorArea,
  coloresPorArea,
  getTextColorClass,
  getBackgroundClasses,
} from "@/lib/dashboard-constants";

interface EstadisticasDashboardProps {
  historial: IntentoHistorico[];
  modo?: "pruebas" | "practicas";
}

export function EstadisticasDashboard({
  historial,
  modo = "pruebas",
}: EstadisticasDashboardProps) {
  const stats = calcularEstadisticas(historial);
  const [statsMastery, setStatsMastery] = useState<Record<
    string,
    number
  > | null>(null);
  const [loadingAreas, setLoadingAreas] = useState(false);

  useEffect(() => {
    const cargarMastery = async () => {
      setLoadingAreas(true);
      if (modo === "pruebas") {
        const { obtenerEstadisticasMastery } = await import(
          "@/services/intentos"
        );
        const mastery = await obtenerEstadisticasMastery();
        if (mastery) setStatsMastery(mastery);
      }
      setLoadingAreas(false);
    };
    cargarMastery();
  }, [historial, modo]);

  // Sobrescribir promedios con mastery
  if (modo === "pruebas" && statsMastery) {
    stats.promediosPorArea = statsMastery;
  }

  // Recalcular Mejor Puntaje
  if (historial.length > 0) {
    const mejorIntento = [...historial].sort((a, b) => {
      if (b.porcentaje !== a.porcentaje) return b.porcentaje - a.porcentaje;
      if (b.totalPreguntas !== a.totalPreguntas)
        return b.totalPreguntas - a.totalPreguntas;
      return b.fecha.getTime() - a.fecha.getTime();
    })[0];
    stats.mejorPuntaje = mejorIntento.porcentaje;
  }

  if (stats.totalIntentos === 0) {
    return (
      <Card className="mb-6 sm:mb-8">
        <CardContent className="pt-6 text-center py-8 sm:py-12">
          <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-base sm:text-lg font-medium mb-2">
            Aún no hay estadísticas
          </p>
          <p className="text-sm sm:text-base text-muted-foreground">
            {modo === "practicas"
              ? "Completa tu primera práctica para ver tu progreso"
              : "Completa tu primera prueba para ver tu progreso"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const datosPorArea =
    modo === "practicas" && stats.mejoresPorArea
      ? stats.mejoresPorArea
      : stats.promediosPorArea;

  const tituloPorArea =
    modo === "practicas" ? "Mejor por Área" : "Rendimiento por Área";

  // Configuración de Tarjetas de Resumen
  const summaryCards = [
    {
      title: modo === "practicas" ? "Prácticas Realizadas" : "Intentos Totales",
      value: stats.totalIntentos.toString(),
      icon: BarChart3,
      theme: {
        border: "border-blue-100 dark:border-blue-900/50",
        bg: "bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-900/10 dark:to-background",
        iconContainer:
          "bg-blue-100 dark:bg-blue-900/30 ring-blue-50 dark:ring-blue-900/20",
        icon: "text-blue-600 dark:text-blue-400",
        subtext: "text-blue-600/80 dark:text-blue-400/80",
      },
    },
    {
      title: modo === "practicas" ? "Precisión Promedio" : "Promedio General",
      value: `${stats.promedioGeneral.toFixed(1)}%`,
      icon: Target,
      theme: {
        border: "border-violet-100 dark:border-violet-900/50",
        bg: "bg-gradient-to-br from-violet-50/50 to-white dark:from-violet-900/10 dark:to-background",
        iconContainer:
          "bg-violet-100 dark:bg-violet-900/30 ring-violet-50 dark:ring-violet-900/20",
        icon: "text-violet-600 dark:text-violet-400",
        subtext: "text-violet-600/80 dark:text-violet-400/80",
      },
    },
    {
      title: "Mejor Puntuación",
      value: `${stats.mejorPuntaje.toFixed(1)}%`,
      icon: Award,
      theme: {
        border: "border-emerald-100 dark:border-emerald-900/50",
        bg: "bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-900/10 dark:to-background",
        iconContainer:
          "bg-emerald-100 dark:bg-emerald-900/30 ring-emerald-50 dark:ring-emerald-900/20",
        icon: "text-emerald-600 dark:text-emerald-400",
        subtext: "text-emerald-600/80 dark:text-emerald-400/80",
      },
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">
          Progreso {modo === "practicas" ? "Estudios" : "Pruebas"}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Estadísticas generales de tus{" "}
          {modo === "practicas" ? "estudios" : "pruebas"}
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
        {summaryCards.map((card, idx) => (
          <Card
            key={idx}
            className={`relative overflow-hidden shadow-sm hover:shadow-md transition-shadow ${card.theme.border} ${card.theme.bg}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl shrink-0 ring-4 ${card.theme.iconContainer}`}
                >
                  <card.icon className={`w-6 h-6 ${card.theme.icon}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                    {card.value}
                  </p>
                  <p className={`text-sm font-medium ${card.theme.subtext}`}>
                    {card.title}
                  </p>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-5 dark:opacity-10">
                <card.icon className="w-32 h-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div
        className={`grid gap-6 ${
          modo === "practicas" ? "lg:grid-cols-2" : "lg:grid-cols-1"
        }`}
      >
        {/* Estadísticas por Área */}
        {loadingAreas ? (
          <Card className="flex items-center justify-center p-12 border-dashed bg-muted/20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground font-medium animate-pulse">
                Analizando rendimiento por área...
              </p>
            </div>
          </Card>
        ) : (
          Object.keys(datosPorArea).length > 0 && (
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <BarChart3 className="w-5 h-5 text-primary/80" />
                  {tituloPorArea}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(datosPorArea).map(([area, valor]) => {
                    const Icon =
                      iconosPorArea[area as keyof typeof iconosPorArea];
                    const areaColors =
                      coloresPorArea[area as keyof typeof coloresPorArea];
                    const textColorClass = getTextColorClass(valor);
                    const { bg, border } = getBackgroundClasses(valor);

                    return (
                      <div
                        key={area}
                        className={`${bg} border ${border} space-y-3 group p-3.5 rounded-xl hover:shadow-sm transition-all`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {Icon && (
                              <div
                                className="p-1.5 rounded-md bg-white/60 dark:bg-slate-800 shadow-sm"
                                style={{ color: areaColors?.progressHex }}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                            )}
                            <span className="font-medium text-sm text-slate-700 dark:text-slate-300 truncate">
                              {area}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-bold ${textColorClass}`}
                          >
                            {valor.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-white/60 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${valor}%`,
                              backgroundColor: areaColors?.progressHex,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* Mejores por Disciplina (Solo modo prácticas) */}
        {modo === "practicas" &&
          stats.mejoresPorDisciplina &&
          Object.keys(stats.mejoresPorDisciplina).length > 0 && (
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Award className="w-5 h-5 text-amber-500" />
                  Mejor por Disciplina
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(stats.mejoresPorDisciplina)
                    .sort(([, a], [, b]) => b - a)
                    .map(([disciplina, puntaje], index) => {
                      const colors = coloresPorDisciplina[disciplina] || {
                        bg: "bg-slate-50",
                        border: "border-slate-200",
                        text: "text-slate-700",
                        progressHex: "#94a3b8",
                      };

                      return (
                        <div
                          key={disciplina}
                          className={`${colors.bg} border ${colors.border} flex flex-col gap-2 p-3.5 rounded-xl dark:bg-slate-900/45 dark:border-slate-800/50 hover:shadow-sm transition-all`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {index < 3 && (
                                <span className="text-lg">
                                  {["🥇", "🥈", "🥉"][index]}
                                </span>
                              )}
                              <span
                                className={`font-medium text-sm ${colors.text} dark:text-slate-300 truncate`}
                                title={disciplina}
                              >
                                {disciplina}
                              </span>
                            </div>
                            <span
                              className={`text-sm font-bold shrink-0 ${colors.text} dark:text-white bg-white/60 dark:bg-slate-800 px-2 py-0.5 rounded-full`}
                            >
                              {puntaje.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-white/60 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${puntaje}%`,
                                backgroundColor: colors.progressHex,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
      </div>

      {/* Historial */}
      {historial.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center justify-between">
              <span>
                Historial de mejores{" "}
                {modo === "practicas" ? "Prácticas" : "Intentos"}
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {historial.length}{" "}
                {historial.length === 1
                  ? modo === "practicas"
                    ? "práctica"
                    : "intento"
                  : modo === "practicas"
                  ? "prácticas"
                  : "intentos"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {historial
                .slice()
                .reverse()
                .map((intento) => {
                  const { bg, border } = getBackgroundClasses(
                    intento.porcentaje
                  );
                  const textColorClass = getTextColorClass(intento.porcentaje);

                  return (
                    <div
                      key={intento.id}
                      className={`flex items-center justify-between p-4 ${bg} border ${border} rounded-xl gap-4 hover:shadow-sm transition-all group`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">
                          {intento.disciplina
                            ? `${
                                intento.area ? intento.area.split(" ")[0] : ""
                              } - ${intento.disciplina}`
                            : intento.tipo === "general"
                            ? "Prueba General"
                            : intento.area || "Práctica"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {intento.fecha.toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-lg sm:text-xl font-bold ${textColorClass}`}
                        >
                          {intento.porcentaje.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {intento.correctas}/{intento.totalPreguntas}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
