import { supabase } from "@/lib/supabase/client";

import type {
  Pregunta,
  PreguntaGeneralRPC,
  PreguntaUI,
} from "@/types/pregunta";
import { mapPreguntaDBtoUI, mapPreguntaGeneralRPCtoUI } from "./preguta.mapper";

export async function obtenerPreguntasGenerales(): Promise<PreguntaUI[]> {
  const { data, error } = await supabase.rpc("obtener_prueba_general");

  if (error) throw error;
  if (!data) return [];

  return (data as PreguntaGeneralRPC[]).map(mapPreguntaGeneralRPCtoUI);
}

/**
 * Obtiene las preguntas asociadas a un texto de lectura específico
 */
export async function obtenerPreguntasPorTextoLectura(
  textoLecturaId: string
): Promise<PreguntaUI[]> {
  const { data, error } = await supabase
    .from("preguntas")
    .select(
      `
      id,
     enunciado,
     opciones,
     sustento,
     dificultad,
     activa,
     componentes(nombre),
     disciplinas(nombre),
     num_pregunta,
     texto_lectura_id
    `
    )
    .eq("activa", true)
    .eq("texto_lectura_id", textoLecturaId)
    .order("num_pregunta", { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return (data as Pregunta[]).map(mapPreguntaDBtoUI);
}

export function getImagenPregunta(nombre?: string | null) {
  if (!nombre) return null;

  const { data } = supabase.storage.from("rml").getPublicUrl(nombre);

  return data.publicUrl;
}
