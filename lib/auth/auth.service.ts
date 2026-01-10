import { supabase } from "@/lib/supabase/client"
import { getDeviceId } from "./device"

export async function login(email: string, password: string) {
  const deviceId = getDeviceId()

  // 1️⃣ LOGIN (esto crea la sesión + cookies)
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  if (!data.session || !data.user) {
    throw new Error("No se pudo iniciar sesión")
  }

  const user = data.user

  // 2️⃣ Verificar usuario activo
  const { data: perfil, error: perfilError } = await supabase
    .from("profiles")
    .select("activo")
    .eq("id", user.id)
    .single()

  if (perfilError || !perfil?.activo) {
    await supabase.auth.signOut()
    throw new Error("Usuario desactivado")
  }

  // 3️⃣ Verificar límite de dispositivos
  const { data: sesiones, error: sesionesError } = await supabase
    .from("user_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("activo", true)

  if (sesionesError) {
    await supabase.auth.signOut()
    throw new Error("Error al validar sesiones")
  }

  if (sesiones && sesiones.length >= 2) {
    await supabase.auth.signOut()
    throw new Error("Límite de dispositivos alcanzado")
  }

  // 4️⃣ Registrar sesión
  await supabase.from("user_sessions").insert({
    user_id: user.id,
    device_id: deviceId,
    user_agent: navigator.userAgent,
    activo: true,
  })

  // 🔑 DEVOLVER DATA COMPLETA
  return data
}
