"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { RespuestaUsuario, Area, PreguntaUI } from "@/types/pregunta";
import { QuestionCard } from "@/components/question-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle, Grid3x3 } from "lucide-react";
import {
  obtenerPreguntasPorArea,
  obtenerPreguntasAleatoriasPorArea,
} from "@/services/preguntas";
import { LoadingLottie } from "@/components/loading-lottie";
import {
  getActiveSession,
  saveActiveSession,
  clearActiveSession,
} from "@/lib/local-storage";
import { obtenerPruebaDemo, obtenerPruebaGeneral } from "@/services/simulacro";
import {
  obtenerTextoLecturaPorId,
  obtenerTextosAleatoriosConPreguntas,
} from "@/services/textos-lectura";
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
  const tipo = searchParams.get("tipo") || "general";
  const area = (searchParams.get("area") as Area) || null;

  const [preguntas, setPreguntas] = useState<PreguntaUI[]>([]);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<RespuestaUsuario[]>([]);
  const [loading, setLoading] = useState(true);

  // States for reading comprehension text
  const [showTextoDialog, setShowTextoDialog] = useState(false);
  const [showNavigatorDialog, setShowNavigatorDialog] = useState(false);

  // States for selected texts in Comprensión Lectora
  const [textosSeleccionados, setTextosSeleccionados] = useState<
    TextoLectura[]
  >([]);

  const [textoActual, setTextoActual] = useState<TextoLectura | null>(null);

  // Derived states
  const isComprensionLectora = area === "Comprensión Lectora";
  const currentIndex = preguntaActual;
  const progreso =
    preguntas.length > 0 ? ((preguntaActual + 1) / preguntas.length) * 100 : 0;

  // Timer state (2 hours = 7200 seconds)
  const [timeLeft, setTimeLeft] = useState(7200);
  const [tiempoSeleccionado, setTiempoSeleccionado] = useState<number | null>(
    null
  );
  const [showTimeSelector, setShowTimeSelector] = useState(false);

  // Helper to save session state
  const persistSession = useCallback(
    (
      newPreguntas: PreguntaUI[],
      newRespuestas: RespuestaUsuario[],
      newIndex: number,
      newTimeLeft: number
    ) => {
      saveActiveSession({
        tipo,
        area,
        preguntas: newPreguntas,
        respuestas: newRespuestas,
        preguntaActual: newIndex,
        timeLeft: newTimeLeft,
        timestamp: Date.now(),
      });
    },
    [tipo, area]
  );

  // Save timer every 10 seconds to avoid excessive writing, but save properly on actions
  useEffect(() => {
    if (loading || preguntas.length === 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          clearInterval(interval);
          // Handle timeout if needed, for now just sits at 0
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, preguntas.length]);

  // Persist timer periodically (e.g. every 5 seconds) to avoid data loss on refresh
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
      // Logic for time configuration in Area Test
      if (
        tipo === "area" &&
        !tiempoSeleccionado &&
        !getActiveSession(tipo, area)
      ) {
        setLoading(false);
        setShowTimeSelector(true);
        return;
      }

      setLoading(true);

      // 0. Intentar cargar desde retry (sessionStorage)
      const retry = searchParams.get("retry") === "true";
      if (retry) {
        const sessionData = sessionStorage.getItem("session_test_data");
        if (sessionData) {
          const {
            preguntas: retryPreguntas,
            tipo: retryTipo,
            area: retryArea,
          } = JSON.parse(sessionData);
          // Verificar que el tipo y área coincidan para evitar errores
          if (retryTipo === tipo && retryArea === area) {
            setPreguntas(retryPreguntas);
            setRespuestas([]);
            setPreguntaActual(0);

            // Re-inicializar tiempo según el tipo
            let initialTime = 7200;
            if (tipo === "demo") initialTime = 600;
            else if (tipo === "area") initialTime = tiempoSeleccionado || 7200;

            setTimeLeft(initialTime);
            persistSession(retryPreguntas, [], 0, initialTime);
            setLoading(false);
            return;
          }
        }
      }

      // 1. Intentar cargar sesión activa (continuar donde se dejó)
      const session = getActiveSession(tipo, area);
      if (session && session.preguntas.length > 0) {
        setPreguntas(session.preguntas);
        setRespuestas(session.respuestas);
        setPreguntaActual(session.preguntaActual);
        // Load time left if exists, otherwise default
        if (session.timeLeft !== undefined) {
          setTimeLeft(session.timeLeft);
        }
        setLoading(false);
        return;
      }

      // 2. Si no hay sesión, cargar nuevas preguntas
      let preguntasCargadas: PreguntaUI[] = [];

      try {
        switch (tipo) {
          case "general":
            preguntasCargadas = await obtenerPruebaGeneral();
            break;
          case "area":
            if (area) {
              // CASO ESPECIAL: Comprensión Lectora usa 2 textos aleatorios
              if (area === "Comprensión Lectora") {
                const { textos, preguntas: preguntasTextos } =
                  await obtenerTextosAleatoriosConPreguntas(2, 15);

                setTextosSeleccionados(textos);

                // Agrupar preguntas por texto (ordenar por texto_lectura_id)
                // Esto asegura que el usuario responda todas las preguntas de un texto antes de pasar al siguiente
                preguntasCargadas = preguntasTextos.sort((a, b) => {
                  const idA = a.texto_lectura_id || "";
                  const idB = b.texto_lectura_id || "";
                  return idA.localeCompare(idB);
                });

                // No mostrar dialog inicial, se mostrará automáticamente con cada pregunta
              } else if (area === "Razonamiento Lógico") {
                // CASO ESPECIAL: Razonamiento Lógico usa 30 preguntas aleatorias
                preguntasCargadas = await obtenerPreguntasAleatoriasPorArea(
                  area,
                  30
                );
              } else if (area === "Conocimientos Generales") {
                // CASO ESPECIAL: Conocimientos Generales usa 20 preguntas aleatorias
                preguntasCargadas = await obtenerPreguntasAleatoriasPorArea(
                  area,
                  20
                );
              } else {
                preguntasCargadas = await obtenerPreguntasPorArea(area, 0, 99);
              }
            } else {
              router.push("/");
              return;
            }
            break;
          case "demo":
            const cachedDemo = localStorage.getItem("prueba_demo");
            if (cachedDemo) {
              preguntasCargadas = JSON.parse(cachedDemo);
            } else {
              preguntasCargadas = await obtenerPruebaDemo();
              if (preguntasCargadas.length > 0) {
                localStorage.setItem(
                  "prueba_demo",
                  JSON.stringify(preguntasCargadas)
                );
              }
            }
            break;
          default:
            router.push("/");
            return;
        }

        setPreguntas(preguntasCargadas);
        // Guardar sesión inicial
        let initialTime = 7200; // Default General: 2h

        if (tipo === "demo") {
          initialTime = 600; // Demo: 10m
        } else if (tipo === "area") {
          initialTime = tiempoSeleccionado || 7200;
        }

        setTimeLeft(initialTime); // Important: Set state
        persistSession(preguntasCargadas, [], 0, initialTime);
      } catch (error) {
        console.error("Error al cargar preguntas:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tipo) {
      cargarPreguntas();
    }
  }, [area, router, tipo, persistSession, tiempoSeleccionado, searchParams]);

  // Effect to load text when question changes
  useEffect(() => {
    const currentPregunta = preguntas[preguntaActual];
    if (!currentPregunta?.texto_lectura_id) {
      setTextoActual(null);
      return;
    }

    const loadText = async () => {
      // If we already have the text loaded, don't reload unless ID changed
      if (textoActual?.id === currentPregunta.texto_lectura_id) return;

      try {
        // 1. Check if text is in textosSeleccionados (optimization)
        if (isComprensionLectora && textosSeleccionados.length > 0) {
          const textoPreload = textosSeleccionados.find(
            (t) => t.id === currentPregunta.texto_lectura_id
          );
          if (textoPreload) {
            setTextoActual(textoPreload);

            // Logic to auto-show dialog only if it's the first question of this text block
            const prevPregunta =
              preguntaActual > 0 ? preguntas[preguntaActual - 1] : null;
            if (
              !prevPregunta ||
              prevPregunta.texto_lectura_id !== currentPregunta.texto_lectura_id
            ) {
              setShowTextoDialog(true);
            }

            return;
          }
        }

        const cacheKey = `texto_content_${currentPregunta.texto_lectura_id}`;
        const cachedText = localStorage.getItem(cacheKey);

        if (cachedText) {
          const parsed = JSON.parse(cachedText);
          setTextoActual(parsed);

          // Logic to auto-show dialog for Comprensión Lectora
          if (isComprensionLectora) {
            const prevPregunta =
              preguntaActual > 0 ? preguntas[preguntaActual - 1] : null;
            if (
              !prevPregunta ||
              prevPregunta.texto_lectura_id !== currentPregunta.texto_lectura_id
            ) {
              setShowTextoDialog(true);
            }
          }

          return;
        }

        const texto = await obtenerTextoLecturaPorId(
          currentPregunta.texto_lectura_id!
        );
        if (texto) {
          setTextoActual(texto);
          localStorage.setItem(cacheKey, JSON.stringify(texto));

          // Logic to auto-show dialog for Comprensión Lectora
          if (isComprensionLectora) {
            const prevPregunta =
              preguntaActual > 0 ? preguntas[preguntaActual - 1] : null;
            if (
              !prevPregunta ||
              prevPregunta.texto_lectura_id !== currentPregunta.texto_lectura_id
            ) {
              setShowTextoDialog(true);
            }
          }
        }
      } catch (error) {
        console.error("Error loading text:", error);
      }
    };
    loadText();
  }, [
    preguntas,
    preguntaActual,
    textoActual,
    isComprensionLectora,
    textosSeleccionados,
  ]);

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

  /* ───────────────── FINALIZAR ───────────────── */

  const [isCalculating, setIsCalculating] = useState(false);

  const handleFinalizar = async () => {
    setIsCalculating(true);
    // Usar localStorage temporalmente para pasar datos a la página de resultados
    localStorage.setItem("temp_preguntas", JSON.stringify(preguntas));
    localStorage.setItem("temp_respuestas", JSON.stringify(respuestas));
    localStorage.setItem("temp_tipo", tipo);
    if (area) {
      localStorage.setItem("temp_area", area);
    }

    // Limpiar la sesión activa para que la próxima vez genere una nueva
    clearActiveSession(tipo, area);

    // Small delay to let the user see the loader/message if needed, or just let router push take over.
    // Router push is async but doesn't return promise of navigation complete usually.
    // But since we set state, it re-renders loader.
    router.push("/resultados");
  };

  if (isCalculating) {
    return <LoadingLottie message="Calculando resultados..." />;
  }

  if (showTimeSelector) {
    return (
      <div className="bg-background h-[calc(100vh-4rem)] flex items-center justify-center">
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Configuración de Tiempo</AlertDialogTitle>
              <AlertDialogDescription>
                Selecciona el tiempo límite para esta prueba.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button
                onClick={() => {
                  setTiempoSeleccionado(600);
                  setShowTimeSelector(false);
                }}
                variant="outline"
                className="h-20 flex flex-col gap-1"
              >
                <span className="text-xl font-bold">10</span>
                <span className="text-xs">Minutos</span>
              </Button>
              <Button
                onClick={() => {
                  setTiempoSeleccionado(900);
                  setShowTimeSelector(false);
                }}
                variant="outline"
                className="h-20 flex flex-col gap-1"
              >
                <span className="text-xl font-bold">15</span>
                <span className="text-xs">Minutos</span>
              </Button>
              <Button
                onClick={() => {
                  setTiempoSeleccionado(1200);
                  setShowTimeSelector(false);
                }}
                variant="outline"
                className="h-20 flex flex-col gap-1"
              >
                <span className="text-xl font-bold">20</span>
                <span className="text-xs">Minutos</span>
              </Button>
              <Button
                onClick={() => {
                  setTiempoSeleccionado(1800);
                  setShowTimeSelector(false);
                }}
                variant="outline"
                className="h-20 flex flex-col gap-1"
              >
                <span className="text-xl font-bold">30</span>
                <span className="text-xs">Minutos</span>
              </Button>
              <Button
                onClick={() => {
                  setTiempoSeleccionado(2700);
                  setShowTimeSelector(false);
                }}
                variant="outline"
                className="h-20 flex flex-col gap-1"
              >
                <span className="text-xl font-bold">45</span>
                <span className="text-xs">Minutos</span>
              </Button>
              <Button
                onClick={() => {
                  setTiempoSeleccionado(3600);
                  setShowTimeSelector(false);
                }}
                variant="outline"
                className="h-20 flex flex-col gap-1"
              >
                <span className="text-xl font-bold">1</span>
                <span className="text-xs">Hora</span>
              </Button>
            </div>
            <AlertDialogFooter>
              <Button variant="ghost" onClick={() => router.push("/")}>
                Cancelar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (loading || preguntas.length === 0) {
    return <LoadingLottie size={150} />;
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
                {isComprensionLectora && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTextoDialog(true)}
                    className="h-6 text-purple-600
                     border border-purple-600 hover:bg-purple-200/70 hover:text-purple-600
                      hover:border-purple-600 transition-colors gap-1.5 text-xs font-medium"
                  >
                    <Eye className="w-3 h-3" />
                    Ver Texto
                  </Button>
                )}
                {/* Botón ver texto individual si la pregunta lo requiere (para otros casos) */}
                {area !== "Comprensión Lectora" &&
                  preguntas[preguntaActual]?.texto_lectura_id && (
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

      <AlertDialog open={showTimeSelector}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Configuración de Tiempo</AlertDialogTitle>
            <AlertDialogDescription>
              Selecciona el tiempo límite para esta prueba por área.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              onClick={() => {
                setTiempoSeleccionado(1800);
                setShowTimeSelector(false);
              }}
              variant="outline"
              className="h-20 flex flex-col gap-1 cursor-pointer"
            >
              <span className="text-xl font-bold">30</span>
              <span className="text-xs">Minutos</span>
            </Button>
            <Button
              onClick={() => {
                setTiempoSeleccionado(2400);
                setShowTimeSelector(false);
              }}
              variant="outline"
              className="h-20 flex flex-col gap-1"
            >
              <span className="text-xl font-bold">40</span>
              <span className="text-xs">Minutos</span>
            </Button>
            <Button
              onClick={() => {
                setTiempoSeleccionado(3600);
                setShowTimeSelector(false);
              }}
              variant="outline"
              className="h-20 flex flex-col gap-1"
            >
              <span className="text-xl font-bold">1</span>
              <span className="text-xs">Hora</span>
            </Button>
            <Button
              onClick={() => {
                setTiempoSeleccionado(5400);
                setShowTimeSelector(false);
              }}
              variant="outline"
              className="h-20 flex flex-col gap-1"
            >
              <span className="text-xl font-bold">1:30</span>
              <span className="text-xs">Horas</span>
            </Button>
            <Button
              onClick={() => {
                setTiempoSeleccionado(7200);
                setShowTimeSelector(false);
              }}
              variant="outline"
              className="h-20 flex flex-col gap-1"
            >
              <span className="text-xl font-bold">2</span>
              <span className="text-xs">Horas</span>
            </Button>
          </div>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => router.push("/")}>
              Cancelar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
