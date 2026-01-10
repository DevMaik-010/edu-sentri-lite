import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 🔑 sincroniza sesión (ESTO ES LO CRÍTICO)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;

  // 1. Proteger ruta /admin/usuarios
  if (path.startsWith("/admin/usuarios")) {
    if (!user) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Verificar rol de admin en la tabla "profiles"
    const { data: usuarioData, error } = await supabase
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (error || !usuarioData || usuarioData.rol !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // 2. Lógica para /prueba (Demo)
  if (path.startsWith("/prueba")) {
    const tipo = req.nextUrl.searchParams.get("tipo");

    // Si NO es demo y NO hay usuario, redirigir
    if (tipo !== "demo" && !user) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/estudiar/:path*",
    "/prueba/:path*",
    "/((?!_next|favicon.ico).*)",
  ],
};
