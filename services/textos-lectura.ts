import { supabase } from "@/lib/supabase/client";
import type {
  TextoLectura,
  TextoLecturaConPreguntas,
} from "@/types/textos-lectura";
import type { PreguntaUI } from "@/types/pregunta";
import { obtenerPreguntasPorTextoLectura } from "./preguntas";

/**
 * Obtiene todos los textos de lectura disponibles con el conteo de preguntas asociadas
 */
export async function obtenerTextosLectura(): Promise<
  TextoLecturaConPreguntas[]
> {
  const { data: textos, error: textosError } = await supabase
    .from("textos_lectura")
    .select("id, titulo, contenido, fuente, componente_id")
    .order("titulo", { ascending: true });

  if (textosError) throw textosError;
  if (!textos) return [];

  // Para cada texto, contar sus preguntas
  const textosConPreguntas = await Promise.all(
    textos.map(async (texto) => {
      const { count, error: countError } = await supabase
        .from("preguntas")
        .select("id", { count: "exact", head: true })
        .eq("texto_lectura_id", texto.id)
        .eq("activa", true);

      if (countError) {
        console.error(
          `Error contando preguntas para texto ${texto.id}:`,
          countError
        );
        return { ...texto, num_preguntas: 0 };
      }

      return { ...texto, num_preguntas: count || 0 };
    })
  );

  // Filtrar textos que tienen al menos una pregunta
  return textosConPreguntas.filter((texto) => texto.num_preguntas > 0);
}

/**
 * Obtiene un texto de lectura específico por su ID
 */
export async function obtenerTextoLecturaPorId(
  id: string
): Promise<TextoLectura | null> {
  const { data, error } = await supabase
    .from("textos_lectura")
    .select("id, titulo, contenido, fuente, componente_id")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error obteniendo texto de lectura:", error);
    return null;
  }

  return data;
}

/**
 * Obtiene textos aleatorios con sus preguntas asociadas
 * @param cantidad - Número de textos a seleccionar (default: 2)
 * @param preguntasPorTexto - Número de preguntas aleatorias por texto (default: 15)
 * @returns Array de textos con sus preguntas
 */
export async function obtenerTextosAleatoriosConPreguntas(
  cantidad: number = 2,
  preguntasPorTexto: number = 15
): Promise<{ textos: TextoLectura[]; preguntas: PreguntaUI[] }> {
  // 1. Obtener todos los textos que tienen preguntas
  const textosDisponibles = await obtenerTextosLectura();

  if (textosDisponibles.length === 0) {
    throw new Error("No hay textos de lectura disponibles");
  }

  if (textosDisponibles.length < cantidad) {
    console.warn(
      `Solo hay ${textosDisponibles.length} textos disponibles, se solicitaron ${cantidad}`
    );
  }

  // 2. Mezclar textos disponibles
  const textosMezclados = [...textosDisponibles].sort(
    () => Math.random() - 0.5
  );

  // 3. Seleccionar textos que tengan preguntas
  const textosSeleccionados: TextoLectura[] = [];
  const todasLasPreguntas: PreguntaUI[] = [];

  for (const textoInfo of textosMezclados) {
    // Si ya tenemos suficientes textos, salir
    if (textosSeleccionados.length >= cantidad) {
      break;
    }

    // Obtener el texto completo
    const textoCompleto = await obtenerTextoLecturaPorId(textoInfo.id);
    if (!textoCompleto) {
      console.warn(`No se pudo obtener texto completo para ${textoInfo.id}`);
      continue;
    }

    // Obtener preguntas usando la función del servicio
    try {
      const preguntasDelTexto = await obtenerPreguntasPorTextoLectura(
        textoInfo.id
      );

      if (!preguntasDelTexto || preguntasDelTexto.length === 0) {
        console.warn(
          `Texto ${textoInfo.id} no tiene preguntas, seleccionando otro...`
        );
        continue; // Intentar con el siguiente texto
      }

      // Seleccionar N preguntas aleatorias de este texto
      const preguntasAleatorias = [...preguntasDelTexto]
        .sort(() => Math.random() - 0.5)
        .slice(0, preguntasPorTexto);

      // Este texto tiene preguntas, agregarlo
      textosSeleccionados.push(textoCompleto);
      todasLasPreguntas.push(...preguntasAleatorias);
    } catch (error) {
      console.error(
        `Error obteniendo preguntas para texto ${textoInfo.id}:`,
        error
      );
      continue; // Intentar con el siguiente texto
    }
  }

  // Verificar que tengamos al menos un texto con preguntas
  if (textosSeleccionados.length === 0) {
    throw new Error("No se encontraron textos con preguntas disponibles");
  }

  if (textosSeleccionados.length < cantidad) {
    console.warn(
      `Solo se pudieron seleccionar ${textosSeleccionados.length} textos con preguntas de ${cantidad} solicitados`
    );
  }

  // 4. Mezclar las preguntas finales
  const preguntasMezcladas = todasLasPreguntas.sort(() => Math.random() - 0.5);

  console.log(
    `✅ Seleccionados ${textosSeleccionados.length} textos con ${preguntasMezcladas.length} preguntas totales`
  );

  return {
    textos: textosSeleccionados,
    preguntas: preguntasMezcladas,
  };
}
