import { supabase } from "@/lib/supabase/client";
import { PreguntaUI } from "@/types/pregunta";

export async function obtenerPreguntasIA(): Promise<PreguntaUI[]> {
  const { data, error } = await supabase
    .from("preguntas_ia")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener preguntas de IA:", error);
    return [];
  }

  if (!data) return [];

  return data.map((item) => {
    // Parsear opciones si vienen como string
    let opciones = [];
    try {
      opciones =
        typeof item.opciones === "string"
          ? JSON.parse(item.opciones)
          : item.opciones;
    } catch (e) {
      console.error("Error parsing opciones for question", item.id, e);
    }

    // Adaptar Componente y Disciplina
    // La UI espera objetos con {nombre: string}, pero la DB tiene strings.
    // Creamos objetos simulados para cumplir con la interfaz.
    const componenteObj = item.componente
      ? { id: "ia-comp", nombre: item.componente }
      : null;
    const disciplinaObj = item.disciplina
      ? { id: "ia-disc", nombre: item.disciplina }
      : null;

    return {
      id: item.id,
      enunciado: item.enunciado,
      opciones: opciones,
      sustento: item.sustento,
      dificultad: item.dificultad || "media", // Default si falta
      activa: item.visible !== false,
      componentes: componenteObj as any, // Cast as any or match Componente type if simple
      disciplinas: disciplinaObj as any,
      num_pregunta: item.idx,
      texto_lectura_id: null, // IA questions don't seem to have linked reading texts in this schema yet
      image: null,
    } as PreguntaUI;
  });
}
