import { supabase } from "@/lib/supabase/client";

export const chatService = {
  // Obtener el límite actual (créditos restantes)
  async getChatLimit(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from("chat_limits")
      .select("limite_mensaje")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching chat limit:", error);
      throw error;
    }

    // Retorna los créditos restantes
    return data.limite_mensaje;
  },

  // Restar un crédito al límite
  async decrementChatLimit(userId: string): Promise<number | null> {
    // Primero obtenemos el valor actual para asegurarnos (o podríamos usar un RPC si fuera necesario atomicidad estricta)
    // Para simplificar, haremos una resta directa usando el valor que la UI ya debería haber validado,
    // pero una llamada RPC 'decrement_limit' sería lo ideal en producción.
    // Por ahora, leeremos y actualizaremos.

    const { data: currentData, error: fetchError } = await supabase
      .from("chat_limits")
      .select("limite_mensaje")
      .eq("user_id", userId)
      .single();

    if (fetchError || !currentData) throw fetchError;

    const newLimit = Math.max(0, currentData.limite_mensaje - 1);

    const { data, error } = await supabase
      .from("chat_limits")
      .update({ limite_mensaje: newLimit })
      .eq("user_id", userId)
      .select("limite_mensaje")
      .single();

    if (error) {
      console.error("Error decrementing chat limit:", error);
      throw error;
    }

    return data.limite_mensaje;
  },
};
