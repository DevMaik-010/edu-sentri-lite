"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import type { RespuestaUsuario, PreguntaUI } from "@/types/pregunta";
import { QuestionCard } from "@/components/question-card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Grid3x3,
  Eye,
  BookOpen,
} from "lucide-react";
import { obtenerPreguntasGenerales } from "@/services/preguntas";
import { encryptData } from "@/lib/crypto";
import { LoadingLottie } from "@/components/loading-lottie";
import {
  getActiveSession,
  saveActiveSession,
  clearActiveSession,
} from "@/lib/local-storage";
import { obtenerTextoLecturaPorId } from "@/services/textos-lectura";
import type { TextoLectura } from "@/types/textos-lectura";
import ReactMarkdown from "react-markdown";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Theme Configuration
type TimeTheme = "morning" | "afternoon" | "night";

const THEMES = {
  morning: {
    background: "bg-[#EAF6FF]", // Fallback
    pattern: "cross-grid",
    style: {
      backgroundImage: `
        linear-gradient(90deg, transparent 48%, rgba(126, 200, 227, 0.25) 48%, rgba(126, 200, 227, 0.25) 52%, transparent 52%),
        linear-gradient(transparent 48%, rgba(126, 200, 227, 0.25) 48%, rgba(126, 200, 227, 0.25) 52%, transparent 52%)
      `,
      backgroundSize: "30px 30px",
      backgroundColor: "#EAF6FF",
    },
    accent: "text-[#0284C7]", // Darker blue
    accentBorder: "border-[#7EC8E3]",
    glass: "bg-white/70 backdrop-blur-md border border-white/40 shadow-xl", // Light Glass
    text: "text-slate-900", // Dark text
    button:
      "bg-gradient-to-r from-[#38BDF8] to-[#0284C7] text-white hover:opacity-90 shadow-md transform transition-all duration-200 hover:scale-[1.02]",
    buttonOutline:
      "border-[#0284C7] text-[#0284C7] hover:bg-[#0284C7]/10 bg-white/40 backdrop-blur-sm",
    progress: "bg-[#0284C7]",
    progressBg: "bg-[#7EC8E3]/20",
  },
  afternoon: {
    background: "bg-[#FFF1E6]", // Fallback
    pattern: "cross-grid",
    style: {
      backgroundImage: `
        linear-gradient(90deg, transparent 48%, rgba(255, 214, 165, 0.25) 48%, rgba(255, 214, 165, 0.25) 52%, transparent 52%),
        linear-gradient(transparent 48%, rgba(255, 214, 165, 0.25) 48%, rgba(255, 214, 165, 0.25) 52%, transparent 52%)
      `,
      backgroundSize: "30px 30px",
      backgroundColor: "#FFF1E6",
    },
    accent: "text-[#D97706]", // Darker orange
    accentBorder: "border-[#FF9F68]",
    glass: "bg-white/70 backdrop-blur-md border border-white/40 shadow-xl", // Light Glass
    text: "text-slate-900", // Dark text
    button:
      "bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white hover:opacity-90 shadow-md transform transition-all duration-200 hover:scale-[1.02]",
    buttonOutline:
      "border-[#EA580C] text-[#EA580C] hover:bg-[#EA580C]/10 bg-white/40 backdrop-blur-sm",
    progress: "bg-[#EA580C]",
    progressBg: "bg-[#FF9F68]/20",
  },
  night: {
    background: "bg-[#0F172A]", // Fallback
    pattern: "cross-grid",
    style: {
      backgroundImage: `
        linear-gradient(90deg, transparent 48%, rgba(56, 189, 248, 0.1) 48%, rgba(56, 189, 248, 0.1) 52%, transparent 52%),
        linear-gradient(transparent 48%, rgba(56, 189, 248, 0.1) 48%, rgba(56, 189, 248, 0.1) 52%, transparent 52%)
      `,
      backgroundSize: "30px 30px",
      backgroundColor: "#0F172A",
    },
    accent: "text-[#38BDF8]",
    accentBorder: "border-[#38BDF8]",
    glass: "bg-white/90 backdrop-blur-md border border-white/40 shadow-xl", // High opacity light glass for contrast against dark background
    text: "text-slate-900", // Dark text needed on light card
    button:
      "bg-gradient-to-r from-[#38BDF8] to-[#0284C7] text-white hover:opacity-90 shadow-[0_0_15px_rgba(56,189,248,0.3)] transform transition-all duration-200 hover:scale-[1.02]",
    buttonOutline:
      "border-[#38BDF8] text-[#38BDF8] hover:bg-[#38BDF8]/10 bg-slate-900/40 backdrop-blur-sm hover:text-[#38BDF8]",
    progress: "bg-[#130D2E]",
    progressBg: "bg-[#130D2E]/20",
  },
};

export default function PruebaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [preguntas, setPreguntas] = useState<PreguntaUI[]>([]);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestaUsuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Theme State
  const [currentTheme, setCurrentTheme] = useState<TimeTheme>("morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) setCurrentTheme("morning");
    else if (hour >= 12 && hour < 19) setCurrentTheme("afternoon");
    else setCurrentTheme("night");
  }, []);

  const theme = THEMES[currentTheme];

  // States for reading comprehension text
  const [showTextoDialog, setShowTextoDialog] = useState(false);
  const [showNavigatorDialog, setShowNavigatorDialog] = useState(false);
  const [textoActual, setTextoActual] = useState<TextoLectura | null>(null);

  // Derived states
  const currentIndex = preguntaActual;
  const progreso =
    preguntas.length > 0 ? ((preguntaActual + 1) / preguntas.length) * 100 : 0;

  // Timer state (2 hours = 7200 seconds)
  const [timeLeft, setTimeLeft] = useState(7200);

  // Helper to save session state
  const persistSession = useCallback(
    (
      newPreguntas: PreguntaUI[],
      newRespuestas: RespuestaUsuario[],
      newIndex: number,
      newTimeLeft: number,
    ) => {
      // MEMORY ONLY: Do not save to localStorage
      /*
      saveActiveSession({
        tipo: "general",
        area: null,
        preguntas: newPreguntas,
        respuestas: newRespuestas,
        preguntaActual: newIndex,
        timeLeft: newTimeLeft,
        timestamp: Date.now(),
      });
      */
    },
    [],
  );

  // Save timer every 10 seconds to avoid excessive writing
  useEffect(() => {
    if (loading || preguntas.length === 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          clearInterval(interval);
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, preguntas.length]);

  // MEMORY ONLY: Disable persistence to avoid saving questions to localStorage
  /*
  useEffect(() => {
    if (loading || preguntas.length === 0) return;
    const timerSave = setInterval(() => {
      persistSession(preguntas, respuestas, preguntaActual, timeLeft);
    }, 5000);
    return () => clearInterval(timerSave);
  }, [
    loading,
    preguntas,
    respuestas,
    preguntaActual,
    timeLeft,
    persistSession,
  ]);
  */

  // Add warning on reload/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (preguntas.length > 0 && respuestas.length < preguntas.length) {
        e.preventDefault();
        e.returnValue = ""; // Standard for modern browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [preguntas.length, respuestas.length]);

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const cargarPreguntas = async () => {
      setLoading(true);

      const isRetry = searchParams.get("retry") === "true";

      // 0. Si es Retry (ej. carga de archivo), priorizar sessionStorage
      if (isRetry) {
        const sessionData = sessionStorage.getItem("session_test_data");
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            setPreguntas(parsed.preguntas);
            setRespuestas([]); // Reset respuestas
            setPreguntaActual(0); // Reset index
            setTimeLeft(parsed.tiempoRestante || 7200); // Reset time (default 2h)

            // Limpiar sesión local antigua para evitar conflictos
            clearActiveSession("general", null);

            // Sync userCode if present in file
            if (parsed.userCode) {
              localStorage.setItem("user_code", parsed.userCode);
            }

            // MEMORY ONLY: Clear the source data from storage
            // Delayed to avoid "Session Expired" in React Strict Mode (Dev) where effects run twice
            setTimeout(() => {
              sessionStorage.removeItem("session_test_data");
            }, 2000);

            setLoading(false);
            return;
          } catch (e) {
            console.error("Error parsing session data", e);
            toast.error("Error al procesar el archivo. Intente nuevamente.");
            router.push("/");
            return;
          }
        } else {
          // STRICT MODE: If retry is requested but data is gone (e.g. refresh in memory-only mode),
          // do NOT fall back to generating a new test. Force user to re-upload.
          console.warn("Retry requested but no session data found.");
          toast.error(
            "Sesión expirada. Por favor cargue el archivo nuevamente.",
          );
          router.push("/");
          return;
        }
      }

      // 1. Intentar cargar sesión activa (continuar donde se dejó)
      // Siempre buscamos sesión "general"
      const session = getActiveSession("general", null);

      if (session && session.preguntas.length > 0) {
        setPreguntas(session.preguntas);
        setRespuestas(session.respuestas);
        setPreguntaActual(session.preguntaActual);
        if (session.timeLeft !== undefined) {
          setTimeLeft(session.timeLeft);
        }
        setLoading(false);
        return;
      }

      // 2. Si no hay sesión, cargar nuevas preguntas GENERALES
      try {
        const preguntasCargadas = await obtenerPreguntasGenerales();
        setPreguntas(preguntasCargadas);
        // Default General: 2h
        const initialTime = 7200; // 2 horas en segundos 7200, 1 min 60

        setTimeLeft(initialTime);
        persistSession(preguntasCargadas, [], 0, initialTime);
      } catch (error) {
        console.error("Error al cargar preguntas:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarPreguntas();
  }, [persistSession]);

  // Effect to load text when question changes
  useEffect(() => {
    const currentPregunta = preguntas[preguntaActual];
    if (!currentPregunta?.texto_lectura_id) {
      setTextoActual(null);
      return;
    }

    const loadText = async () => {
      if (textoActual?.id === currentPregunta.texto_lectura_id) return;

      try {
        const cacheKey = `texto_content_${currentPregunta.texto_lectura_id}`;
        const cachedText = localStorage.getItem(cacheKey);

        if (cachedText) {
          const parsed = JSON.parse(cachedText);
          setTextoActual(parsed);
          return;
        }

        const texto = await obtenerTextoLecturaPorId(
          currentPregunta.texto_lectura_id!,
        );
        if (texto) {
          setTextoActual(texto);
          localStorage.setItem(cacheKey, JSON.stringify(texto));
        }
      } catch (error) {
        console.error("Error loading text:", error);
      }
    };
    loadText();
  }, [preguntas, preguntaActual, textoActual]);

  const handleSeleccionarRespuesta = (respuesta: string) => {
    const preguntaId = preguntas[preguntaActual].id;
    const respuestasActualizadas = respuestas.filter(
      (r) => r.preguntaId !== preguntaId,
    );
    respuestasActualizadas.push({
      preguntaId,
      respuestaSeleccionada: respuesta,
    });
    setRespuestas(respuestasActualizadas);
    persistSession(preguntas, respuestasActualizadas, preguntaActual, timeLeft);
  };

  const handleAnterior = () => {
    if (preguntaActual > 0) {
      const newIndex = preguntaActual - 1;
      setPreguntaActual(newIndex);
      persistSession(preguntas, respuestas, newIndex, timeLeft);
    }
  };

  const handleSiguiente = () => {
    if (preguntaActual < preguntas.length - 1) {
      const newIndex = preguntaActual + 1;
      setPreguntaActual(newIndex);
      persistSession(preguntas, respuestas, newIndex, timeLeft);
    }
  };

  const handleGoToQuestion = (index: number) => {
    setPreguntaActual(index);
    persistSession(preguntas, respuestas, index, timeLeft);
    setShowNavigatorDialog(false);
  };

  const handleDownload = async () => {
    try {
      const userCode =
        localStorage.getItem("user_code") ||
        sessionStorage.getItem("user_code");

      const dataToEncrypt = {
        preguntas,
        tipo: "general", // Force general as strictly required
        timestamp: Date.now(),
        userCode, // Include user code in the encrypted file
      };

      const encrypted = await encryptData(dataToEncrypt);

      const blob = new Blob([encrypted], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prueba_edu_sentri_${Date.now()}.esl`; // esl = edu sentri lite
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error encrypting download:", error);
    }
  };

  // Auto-download effect
  const downloadedRef = useRef(false);
  useEffect(() => {
    const shouldDownload = searchParams?.get("download") === "true";
    if (shouldDownload && preguntas.length > 0 && !downloadedRef.current) {
      downloadedRef.current = true;
      // Small delay to ensure state is settled? Not strictly necessary but safe.
      setTimeout(() => {
        handleDownload();
      }, 500);
    }
  }, [preguntas, searchParams]);

  /* ───────────────── FINALIZAR ───────────────── */

  const [isCalculating, setIsCalculating] = useState(false);

  const handleFinalizar = async () => {
    setIsCalculating(true);
    // Usar localStorage temporalmente para pasar datos a la página de resultados
    localStorage.setItem("temp_preguntas", JSON.stringify(preguntas));
    localStorage.setItem("temp_respuestas", JSON.stringify(respuestas));
    localStorage.setItem("temp_tipo", "general");

    // Limpiar la sesión activa para que la próxima vez genere una nueva
    clearActiveSession("general", null);

    router.push("/resultados");
  };

  if (isCalculating) {
    return <LoadingLottie message="Calculando resultados..." />;
  }

  if (loading) {
    return <LoadingLottie size={150} />;
  }

  if (preguntas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-xl font-medium text-muted-foreground">
          No se pudieron cargar las preguntas.
        </p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  const respuestaActual = respuestas.find(
    (r) => r.preguntaId === preguntas[preguntaActual].id,
  )?.respuestaSeleccionada;
  const mostrarRespuesta = false;

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col transition-colors duration-1000",
        theme.background,
      )}
      style={theme.style}
    >
      <div className="container h-screen mx-auto px-4 py-4 sm:py-8 flex flex-col">
        {/* 🔝 PROGRESO (FIJO ARRIBA) */}
        <div className=" sm:mb-6 animate-in fade-in slide-in-from-top-1 duration-500 shrink-0">
          <div className="flex flex-col gap-2">
            <div
              className={`text-center font-mono font-bold text-xl drop-shadow-sm text-white ${
                timeLeft < 300 ? "text-red-500 animate-pulse" : theme.text
              }`}
            >
              {formatTime(timeLeft)}
            </div>
            {/* PROGRESO */}
            <div
              className={cn(
                "mb-4 sm:mb-6 shrink-0 rounded-2xl p-4 transition-all duration-300 ",
                theme.glass,
              )}
            >
              <Progress
                value={progreso}
                className={cn("h-2.5", theme.progressBg)}
                indicatorClassName={theme.progress}
              />

              <div
                className={cn(
                  "flex justify-between mt-2 text-sm font-bold items-center",
                  theme.text,
                )}
              >
                <span>Pregunta {currentIndex + 1}</span>
                {/* Botón ver texto individual si la pregunta lo requiere */}
                {preguntas[preguntaActual]?.texto_lectura_id && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTextoDialog(true)}
                      className={cn(
                        "h-6 sm:h-8 gap-2 border text-xs font-semibold shadow-none",
                        theme.accentBorder,
                        theme.accent,
                        "hover:bg-white/20 bg-transparent",
                      )}
                    >
                      <Eye className="w-4 h-4" />
                      Ver Texto
                    </Button>
                  </div>
                )}

                <span>Total {preguntas.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🧠 CONTENEDOR DE LA PREGUNTA (SCROLL INTERNO) */}
        <div
          key={preguntaActual}
          className="flex-1 animate-in fade-in slide-in-from-right-4 duration-300 min-h-0 relative overflow-y-auto"
        >
          <QuestionCard
            pregunta={preguntas[preguntaActual]}
            numeroActual={preguntaActual + 1}
            total={preguntas.length}
            respuestaSeleccionada={respuestaActual}
            onSeleccionarRespuesta={handleSeleccionarRespuesta}
            mostrarRespuesta={mostrarRespuesta}
            theme={currentTheme}
            themeClasses={theme}
          />
        </div>

        {/* 🔽 BOTONES (SIEMPRE ABAJO) */}
        <div className="mt-4 flex items-stretch gap-3 shrink-0">
          <Button
            variant="outline"
            size="lg"
            onClick={handleAnterior}
            disabled={preguntaActual === 0}
            className={cn(
              "gap-2 h-12 transition-all duration-200 hover:scale-102 flex-1 font-semibold border cursor-pointer",
              theme.buttonOutline,
              preguntaActual === 0 &&
                "opacity-50 cursor-not-allowed hover:scale-100",
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Anterior</span>
            <span className="sm:hidden">Atrás</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowNavigatorDialog(true)}
            className={cn(
              "gap-2 h-12 transition-all duration-200 hover:scale-102 border cursor-pointer max-w-14",
              theme.buttonOutline,
            )}
          >
            <Grid3x3 className="w-5 h-5" />
          </Button>

          {preguntaActual === preguntas.length - 1 ? (
            <Button
              size="lg"
              onClick={handleFinalizar}
              disabled={respuestas.length !== preguntas.length}
              className={cn(
                "gap-2 h-12 flex-1 font-bold tracking-wide border-0 cursor-pointer",
                theme.button,
              )}
            >
              <CheckCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Finalizar Prueba</span>
              <span className="sm:hidden">Finalizar</span>
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleSiguiente}
              className={cn(
                "gap-2 h-12 flex-1 font-bold tracking-wide border-0 cursor-pointer",
                theme.button,
              )}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">Continuar</span>
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* ℹ️ ESTADO */}
        <div className="mt-3 sm:mt-4 text-center shrink-0">
          {respuestas.length === preguntas.length ? (
            <p className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 animate-in fade-in duration-500 bg-green-100/80 dark:bg-green-900/40 px-3 py-1 rounded-full inline-block backdrop-blur-sm">
              ✓ ¡Has respondido todas las preguntas! Puedes finalizar.
            </p>
          ) : (
            <p className={cn("text-xs sm:text-sm opacity-80", theme.text)}>
              {respuestas.length} de {preguntas.length} respondidas
            </p>
          )}
        </div>
      </div>

      {/* AlertDialog para mostrar texto de lectura */}
      <AlertDialog open={showTextoDialog} onOpenChange={setShowTextoDialog}>
        <AlertDialogContent className="max-h-[90vh] min-w-[60vw] max-w-[90vw] overflow-hidden flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="w-6 h-6 text-primary" />
              {textoActual?.titulo || "Texto de Lectura"}
            </AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              Texto de lectura para comprensión lectora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            {textoActual && (
              <div className="prose prose-base dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h2: ({ ...props }) => (
                      <h2
                        className="text-2xl font-bold mt-6 mb-4 text-foreground"
                        {...props}
                      />
                    ),
                    h3: ({ ...props }) => (
                      <h3
                        className="text-xl font-semibold mt-5 mb-3 text-foreground"
                        {...props}
                      />
                    ),
                    p: ({ ...props }) => (
                      <p
                        className="mb-4 leading-7 text-foreground/90"
                        {...props}
                      />
                    ),
                    ul: ({ ...props }) => (
                      <ul
                        className="my-4 ml-6 list-disc space-y-2"
                        {...props}
                      />
                    ),
                    ol: ({ ...props }) => (
                      <ol
                        className="my-4 ml-6 list-decimal space-y-2"
                        {...props}
                      />
                    ),
                    li: ({ ...props }) => (
                      <li className="leading-7" {...props} />
                    ),
                    strong: ({ ...props }) => (
                      <strong
                        className="font-semibold text-foreground"
                        {...props}
                      />
                    ),
                    em: ({ ...props }) => <em className="italic" {...props} />,
                  }}
                >
                  {textoActual.contenido}
                </ReactMarkdown>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para navegador de preguntas */}
      <AlertDialog
        open={showNavigatorDialog}
        onOpenChange={setShowNavigatorDialog}
      >
        <AlertDialogContent className="max-w-[80vw] max-h-[80vh] overflow-hidden flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-primary" />
              Navegador de Preguntas
            </AlertDialogTitle>
            <AlertDialogDescription>
              Haz clic en cualquier pregunta para navegar a ella. Las preguntas
              respondidas están marcadas en verde, las no respondidas en gris
              con advertencia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 py-4">
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 m-2">
              {preguntas.map((pregunta, index) => {
                const isAnswered = respuestas.some(
                  (r) => r.preguntaId === pregunta.id,
                );
                const isCurrent = index === preguntaActual;

                return (
                  <button
                    key={pregunta.id}
                    onClick={() => handleGoToQuestion(index)}
                    className={`relative aspect-square rounded-xl border flex items-center justify-center font-bold text-sm transition-all hover:scale-110 shadow-sm ${
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                        : isAnswered
                          ? "border-green-500 bg-green-500 text-white hover:bg-green-600"
                          : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                    } cursor-pointer`}
                  >
                    {index + 1}
                    {!isAnswered && !isCurrent && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white shadow-sm"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-500"></div>
              <span>Resp. ({respuestas.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-orange-50 border-2 border-orange-200 relative">
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
              </div>
              <span>Sin resp. ({preguntas.length - respuestas.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 border-primary bg-primary"></div>
              <span>Actual</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
