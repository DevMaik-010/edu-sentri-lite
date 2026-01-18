"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Loader2, MessageCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validarCodigo, registrarInicio } from "@/services/codigo";
import { clearActiveSession } from "@/lib/local-storage";
import { InstallPrompt } from "@/components/install-prompt";
import { decryptData } from "@/lib/crypto";

import toast from "react-hot-toast";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const decrypted = await decryptData(text);

      if (
        !decrypted ||
        !decrypted.preguntas ||
        !Array.isArray(decrypted.preguntas)
      ) {
        throw new Error("Formato de archivo inválido");
      }

      // Clear any existing active session to force a fresh start
      clearActiveSession("general", null);
      sessionStorage.removeItem("timeLeft"); // Clear specific timer if any

      // Store in session storage mimicking the "retry" mechanism
      sessionStorage.setItem(
        "session_test_data",
        JSON.stringify({
          preguntas: decrypted.preguntas,
          tipo: decrypted.tipo || "general",
          area: decrypted.area || null,
          tiempoRestante: 7200, // Reset timer to 2 hours
        }),
      );

      toast.success("Intento cargado");

      // Redirect with retry flag to force loading from session storage
      router.push("/prueba?retry=true");
    } catch (error) {
      console.error("Error loading file:", error);
      toast.error("Error al cargar el archivo");
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.codigo.trim()) {
      toast.error("Campos requeridos");
      return;
    }

    setLoading(true);

    try {
      // 1. Validar código
      const intento = await validarCodigo(formData.codigo.trim());

      if (!intento) {
        toast.error("Código inválido o ya fue usado.");
        setLoading(false);
        return;
      }

      // 2. Registrar inicio (actualizar nombre)
      const registrado = await registrarInicio(
        formData.codigo.trim(),
        formData.nombre.trim(),
      );

      if (!registrado) {
        toast.error("Error de registro");
        setLoading(false);
        return;
      }

      // 3. Guardar sesión local
      sessionStorage.setItem("user_name", formData.nombre.trim());
      sessionStorage.setItem("user_code", formData.codigo.trim());

      // 4. Redirigir a la prueba general
      toast.success("¡Acceso concedido!");

      router.push("/prueba?tipo=general&download=true");
    } catch (error) {
      console.error("Error en login:", error);
      toast.error("Error inesperado");
      setLoading(false);
    }
  };

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
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="edu-sentri"
              width={180}
              height={180}
              priority
              className="drop-shadow-2xl"
              loading="eager"
            />
          </div>
          <p className="text-base text-slate-400 mt-2">
            Plataforma de Evaluación
          </p>
        </div>

        {/* CARD ACCESO */}
        <div
          className="
        rounded-2xl
        bg-white/5 dark:bg-slate-900/50
        border border-white/10
        shadow-2xl
        backdrop-blur-md
        overflow-hidden
      "
        >
          <div className="p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-slate-200">
                  Nombre Completo
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Tu nombre y apellido"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo" className="text-slate-200">
                  Código de Acceso
                </Label>
                <Input
                  id="codigo"
                  name="codigo"
                  placeholder="Ingresa tu código"
                  value={formData.codigo}
                  onChange={handleChange}
                  className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 font-mono tracking-wider"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    Comenzar Prueba
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* ACCIONES EXTRA */}
        <div className="mt-8 space-y-4">
          <InstallPrompt />

          <a
            href="https://wa.me/59169401617?text=Hola,%20tengo%20problemas%20con%20mi%20código%20de%20acceso."
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button
              variant="outline"
              className="
              w-full gap-2
              bg-transparent hover:bg-white/5
              text-slate-300 hover:text-white
              border-slate-700/50 hover:border-slate-600
              transition-all
            "
            >
              <MessageCircle className="w-4 h-4 text-green-500" />
              Soporte por WhatsApp
            </Button>
          </a>

          <div className="pt-4 border-t border-slate-800/50">
            <input
              type="file"
              id="upload-test"
              className="hidden"
              accept=".esl"
              onChange={handleFileUpload}
            />
            <Button
              variant="ghost"
              className="w-full text-white hover:text-slate-300 hover:bg-white/5 text-sm border border-white hover:border-white/20 transition-all"
              onClick={() => document.getElementById("upload-test")?.click()}
              disabled={loading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Cargar Intento (.esl)
            </Button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-8 text-center flex items-center justify-center gap-6 text-xs text-slate-500">
          <Link href="#" className="hover:text-slate-300 transition-colors">
            Términos
          </Link>
          <Link href="#" className="hover:text-slate-300 transition-colors">
            Privacidad
          </Link>
          <span>&copy; 2026 EduSentri</span>
        </div>
      </div>
    </div>
  );
}
