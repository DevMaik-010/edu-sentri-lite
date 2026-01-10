export type Componente = {
  id?: string;
  nombre: string;
  descripcion?: string;
};

export type Disciplina = {
  id?: string;
  componente_id?: string;
  nombre?: string;
  descripcion?: string;
};

export interface Profile {
  idx: number;
  id: string;
  nombre: string;
  activo: boolean;
  rol: string;
  fecha_registro: string;
  ultimo_acceso: string | null;
}
