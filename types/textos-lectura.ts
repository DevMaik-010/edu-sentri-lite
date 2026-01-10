export interface TextoLectura {
  id: string;
  titulo: string;
  contenido: string;
  fuente: string | null;
  componente_id: string;
}

export interface TextoLecturaConPreguntas extends TextoLectura {
  num_preguntas: number;
}
