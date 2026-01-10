import { obtenerPreguntas } from "@/services/preguntas"

 
const obtenerPreguntasTotal = async () => {
  const preguntas = await obtenerPreguntas()
  return preguntas
}

// Función para barajar un array usando algoritmo Fisher-Yates
function barajar<T>(array: T[]): T[] {
  const resultado = [...array]
  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[resultado[i], resultado[j]] = [resultado[j], resultado[i]]
  }
  return resultado
}

// Seleccionar 100 preguntas aleatorias del total
export const seleccionarPreguntasGenerales = async () => {
  const preguntasBarajadas = barajar(await obtenerPreguntasTotal())
  return preguntasBarajadas.slice(0, 100)
}


export const seleccionarPreguntasDemo = async () => {
  const preguntasBarajadas = barajar(await obtenerPreguntasTotal())
  return preguntasBarajadas.slice(0, 10)
}
