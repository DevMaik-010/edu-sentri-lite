"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { RespuestaUsuario, PreguntaUI } from "@/types/pregunta";
import { QuestionCard } from "@/components/question-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle, Grid3x3 } from "lucide-react";
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
import { Eye, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function PruebaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [preguntas, setPreguntas] = useState<PreguntaUI[]>([]);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestaUsuario[]>([]);
  const [loading, setLoading] = useState(true);

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
      newTimeLeft: number
    ) => {
      saveActiveSession({
        tipo: "general",
        area: null,
        preguntas: newPreguntas,
        respuestas: newRespuestas,
        preguntaActual: newIndex,
        timeLeft: newTimeLeft,
        timestamp: Date.now(),
      });
    },
    []
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

  // Persist session periodically
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
        const initialTime = 7200;

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
          currentPregunta.texto_lectura_id!
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
      (r) => r.preguntaId !== preguntaId
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
      const dataToEncrypt = {
        preguntas,
        tipo: "general", // Force general as strictly required
        timestamp: Date.now(),
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
    (r) => r.preguntaId === preguntas[preguntaActual].id
  )?.respuestaSeleccionada;
  const mostrarRespuesta = false;

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <div className="container h-screen mx-auto px-4 py-4 sm:py-8 flex flex-col">
        {/* 🔝 PROGRESO (FIJO ARRIBA) */}
        <div className=" sm:mb-6 animate-in fade-in slide-in-from-top-1 duration-500 shrink-0">
          <div className="flex flex-col gap-2">
            <div
              className={`text-center font-mono font-bold text-xl ${
                timeLeft < 300 ? "text-red-500 animate-pulse" : "text-primary"
              }`}
            >
              {formatTime(timeLeft)}
            </div>
            {/* PROGRESO */}
            <div className="mb-4 sm:mb-6 shrink-0">
              <Progress value={progreso} className="h-2" />

              <div className="flex justify-between mt-1 text-sm text-muted-foreground items-center">
                <span>Pregunta {currentIndex + 1}</span>
                {/* Botón ver texto individual si la pregunta lo requiere */}
                {preguntas[preguntaActual]?.texto_lectura_id && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTextoDialog(true)}
                      className="h-6 sm:h-8 gap-2 text-purple-600 border-purple-600 hover:bg-purple-200/70 hover:text-purple-600
                        hover:border-purple-600 transition-colors text-xs font-medium cursor-pointer"
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
          />
        </div>

        {/* 🔽 BOTONES (SIEMPRE ABAJO) */}
        <div className="mt-4 flex items-stretch gap-3 shrink-0">
          <Button
            variant="outline"
            size="lg"
            onClick={handleAnterior}
            disabled={preguntaActual === 0}
            className="gap-2 bg-card h-12 transition-all duration-200 hover:scale-102 flex-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Anterior</span>
            <span className="sm:hidden">Atrás</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowNavigatorDialog(true)}
            className="gap-2 bg-card h-12 transition-all duration-200 hover:scale-102 border-primary/50 text-primary hover:bg-primary/10 cursor-pointer max-w-14"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>

          {preguntaActual === preguntas.length - 1 ? (
            <Button
              size="lg"
              onClick={handleFinalizar}
              disabled={respuestas.length !== preguntas.length}
              className="gap-2 h-12 transition-all duration-200 hover:scale-102 flex-1"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Finalizar Prueba</span>
              <span className="sm:hidden">Finalizar</span>
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleSiguiente}
              className="gap-2 h-12 transition-all duration-200 hover:scale-102 flex-1"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">Continuar</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* ℹ️ ESTADO */}
        <div className="mt-3 sm:mt-4 text-center shrink-0">
          {respuestas.length === preguntas.length ? (
            <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 animate-in fade-in duration-500">
              ✓ ¡Has respondido todas las preguntas! Puedes finalizar.
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground">
              {respuestas.length} de {preguntas.length} respondidas
            </p>
          )}
        </div>
      </div>

      {/* AlertDialog para mostrar texto de lectura */}
      <AlertDialog open={showTextoDialog} onOpenChange={setShowTextoDialog}>
        <AlertDialogContent className="max-h-[90vh] min-w-[60vw] max-w-[90vw] overflow-hidden flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
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
        <AlertDialogContent className="max-w-[80vw] max-h-[80vh] overflow-hidden flex flex-col">
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
                  (r) => r.preguntaId === pregunta.id
                );
                const isCurrent = index === preguntaActual;

                return (
                  <button
                    key={pregunta.id}
                    onClick={() => handleGoToQuestion(index)}
                    className={`relative aspect-square rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all hover:scale-110 ${
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                        : isAnswered
                        ? "border-green-500 bg-green-500 text-white hover:bg-green-600"
                        : "border-orange-400 bg-orange-50 text-orange-700 hover:bg-orange-100"
                    } cursor-pointer`}
                  >
                    {index + 1}
                    {!isAnswered && !isCurrent && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></span>
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
              <div className="w-6 h-6 rounded bg-orange-50 border-2 border-orange-400 relative">
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
