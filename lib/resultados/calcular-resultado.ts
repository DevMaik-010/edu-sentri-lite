import type { PreguntaUI, RespuestaUsuario, Resultado } from "@/types/pregunta"

export function calcularResultado(
  preguntas: PreguntaUI[],
  respuestas: RespuestaUsuario[]
): Resultado {
  let correctas = 0

  const porArea: Record<
    string,
    { correctas: number; total: number }
  > = {}

  preguntas.forEach((pregunta) => {
    const respuesta = respuestas.find(
      (r) => r.preguntaId === pregunta.id
    )

    const opcionCorrecta = pregunta.opciones.find(
      (o) => o.es_correcta
    )?.texto

    const esCorrecta =
      respuesta?.respuestaSeleccionada === opcionCorrecta

    if (esCorrecta) correctas++

    const area = pregunta.componentes?.nombre ?? "General"

    if (!porArea[area]) {
      porArea[area] = { correctas: 0, total: 0 }
    }

    porArea[area].total++
    if (esCorrecta) porArea[area].correctas++
  })

  const totalPreguntas = preguntas.length
  const incorrectas = totalPreguntas - correctas
  const porcentaje = (correctas / totalPreguntas) * 100

  const resultadosPorArea = Object.entries(porArea).map(
    ([area, stats]) => ({
      area,
      correctas: stats.correctas,
      total: stats.total,
      porcentaje: (stats.correctas / stats.total) * 100,
    })
  )

  return {
    totalPreguntas,
    correctas,
    incorrectas,
    porcentaje,
    porArea: resultadosPorArea,
  }
}
