import type { PreguntaUI } from "@/types/pregunta"

const ERRORES_KEY = "preguntasErrores"

export function guardarPreguntaIncorrecta(pregunta: PreguntaUI): void {
  if (typeof window === "undefined") return

  const errores = obtenerPreguntasIncorrectas()

  // No duplicar preguntas
  if (!errores.find((p) => p.id === pregunta.id)) {
    errores.push(pregunta)
    localStorage.setItem(ERRORES_KEY, JSON.stringify(errores))
  }
}

export function obtenerPreguntasIncorrectas(): PreguntaUI[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(ERRORES_KEY)
  if (!data) return []
  return JSON.parse(data)
}

export function limpiarPreguntasIncorrectas(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ERRORES_KEY)
}

export function eliminarPreguntaIncorrecta(preguntaId: string): void {
  if (typeof window === "undefined") return
  const errores = obtenerPreguntasIncorrectas()
  const filtradas = errores.filter((p) => p.id !== preguntaId)
  localStorage.setItem(ERRORES_KEY, JSON.stringify(filtradas))
}
