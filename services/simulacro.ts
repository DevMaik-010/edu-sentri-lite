import { supabase } from "@/lib/supabase/client";
import { mapPreguntaGeneralRPCtoUI } from "./preguta.mapper";
import type { PreguntaUI } from "@/types/pregunta";

export async function obtenerPruebaGeneral(): Promise<PreguntaUI[]> {
  try {
    const { data, error } = await supabase.rpc("obtener_prueba_general");

    if (error) {
      console.error("Error fetching general test:", error);
      throw error;
    }

    if (!data) return [];

    // Map RPC result to UI model
    return (data as any[]).map((p) => mapPreguntaGeneralRPCtoUI(p));
  } catch (error) {
    console.error("Error in obtenerPruebaGeneral:", error);
    return [];
  }
}

export async function obtenerPruebaDemo(): Promise<PreguntaUI[]> {
  try {
    const { data, error } = await supabase.rpc("obtener_prueba_demo");

    if (error) {
      console.error("Error fetching demo test:", error);
      throw error;
    }

    if (!data) return [];

    // Map RPC result to UI model
    return (data as any[]).map((p) => mapPreguntaGeneralRPCtoUI(p));
  } catch (error) {
    console.error("Error in obtenerPruebaDemo:", error);
    return [];
  }
}
