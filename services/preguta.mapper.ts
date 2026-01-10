import { Pregunta, PreguntaGeneralRPC, PreguntaUI } from "@/types/pregunta";

export function mapPreguntaDBtoUI(p: Pregunta): PreguntaUI {
  return {
    ...p,
    // Si es array, toma el primero; si es objeto, usa tal cual; si es undefined, null
    componentes: Array.isArray(p.componentes)
      ? p.componentes[0] ?? null
      : p.componentes ?? null,
    disciplinas: Array.isArray(p.disciplinas)
      ? p.disciplinas[0] ?? null
      : p.disciplinas ?? null,
  };
}

export function mapPreguntaGeneralRPCtoUI(row: PreguntaGeneralRPC): PreguntaUI {
  return {
    id: row.id,
    enunciado: row.enunciado,
    opciones: row.opciones,
    sustento: row.sustento,
    dificultad: row.dificultad ?? "fácil",
    disciplinas: { nombre: row.disciplina_nombre },
    componentes: {
      nombre: row.componente_nombre,
    },
    num_pregunta: row.num_pregunta ?? undefined,
    texto_lectura_id: row.texto_lectura_id || null,
  };
}
