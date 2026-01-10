"use client";

import { useProfile } from "@/hooks/use-profile";
import { useEffect } from "react";

export function DevToolsBlocker() {
  const { profile, loading } = useProfile();

  useEffect(() => {
    // Si está cargando o es admin, no hacemos nada
    if (loading || profile?.rol === "admin") return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.ctrlKey && e.shiftKey && e.key === "C")
      ) {
        e.preventDefault();
      }

      // Ctrl+U (Ver código fuente)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profile, loading]);

  return null;
}
