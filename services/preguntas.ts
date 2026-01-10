import { supabase } from "@/lib/supabase/client";

import type {
  Pregunta,
  PreguntaGeneralRPC,
  PreguntaUI,
} from "@/types/pregunta";
import { mapPreguntaDBtoUI, mapPreguntaGeneralRPCtoUI } from "./preguta.mapper";

export async function obtenerPreguntasGenerales(
  preguntasPorComponente = 25
): Promise<PreguntaUI[]> {
  const { data, error } = await supabase.rpc("obtener_preguntas_generales", {
    preguntas_por_componente: preguntasPorComponente,
  });

  if (error) throw error;
  if (!data) return [];

  return (data as PreguntaGeneralRPC[]).map(mapPreguntaGeneralRPCtoUI);
}

export async function obtenerPreguntas(limit = 5): Promise<PreguntaUI[]> {
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
    .limit(limit);

  if (error) throw error;
  if (!data) return [];
  // 👇 Supabase puede devolver null
  return (data as Pregunta[]).map(mapPreguntaDBtoUI);
}

export async function obtenerPreguntasPorArea(
  area: string,
  start: number,
  end: number,
  disciplina?: string,
  usarNumPregunta: boolean = false
): Promise<PreguntaUI[]> {
  let query = supabase
    .from("preguntas")
    .select(
      `
      id,
     enunciado,
     opciones,
     sustento,
     dificultad,
     activa,
     componentes!inner(nombre),
     disciplinas${disciplina ? "!inner" : ""}(nombre),
     num_pregunta,
     image,
     texto_lectura_id
    `
    )
    .eq("activa", true)
    .eq("componentes.nombre", area);

  if (disciplina) {
    query = query.eq("disciplinas.nombre", disciplina);
  }

  if (usarNumPregunta) {
    query = query
      .gte("num_pregunta", start)
      .lte("num_pregunta", end)
      .order("num_pregunta", { ascending: true });
  } else {
    query = query.order("num_pregunta", { ascending: true }).range(start, end);
  }

  const { data, error } = await query;

  if (error) throw error;
  if (!data) return [];

  // 👇 Supabase puede devolver null
  return (data as Pregunta[]).map(mapPreguntaDBtoUI);
}

/**
 * Obtiene un número específico de preguntas aleatorias para un área
 */
export async function obtenerPreguntasAleatoriasPorArea(
  area: string,
  cantidad: number
): Promise<PreguntaUI[]> {
  // 1. Obtener todos los IDs disponibles para el área
  const { data: ids, error: idError } = await supabase
    .from("preguntas")
    .select("id, componentes!inner(nombre)")
    .eq("activa", true)
    .eq("componentes.nombre", area);

  if (idError) throw idError;
  if (!ids || ids.length === 0) return [];

  // 2. Mezclar y seleccionar N IDs
  const shuffled = ids.sort(() => 0.5 - Math.random());
  const selectedIds = shuffled.slice(0, cantidad).map((item) => item.id);

  // 3. Obtener detalles de las preguntas seleccionadas
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
     componentes!inner(nombre),
     disciplinas(nombre),
     num_pregunta,
     image,
     texto_lectura_id
    `
    )
    .in("id", selectedIds);

  if (error) throw error;
  if (!data) return [];

  return (data as Pregunta[]).map(mapPreguntaDBtoUI);
}

export async function obtenerConteoPreguntasPorArea(
  area: string,
  disciplina?: string
): Promise<number> {
  const selectString = disciplina
    ? "id, componentes!inner(nombre), disciplinas!inner(nombre)"
    : "id, componentes!inner(nombre)";

  let query = supabase
    .from("preguntas")
    .select(selectString, { count: "exact", head: true })
    .eq("activa", true)
    .eq("componentes.nombre", area);

  if (disciplina) {
    query = query.eq("disciplinas.nombre", disciplina);
  }

  const { count, error } = await query;

  if (error) throw error;
  return count || 0;
}

export async function obtenerRangoPreguntas(
  area: string,
  disciplina?: string
): Promise<{ min: number; max: number } | null> {
  let queryBase = supabase
    .from("preguntas")
    .select(
      "num_pregunta, componentes!inner(nombre), disciplinas!inner(nombre)"
    )
    .eq("activa", true)
    .eq("componentes.nombre", area);

  if (disciplina) {
    queryBase = queryBase.eq("disciplinas.nombre", disciplina);
  }

  // Obtener mínimo
  const { data: dataMin, error: errorMin } = await queryBase
    .order("num_pregunta", { ascending: true })
    .limit(1);

  // Obtener máximo
  // Nota: Necesitamos recrear la query base porque .limit() muta o el objeto query no es reutilizable directamente de esa forma a veces
  let queryMax = supabase
    .from("preguntas")
    .select(
      "num_pregunta, componentes!inner(nombre), disciplinas!inner(nombre)"
    )
    .eq("activa", true)
    .eq("componentes.nombre", area);

  if (disciplina) {
    queryMax = queryMax.eq("disciplinas.nombre", disciplina);
  }

  const { data: dataMax, error: errorMax } = await queryMax
    .order("num_pregunta", { ascending: false })
    .limit(1);

  if (errorMin || errorMax) {
    console.error("Error fetching ranges", errorMin, errorMax);
    return null;
  }

  const min = dataMin?.[0]?.num_pregunta ?? 1;
  const max = dataMax?.[0]?.num_pregunta ?? 1;

  return { min, max };
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
