import { supabase } from "@/lib/supabase/client";

export interface CodigoIntento {
  id: string;
  codigo: string;
  valido: boolean;
  nombre?: string | null;
  created_at: string;
  puntaje?: number;
}

/**
 * Valida si un código existe y es válido.
 * Retorna el objeto del intento si es válido, o null si no.
 */
export async function validarCodigo(
  codigo: string
): Promise<CodigoIntento | null> {
  const { data, error } = await supabase
    .from("intentos_codigo")
    .select("*")
    .eq("codigo", codigo)
    .single();

  if (error || !data) {
    if (error && error.code !== "PGRST116") {
      // Ignorar error si no encuentra fila (PGRST116)
      console.error("Error validando código:", error);
    }
    return null;
  }

  // Verificar explícitamente el booleano 'valido'
  if (data.valido === true) {
    return data as CodigoIntento;
  }

  return null;
}

/**
 * Registra el nombre del usuario al iniciar el test.
 * Actualiza la fila correspondiente al código.
 */
export async function registrarInicio(
  codigo: string,
  nombre: string
): Promise<boolean> {
  const { error } = await supabase
    .from("intentos_codigo")
    .update({ nombre: nombre, valido: false })
    .eq("codigo", codigo);

  if (error) {
    console.error("Error registrando inicio de usuario:", error);
    return false;
  }

  return true;
}
