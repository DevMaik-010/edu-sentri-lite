import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function crearUsuario() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: "cliente@correo.com",
    password: "ClaveSegura123",
    email_confirm: true,
  })

  if (error) throw error
  console.log("Usuario creado:", data.user.email)
}

crearUsuario()
