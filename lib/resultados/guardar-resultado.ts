import type { Resultado } from "@/types/pregunta"


export function guardarResultadoLocal(resultado: Resultado) {
  sessionStorage.setItem(
    "ultimoResultado",
    JSON.stringify(resultado)
  )
}

