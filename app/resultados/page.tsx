"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  PreguntaUI,
  RespuestaUsuario,
  Resultado,
  Area,
} from "@/types/pregunta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Home,
  TrendingUp,
  Sparkles,
  RotateCcw,
  FileText,
} from "lucide-react";
import { guardarIntentoSupabase } from "@/services/intentos";
import { saveLocalHistory, addToReviewQueue } from "@/lib/local-storage";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export default function ResultadosPage() {
  const router = useRouter();
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [retryConfig, setRetryConfig] = useState<{
    tipo: string;
    area?: string | null;
  }>({ tipo: "general" });

  useEffect(() => {
    // 1. Intentar obtener datos desde localStorage temporal (flujo normal al terminar prueba)
    const preguntasStr = localStorage.getItem("temp_preguntas");
    const respuestasStr = localStorage.getItem("temp_respuestas");
    const tipoPrueba = localStorage.getItem("temp_tipo") || "general";
    const areaPrueba = localStorage.getItem("temp_area") || undefined;
    const disciplinaPrueba =
      localStorage.getItem("temp_disciplina") || undefined;

    // 2. Si no hay en localStorage, intentar recuperar de sessionStorage (flujo al volver/recargar)
    const sessionDataStr = sessionStorage.getItem("session_test_data");

    if (!preguntasStr && !sessionDataStr) {
      // Si no hay datos en ninguno de los dos sitios, redirigir
      router.push("/");
      return;
    }

    let preguntas: PreguntaUI[];
    let respuestas: RespuestaUsuario[];
    let tipo: string;
    let area: string | undefined | null;
    let disciplina: string | undefined;

    // Determinar origen de datos
    if (preguntasStr && respuestasStr) {
      // Caso A: Venimos de terminar una prueba (LocalStorage)
      preguntas = JSON.parse(preguntasStr);
      respuestas = JSON.parse(respuestasStr);
      tipo = tipoPrueba;
      area = areaPrueba;
      disciplina = disciplinaPrueba;

      // Guardar en sessionStorage para persistencia
      sessionStorage.setItem(
        "session_test_data",
        JSON.stringify({
          preguntas,
          respuestas,
          tipo,
          area,
          disciplina,
        })
      );

      // Limpiar localStorage temporal
      localStorage.removeItem("temp_preguntas");
      localStorage.removeItem("temp_respuestas");
      localStorage.removeItem("temp_tipo");
      localStorage.removeItem("temp_area");
      localStorage.removeItem("temp_disciplina");

      // Solo guardar en Supabase si es un NUEVO intento (venimos de localStorage)
      guardarIntento(preguntas, respuestas, tipo, area, disciplina);
    } else if (sessionDataStr) {
      // Caso B: Recarga o navegación (SessionStorage)
      const sessionData = JSON.parse(sessionDataStr);
      preguntas = sessionData.preguntas;
      respuestas = sessionData.respuestas;
      tipo = sessionData.tipo;
      area = sessionData.area;
      disciplina = sessionData.disciplina;
    } else {
      return; // Should not happen due to check above
    }

    setRetryConfig({ tipo, area: area || null });

    // Calcular resultados
    let correctas = 0;
    const porArea: { [key: string]: { correctas: number; total: number } } = {};

    preguntas.forEach((pregunta) => {
      const respuesta = respuestas.find((r) => r.preguntaId === pregunta.id);
      const opcionCorrecta = pregunta.opciones.find((o) => o.es_correcta);
      const esCorrecta =
        respuesta?.respuestaSeleccionada === opcionCorrecta?.clave;

      if (esCorrecta) correctas++;

      // Guardar pregunta incorrecta para repaso (Local Storage) - Solo si venimos de nuevo intento
      if (!esCorrecta && preguntasStr) {
        addToReviewQueue(pregunta);
      }

      if (!porArea[pregunta.componentes?.nombre || "General"]) {
        porArea[pregunta.componentes?.nombre || "General"] = {
          correctas: 0,
          total: 0,
        };
      }
      porArea[pregunta.componentes?.nombre || "General"].total++;
      if (esCorrecta)
        porArea[pregunta.componentes?.nombre || "General"].correctas++;
    });

    const incorrectas = preguntas.length - correctas;
    const porcentaje = (correctas / preguntas.length) * 100;

    const resultadosPorArea = Object.entries(porArea).map(([area, stats]) => ({
      area: area as Area,
      correctas: stats.correctas,
      total: stats.total,
      porcentaje: (stats.correctas / stats.total) * 100,
    }));

    setResultado({
      totalPreguntas: preguntas.length,
      correctas,
      incorrectas,
      porcentaje,
      porArea: resultadosPorArea,
    });

    if (porcentaje >= 70) {
      setTimeout(() => setShowConfetti(true), 500);
    }
  }, [router]);

  // Función separada para guardar solo cuando sea necesario
  const guardarIntento = async (
    preguntas: PreguntaUI[],
    respuestas: RespuestaUsuario[],
    tipo: string,
    area?: string | null,
    disciplina?: string
  ) => {
    try {
      // Recalcular stats simples para el guardado
      let correctas = 0;
      preguntas.forEach((p) => {
        const r = respuestas.find((res) => res.preguntaId === p.id);
        const oq = p.opciones.find((o) => o.es_correcta);
        if (r?.respuestaSeleccionada === oq?.clave) correctas++;
      });
      const incorrectas = preguntas.length - correctas;
      const porcentaje = (correctas / preguntas.length) * 100;

      const result = await guardarIntentoSupabase({
        tipo,
        totalPreguntas: preguntas.length,
        correctas,
        incorrectas,
        porcentaje,
        disciplina,
        preguntas,
        respuestas,
      });

      if (result.success && result.intentoId) {
        // Actualizar el historial local si hubo una mejora
        if (result.mejorado) {
          saveLocalHistory({
            id: result.intentoId,
            fecha: new Date(),
            tipo,
            totalPreguntas: preguntas.length,
            correctas,
            incorrectas,
            porcentaje,
            disciplina,
          });
          console.log(
            "🎉 ¡Nuevo récord guardado! Has superado tu mejor intento anterior."
          );
        } else {
          console.log("📊 Intento completado. No superó el récord anterior.");
        }
      } else if (result.guardadoLocal && !result.success) {
        console.log(
          "⚠️ Error guardando en Supabase, pero se guardó localmente."
        );
      }
    } catch (error) {
      console.error("Error al guardar intento:", error);
    }
  };

  if (!resultado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          <p className="text-base sm:text-lg text-muted-foreground animate-pulse">
            Calculando resultados...
          </p>
        </div>
      </div>
    );
  }

  const getFeedback = (porcentaje: number) => {
    if (porcentaje >= 80) {
      return {
        title: "¡Impresionante!",
        message:
          "Has demostrado un dominio excepcional del contenido. ¡Sigue así, experto!",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        icon: Sparkles,
      };
    } else if (porcentaje >= 60) {
      return {
        title: "¡Buen Trabajo!",
        message:
          "Vas por buen camino, pero aún hay margen de mejora. ¡Tú puedes!",
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-200 dark:border-green-800",
        icon: CheckCircle2,
      };
    } else {
      return {
        title: "¡No te rindas!",
        message:
          "El aprendizaje es un proceso. Revisa tus errores y vuelve a intentarlo.",
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500 dark:border-purple-800",
        icon: TrendingUp,
      };
    }
  };

  const feedback = resultado ? getFeedback(resultado.porcentaje) : null;
  const FeedbackIcon = feedback?.icon || Home;

  // Circular Progress Component
  const CircularProgress = ({
    value,
    size = 180,
    strokeWidth = 15,
    colorClass = "text-primary",
  }: {
    value: number;
    size?: number;
    strokeWidth?: number;
    colorClass?: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            className="text-muted/20"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in duration-500 delay-300">
          <span className={`text-4xl sm:text-5xl font-bold ${colorClass}`}>
            {Math.round(value)}%
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-semibold mt-1">
            Puntuación
          </span>
        </div>
      </div>
    );
  };

  const getRetryUrl = (config: { tipo: string; area?: string | null }) => {
    if (config.tipo === "practica") {
      // Para práctica, redirigir a la configuración de práctica
      return `/estudiar/practica?area=${encodeURIComponent(
        config.area || "Comprensión Lectora"
      )}`;
    }

    if (config.tipo === "ia") {
      return "/ia/preguntas";
    }

    // Para pruebas (general, area, demo)
    const baseUrl = "/prueba";
    let url = `${baseUrl}?tipo=${config.tipo}`;

    if (config.area) {
      url += `&area=${encodeURIComponent(config.area)}`;
    }

    return url;
  };

  // Handler para "Revisar" - navegar a página de revisión
  const handleReview = () => {
    router.push("/resultados/revision");
  };

  // Handler para "Intentar de Nuevo" - cargar las mismas preguntas
  const handleTryAgain = () => {
    const url = getRetryUrl(retryConfig);
    router.push(`${url}${url.includes("?") ? "&" : "?"}retry=true`);
  };

  // Handler para "Nuevo Simulacro" - limpiar sesión y cargar nuevas preguntas
  const handleNewTest = () => {
    sessionStorage.removeItem("session_test_data");
    router.push(getRetryUrl(retryConfig));
  };

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 relative overflow-hidden">
      {/* Confetti container (existing logic) */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <Sparkles className="w-4 h-4 sm:w-10 sm:h-10 text-primary" />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col h-screen items-center justify-center w-full p-6">
        <div className="flex flex-col items-center justify-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          {/* Main Score Card */}
          <Card
            className={`w-full max-w-2xl border-2 shadow-xl ${feedback?.borderColor} bg-card/50 backdrop-blur-sm overflow-hidden`}
          >
            <div
              className={`h-2 w-full ${feedback?.bgColor.replace("/10", "")}`}
            />
            <CardContent className="flex flex-col items-center text-center gap-6">
              <div
                className={`p-4 rounded-full ${feedback?.bgColor} mb-2 animate-bounce`}
              >
                <FeedbackIcon className={`w-12 h-12 ${feedback?.color}`} />
              </div>

              <div className="space-y-2">
                <h1
                  className={`text-3xl sm:text-4xl font-bold ${feedback?.color}`}
                >
                  {feedback?.title}
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto text-balance leading-relaxed">
                  {feedback?.message}
                </p>
              </div>

              <div className="py-2">
                <CircularProgress
                  value={resultado.porcentaje}
                  colorClass={feedback?.color || "text-primary"}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div
          className={`grid gap-4 mb-8 w-full max-w-3xl px-4 ${
            retryConfig.tipo === "demo"
              ? "grid-cols-1 sm:grid-cols-2"
              : "grid-cols-1 sm:grid-cols-3"
          }`}
        >
          <Button
            onClick={handleReview}
            className="cursor-pointer w-full h-14 sm:h-12 text-base sm:text-sm font-medium shadow-md hover:scale-[1.02] transition-all bg-primary hover:bg-primary/90"
          >
            <FileText className="mr-2 h-5 w-5" />
            Revisar
          </Button>
          {retryConfig.tipo !== "demo" && (
            <Button
              onClick={() => {
                if (retryConfig.tipo === "practica") {
                  handleNewTest();
                } else {
                  setShowRestartDialog(true);
                }
              }}
              variant="outline"
              className="cursor-pointer w-full h-14 sm:h-12 text-base sm:text-sm font-medium border-2 hover:bg-muted/50 hover:border-primary/50 transition-colors"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Nueva Prueba
            </Button>
          )}
          <Button
            onClick={() => router.push("/dashboard")}
            variant="outline"
            className="cursor-pointer w-full h-14 sm:h-12 text-base sm:text-sm font-medium border-2 hover:bg-muted/50 transition-colors"
          >
            <Home className="mr-2 h-5 w-5" />
            Inicio
          </Button>
        </div>
      </div>

      {/* AlertDialog for restart options */}
      <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-primary" />
              Nueva Prueba
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Cómo deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 py-4">
            <Button
              onClick={() => {
                setShowRestartDialog(false);
                handleNewTest();
              }}
              size="lg"
              className="h-16 flex flex-col gap-1 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">Nuevas Preguntas</span>
              <span className="text-xs opacity-90">
                Generar un nuevo examen
              </span>
            </Button>
            <Button
              onClick={() => {
                setShowRestartDialog(false);
                handleTryAgain();
              }}
              size="lg"
              variant="outline"
              className="h-16 flex flex-col gap-1 border-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="font-bold">Mismas Preguntas</span>
              <span className="text-xs opacity-70">Repetir este examen</span>
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
