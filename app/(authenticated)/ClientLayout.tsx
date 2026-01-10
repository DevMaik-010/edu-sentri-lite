"use client";

import type React from "react";
import { useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { GraduationCap, Trash2, Loader2 } from "lucide-react";
import { logoutAction } from "../actions/auth";
import { getDeviceId } from "@/lib/auth/device";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClearCacheDialogOpen, setIsClearCacheDialogOpen] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const handleLogout = async () => {
    const deviceId = getDeviceId();
    await logoutAction(deviceId);
  };

  const handleClearCache = () => {
    setIsClearingCache(true);
    try {
      // Get all keys from localStorage
      const keys = Object.keys(localStorage);

      // Filter and remove items that start with "texto_" or are temporary data
      const keysToRemove = keys.filter(
        (key) =>
          key.startsWith("texto_") ||
          key.startsWith("temp_") ||
          key === "edu_sentri_historial" ||
          key === "prueba_demo"
      );

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log(`Cache limpiado: ${keysToRemove.length} items eliminados`);

      // Close dialog and show success
      setIsClearCacheDialogOpen(false);

      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error("Error al limpiar cache:", error);
    } finally {
      setIsClearingCache(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar onLogout={handleLogout} />
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4 bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/80">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2 flex-1">
            <GraduationCap className="w-5 h-5 text-primary hidden sm:block" />
            <span className="font-semibold text-sm sm:text-base">
              Plataforma de Estudio
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto scrollbar-hide">{children}</div>
      </SidebarInset>

      <AlertDialog
        open={isClearCacheDialogOpen}
        onOpenChange={setIsClearCacheDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-yellow-700" />
              ¿Limpiar cache y datos temporales?
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mt-3 font-medium text-foreground">
                La página se recargará automáticamente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearingCache}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleClearCache();
              }}
              disabled={isClearingCache}
              className="bg-yellow-300/50 border-yellow-300 text-yellow-700 hover:bg-yellow-400/70 hover:text-yellow-600 hover:border-yellow-600 transition-colors"
            >
              {isClearingCache && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isClearingCache ? "Limpiando..." : "Limpiar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
