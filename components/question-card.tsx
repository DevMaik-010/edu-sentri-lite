"use client";

import { useEffect, useState } from "react";
import type { PreguntaUI } from "@/types/pregunta";
import { getImagenPregunta } from "@/services/preguntas";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Plus,
  Minus,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  pregunta: PreguntaUI;
  numeroActual?: number;
  total?: number;
  respuestaSeleccionada: string | undefined;
  onRespuesta?: (respuesta: string) => void;
  onSeleccionarRespuesta?: (respuesta: string) => void;
  mostrarRespuesta?: boolean;
  mostrarCorrecta?: boolean;
  theme?: "morning" | "afternoon" | "night";
  themeClasses?: Record<string, any>;
}

type ColoresPorArea = {
  [key: string]: string;
};

const coloresPorArea: ColoresPorArea = {
  "Razonamiento Lógico": "bg-blue-600/90 text-white backdrop-blur-sm",
  "Conocimientos Generales": "bg-green-600/90 text-white backdrop-blur-sm",
  "Comprensión Lectora": "bg-violet-600/90 text-white backdrop-blur-sm",
  "Habilidades Socioemocionales": "bg-pink-600/90 text-white backdrop-blur-sm",
  Default: "bg-blue-600/90 text-white backdrop-blur-sm",
};

const coloresPorDisciplina: ColoresPorArea = {
  "Identificación de Patrones": "bg-blue-100/50 text-blue-700 border-blue-200",
  "Series Numéricas": "bg-blue-100/50 text-blue-700 border-blue-200",
  "Problemas Lógicos": "bg-blue-100/50 text-blue-700 border-blue-200",
  Biología: "bg-green-100/50 text-green-700 border-green-200",
  Química: "bg-emerald-100/50 text-emerald-700 border-emerald-200",
  Física: "bg-cyan-100/50 text-cyan-700 border-cyan-200",

  Historia: "bg-amber-100/50 text-amber-700 border-amber-200",
  Geografía: "bg-orange-100/50 text-orange-700 border-orange-200",
  Filosofia: "bg-indigo-100/50 text-indigo-700 border-indigo-200",

  Lenguaje: "bg-violet-100/50 text-violet-700 border-violet-200",

  "Técnica Tecnológica": "bg-yellow-100/50 text-yellow-800 border-yellow-200",

  Default: "bg-gray-100/50 text-black border-gray-200",
};

export function QuestionCard({
  pregunta,
  numeroActual,
  total,
  respuestaSeleccionada,
  onRespuesta,
  onSeleccionarRespuesta,
  mostrarRespuesta = false,
  mostrarCorrecta = false,
  theme = "morning",
  themeClasses,
}: QuestionCardProps) {
  const handleChange = (value: string) => {
    if (onRespuesta) onRespuesta(value);
    if (onSeleccionarRespuesta) onSeleccionarRespuesta(value);
  };

  const [opcionesBarajadas, setOpcionesBarajadas] = useState<
    PreguntaUI["opciones"]
  >(pregunta.opciones);
  const [showImageDialog, setShowImageDialog] = useState(false);

  useEffect(() => {
    if (!pregunta.opciones) return;

    const barajar_opciones = async () => {
      const shuffled = [...pregunta.opciones];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setOpcionesBarajadas(shuffled);
    };

    barajar_opciones();
  }, [pregunta]);

  const mostrar = mostrarRespuesta || mostrarCorrecta;
  const esCorrecta =
    respuestaSeleccionada ===
    pregunta.opciones.find((opcion) => opcion.es_correcta)?.clave;

  return (
    <Card
      className={cn(
        "flex gap-2 flex-col h-full p-0 pb-2 transition-all duration-300 border-0 shadow-none bg-transparent",
      )}
    >
      <div className="overflow-y-auto h-full scrollbar-hide rounded-2xl">
        {/* 🔝 HEADER (FIJO) */}
        <CardHeader
          className={cn(
            "m-0 p-0 shrink-0 pb-6 rounded-2xl shadow-sm border-0 transition-colors duration-500",
            themeClasses?.glass ||
              "bg-white/40 backdrop-blur-md border-white/50",
          )}
        >
          <div
            className={`flex items-center justify-center ${
              coloresPorArea[pregunta.componentes?.nombre || "Default"]
            } rounded-t-2xl h-10 font-bold shadow-sm tracking-wide text-sm`}
          >
            {pregunta.componentes?.nombre?.toUpperCase()}
          </div>

          {numeroActual && total && (
            <div className="flex items-center justify-between px-6 mt-4">
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider opacity-70",
                  themeClasses?.text,
                )}
              >
                Pregunta {numeroActual} / {total}
              </span>
              <span
                className={`text-xs px-3 py-1 border ${
                  coloresPorDisciplina[
                    pregunta.disciplinas?.nombre || "Default"
                  ]
                } rounded-full w-fit font-medium backdrop-blur-sm shadow-sm`}
              >
                {pregunta.disciplinas?.nombre}
              </span>
            </div>
          )}

          <h2
            className={cn(
              "text-lg sm:text-xl font-bold leading-relaxed px-6 mt-3",
              themeClasses?.text,
            )}
          >
            {pregunta.num_pregunta}. {pregunta.enunciado}
          </h2>
        </CardHeader>

        {/* 🧠 CONTENIDO (SCROLL INTERNO) */}
        <CardContent className="px-1 sm:px-2 pt-4 pb-4">
          <RadioGroup
            value={respuestaSeleccionada ?? ""}
            onValueChange={handleChange}
            className="space-y-3 sm:space-y-4"
          >
            {opcionesBarajadas.map((opcion, index) => {
              const esSeleccionada = respuestaSeleccionada === opcion.clave;

              // Si NO se deben mostrar respuestas, usar estilo neutro con Glassmorphism
              if (!mostrar) {
                return (
                  <div
                    key={index}
                    className={cn(
                      " group relative flex items-center space-x-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm",
                      esSeleccionada
                        ? cn(themeClasses?.glass, "ring-1 ring-offset-0")
                        : "hover:border-black border-2 hover:shadow-sm bg-white",
                    )}
                  >
                    {/* Background indicator for selection */}
                    {esSeleccionada && (
                      <div
                        className={cn(
                          "absolute inset-0 opacity-10",
                          themeClasses?.glass,
                        )}
                      />
                    )}

                    <RadioGroupItem
                      value={opcion.clave}
                      id={`opcion-${index}`}
                      className={cn(
                        "shrink-0 z-10 border-[1.5px] size-5",
                        esSeleccionada
                          ? cn(themeClasses?.accentBorder, "border-2")
                          : "border-slate-400 dark:border-slate-500",
                      )}
                    />
                    <Label
                      htmlFor={`opcion-${index}`}
                      className={cn(
                        "flex-1 cursor-pointer text-sm sm:text-base leading-relaxed z-10 transition-all",
                        esSeleccionada
                          ? cn("font-bold text-slate-900")
                          : "font-medium text-slate-700",
                      )}
                    >
                      {opcion.texto}
                    </Label>
                  </div>
                );
              }

              // Lógica original para cuando SÍ se muestra respuesta (Feedback mode)
              const seleccion_correcta =
                respuestaSeleccionada === opcion.clave && opcion.es_correcta;
              const seleccion_incorrecta =
                respuestaSeleccionada === opcion.clave && !opcion.es_correcta;

              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 backdrop-blur-sm",
                    seleccion_correcta
                      ? "border-green-500 bg-green-50/80 dark:bg-green-950/40"
                      : seleccion_incorrecta
                        ? "border-red-500 bg-red-50/80 dark:bg-red-950/40"
                        : "border-transparent bg-white/40 hover:bg-white/60",
                  )}
                >
                  <RadioGroupItem
                    value={opcion.clave}
                    id={`opcion-${index}`}
                    disabled={mostrar}
                    className="shrink-0"
                  />
                  <Label
                    htmlFor={`opcion-${index}`}
                    className={cn(
                      "flex-1 cursor-pointer text-sm sm:text-base leading-relaxed font-medium",
                      seleccion_correcta
                        ? "text-green-700 dark:text-green-400 font-bold"
                        : seleccion_incorrecta
                          ? "text-red-700 dark:text-red-400 font-bold"
                          : "text-slate-700 dark:text-slate-300",
                    )}
                  >
                    {opcion.texto}
                  </Label>
                  {seleccion_correcta && (
                    <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 drop-shadow-sm" />
                  )}
                  {seleccion_incorrecta && (
                    <XCircle className="w-6 h-6 text-red-600 shrink-0 drop-shadow-sm" />
                  )}
                </div>
              );
            })}
          </RadioGroup>

          {mostrar && !esCorrecta && (
            <div className="mt-6 p-5 bg-green-50/90 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm backdrop-blur-md">
              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                Respuesta correcta:{" "}
                <span className="font-bold text-base block mt-1">
                  {pregunta.opciones.find((o) => o.es_correcta)?.texto}
                </span>
              </p>
            </div>
          )}

          {mostrar && (
            <div className="mt-4 space-y-4">
              {pregunta.sustento && (
                <div className="p-5 bg-blue-50/90 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm backdrop-blur-md">
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Explicación:
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    {pregunta.sustento}
                  </p>
                </div>
              )}

              {/* Botón para ver imagen si existe */}
              {pregunta.image && (
                <div className="flex justify-start animate-in fade-in slide-in-from-top-2 duration-300">
                  <Button
                    variant="outline"
                    className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50/50 backdrop-blur-sm"
                    onClick={() => setShowImageDialog(true)}
                  >
                    <Eye className="w-4 h-4" />
                    Ver Explicacion Gráfica
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>

      {/* Dialogo Imagen */}
      <AlertDialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <AlertDialogHeader>
          <AlertDialogTitle></AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogContent className="max-w-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/20">
          <div className="flex flex-col items-center justify-center p-0 h-[80vh] w-full bg-slate-50/50 dark:bg-slate-900/50 rounded-lg overflow-hidden relative">
            <TransformWrapper
              initialScale={1}
              minScale={0.5}
              maxScale={4}
              centerOnInit
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div className="absolute top-4 right-4 z-50 flex gap-2 bg-background/80 backdrop-blur-sm p-1 rounded-md border shadow-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => zoomIn()}
                      title="Acercar"
                      className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => zoomOut()}
                      title="Alejar"
                      className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => resetTransform()}
                      title="Restablecer"
                      className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>

                  <TransformComponent
                    wrapperClass="!w-full !h-full flex items-center justify-center"
                    contentClass="!w-full !h-full flex items-center justify-center"
                  >
                    <Image
                      src={getImagenPregunta(pregunta.image) || ""}
                      alt="Solución Gráfica"
                      width={1200}
                      height={1200}
                      className="max-w-none object-contain h-auto w-auto max-h-full"
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
