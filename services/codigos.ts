import { supabase } from "@/lib/supabase/client";

export interface CodigoIntento {
  idx: number;
  id: string;
  codigo: string;
  valido: boolean;
  created_at: string;
  nombre: string | null;
  puntaje: number | null;
}

export const validarCodigo = async (
  codigo: string
): Promise<{ success: boolean; data?: CodigoIntento; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from("intentos_codigo")
      .select("*")
      .eq("codigo", codigo)
      .eq("valido", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Código inválido o no encontrado." };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: "Error de conexión." };
  }
};

export const actualizarNombre = async (
  codigo: string,
  nombre: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("intentos_codigo")
      .update({ nombre })
      .eq("codigo", codigo);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: "Error de conexión." };
  }
};

export const actualizarPuntaje = async (
  codigo: string,
  puntaje: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("intentos_codigo")
      .update({ puntaje })
      .eq("codigo", codigo);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: "Error de conexión." };
  }
};

export const obtenerRanking = async (): Promise<CodigoIntento[]> => {
  try {
    const { data, error } = await supabase
      .from("intentos_codigo")
      .select("*")
      .not("nombre", "is", null)
      .not("puntaje", "is", null)
      .order("puntaje", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching ranking:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("Error in obtaining ranking:", err);
    return [];
  }
};
