import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()
  const { email, password, nombre } = body

  if (!email || !password) {
    return NextResponse.json(
      { error: "Datos incompletos" },
      { status: 400 }
    )
  }

  // Crear usuario en Auth
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Actualizar perfil (ya creado por trigger)
  await supabaseAdmin
    .from("profiles")
    .update({ nombre })
    .eq("id", data.user.id)

  return NextResponse.json({ ok: true })
}
