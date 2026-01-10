// app/page.tsx
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/login-form";
import { createSupabaseServer } from "@/lib/supabase/server";
import { InstallPrompt } from "@/components/install-prompt";

export default async function HomePage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div
      className="
      min-h-screen flex items-center justify-center px-4 py-10
      bg-linear-to-br
      from-slate-900 via-slate-900/95 to-slate-800
      dark:from-slate-950 dark:via-slate-900 dark:to-slate-800
    "
    >
      <div className="w-full max-w-md">
        {/* LOGO + TEXTO */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="edu-sentri"
              width={220}
              height={220}
              priority
              className="drop-shadow-md"
              loading="eager"
            />
          </div>

          <p className="text-sm text-slate-300">
            Accede a tu cuenta o prueba nuestro demo gratuito
          </p>
        </div>

        {/* CARD LOGIN */}
        <div
          className="
        rounded-xl
        bg-white/95 dark:bg-slate-900/90
        border border-white/10
        shadow-xl
        backdrop-blur-sm
      "
        >
          <div className="p-1 sm:p-4">
            <LoginForm />
          </div>
        </div>

        {/* ACCIONES */}
        <div className="mt-6 space-y-3">
          {/* DEMO */}
          <Link href="/prueba?tipo=demo">
            <Button
              variant="outline"
              className="
              text-gray-800
              w-full gap-2
              border-slate-600
              hover:bg-slate-700/50
              hover:text-white
              transition-all
              mb-4
              cursor-pointer
            "
            >
              Prueba Demo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          {/* INSTALAR APP */}
          <InstallPrompt />

          {/* WHATSAPP */}
          <div className="flex gap-2 justify-center w-full">
            <a
              href="https://wa.me/59175980130?text=Hola,%20quiero%20mas%20información%20sobre%20edu-sentri"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                className="
              w-full gap-2
              bg-green-600/90 hover:bg-green-600
              text-white
              transition-all
            "
              >
                <MessageCircle className="w-4 h-4" />
                Contáctanos por WhatsApp
              </Button>
            </a>
            {/* <a
              href="https://wa.me/59169401617?text=Hola,%20quiero%20mas%20información%20sobre%20edu-sentri."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                className="
              w-full gap-2
              bg-green-600/90 hover:bg-green-600
              text-white
              transition-all
            "
              >
                <MessageCircle className="w-4 h-4" />
                Contáctanos
              </Button>
            </a> */}
          </div>
        </div>
        <div className="mt-12 text-center flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <Link
            href="/terminos"
            className="hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            Términos
          </Link>
          <Link
            href="/politicas"
            className="hover:text-white transition-colors underline-offset-4 hover:underline"
          >
            Privacidad
          </Link>
          <span>&copy; 2025 EduSentri</span>
        </div>
      </div>
    </div>
  );
}
