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

interface QuestionCardProps {
  pregunta: PreguntaUI;
  numeroActual?: number;
  total?: number;
  respuestaSeleccionada: string | undefined;
  onRespuesta?: (respuesta: string) => void;
  onSeleccionarRespuesta?: (respuesta: string) => void;
  mostrarRespuesta?: boolean;
  mostrarCorrecta?: boolean;
}

type ColoresPorArea = {
  [key: string]: string;
};

const coloresPorArea: ColoresPorArea = {
  "Razonamiento Lógico": "bg-blue-600 text-white",
  "Conocimientos Generales": "bg-green-600 text-white",
  "Comprensión Lectora": "bg-violet-600 text-white",
  "Habilidades Socioemocionales": "bg-pink-600 text-white",
  Default: "bg-blue-600 text-black",
};

const coloresPorDisciplina: ColoresPorArea = {
  "Identificación de Patrones": "bg-blue-100 text-blue-700",
  "Series Numéricas": "bg-blue-100 text-blue-700",
  "Problemas Lógicos": "bg-blue-100 text-blue-700",
  Biología: "bg-green-100 text-green-700",
  Química: "bg-emerald-100 text-emerald-700",
  Física: "bg-cyan-100 text-cyan-700",

  Historia: "bg-amber-100 text-amber-700",
  Geografía: "bg-orange-100 text-orange-700",
  Filosofia: "bg-indigo-100 text-indigo-700",

  Lenguaje: "bg-violet-100 text-violet-700",

  "Técnica Tecnológica": "bg-yellow-100 text-yellow-800",

  Default: "bg-gray-100 text-black",
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
      className={`flex gap-2 flex-col h-full border-2 p-0 pb-2 transition-all duration-300 ${
        mostrar && esCorrecta
          ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
          : ""
      }`}
    >
      <div className="overflow-y-auto h-full scrollbar-hide">
        {/* 🔝 HEADER (FIJO) */}
        <CardHeader className="m-0 p-0 shrink-0">
          <div
            className={`flex items-center justify-center ${
              coloresPorArea[pregunta.componentes?.nombre || "Default"]
            } rounded-t-lg h-10 text-black font-bold`}
          >
            {pregunta.componentes?.nombre?.toUpperCase()}
          </div>

          {numeroActual && total && (
            <div className="flex items-center justify-between px-5 mt-1">
              <span className="text-xs font-medium text-muted-foreground">
                Pregunta {numeroActual} de {total}
              </span>
              <span
                className={`text-xs px-2 sm:px-3 py-1 ${
                  coloresPorDisciplina[
                    pregunta.disciplinas?.nombre || "Default"
                  ]
                } rounded-full w-fit`}
              >
                {pregunta.disciplinas?.nombre}
              </span>
            </div>
          )}

          <h2 className="text-lg sm:text-xl font-semibold leading-relaxed px-5 mt-2">
            {pregunta.num_pregunta}. {pregunta.enunciado}
          </h2>
        </CardHeader>

        {/* 🧠 CONTENIDO (SCROLL INTERNO) */}
        <CardContent className="px-5 pb-4 mt-4">
          <RadioGroup
            value={respuestaSeleccionada ?? ""}
            onValueChange={handleChange}
            className="space-y-2 sm:space-y-3"
          >
            {opcionesBarajadas.map((opcion, index) => {
              const esSeleccionada = respuestaSeleccionada === opcion.clave;

              // Si NO se deben mostrar respuestas, usar estilo neutro
              if (!mostrar) {
                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                      esSeleccionada
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                  >
                    <RadioGroupItem
                      value={opcion.clave}
                      id={`opcion-${index}`}
                      className="shrink-0"
                    />
                    <Label
                      htmlFor={`opcion-${index}`}
                      className={`flex-1 cursor-pointer text-sm sm:text-base leading-relaxed ${
                        esSeleccionada ? "font-semibold text-primary" : ""
                      }`}
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
                  className={`flex items-center space-x-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                    seleccion_correcta
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                      : seleccion_incorrecta
                      ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                      : "border-border hover:border-primary/50 hover:bg-secondary/50"
                  }`}
                >
                  <RadioGroupItem
                    value={opcion.clave}
                    id={`opcion-${index}`}
                    disabled={mostrar}
                    className="shrink-0"
                  />
                  <Label
                    htmlFor={`opcion-${index}`}
                    className={`flex-1 cursor-pointer text-sm sm:text-base leading-relaxed ${
                      seleccion_correcta
                        ? "font-semibold text-green-700 dark:text-green-400"
                        : seleccion_incorrecta
                        ? "font-semibold text-red-700 dark:text-red-400"
                        : ""
                    }`}
                  >
                    {opcion.texto}
                  </Label>
                  {seleccion_correcta && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  )}
                  {seleccion_incorrecta && (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                </div>
              );
            })}
          </RadioGroup>

          {mostrar && !esCorrecta && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500 rounded animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                Respuesta correcta:{" "}
                <span className="font-bold">
                  {pregunta.opciones.find((o) => o.es_correcta)?.texto}
                </span>
              </p>
            </div>
          )}

          {mostrar && (
            <div className="mt-4 space-y-4">
              {pregunta.sustento && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500 rounded animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-1">
                    Explicación:
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {pregunta.sustento}
                  </p>
                </div>
              )}

              {/* Botón para ver imagen si existe */}
              {pregunta.image && (
                <div className="flex justify-start animate-in fade-in slide-in-from-top-2 duration-300">
                  <Button
                    variant="outline"
                    className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                    onClick={() => setShowImageDialog(true)}
                  >
                    <Eye className="w-4 h-4" />
                    Ver Explicacion
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
        <AlertDialogContent className="max-w-3xl">
          <div className="flex flex-col items-center justify-center p-0 h-[80vh] w-full bg-slate-50/50 dark:bg-slate-900/50 rounded-md overflow-hidden relative">
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
