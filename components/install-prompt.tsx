"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  if (isStandalone) {
    return null; // Don't show if already installed
  }

  // Si hay un evento capturado (Android/Chrome/Edge)
  if (deferredPrompt) {
    return (
      <Button
        onClick={handleInstallClick}
        variant="outline"
        className="
        mt-1 mb-8
          w-full gap-2
          bg-blue-400/90 hover:bg-blue-400/70
          border-blue-400
          text-gray-200
          hover:text-white
          transition-all
          cursor-pointer
        "
      >
        <Download className="w-4 h-4" />
        Instalar Aplicación
      </Button>
    );
  }

  // Si es iOS y no está instalado (Mostrar un mensaje o botón diferente, o nada por ahora para no saturar)
  // Por ahora lo dejaremos simple, solo para los que soportan beforeinstallprompt como pidió 'acceso directo'
  // Pero si el usuario insistiera en iOS, aquí pondríamos instrucciones.
  return null;
}
