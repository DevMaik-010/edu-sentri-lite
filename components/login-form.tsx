"use client";

import type React from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { toast } from "react-hot-toast";
import { getDeviceId } from "@/lib/auth/device";


export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const deviceId = getDeviceId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await loginAction(email, password, deviceId);
      console.log(data);
      if (data?.error) {
        toast.error(data.error);
        return;
      }
    } catch (err: unknown) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }

    window.location.href = "/dashboard";
  };

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-xl text-slate-900 dark:text-slate-100">
          <Lock className="w-5 h-5 text-primary" />
          Iniciar sesión
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Ingresa tus credenciales para continuar
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* EMAIL */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-sm text-slate-700 dark:text-slate-300"
            >
              Correo electrónico
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  pl-10
                  bg-white dark:bg-slate-900
                  border-slate-200 dark:border-slate-700
                  focus-visible:ring-2
                  focus-visible:ring-primary/40
                "
                required
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-sm text-slate-700 dark:text-slate-300"
            >
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  pl-10
                  bg-white dark:bg-slate-900
                  border-slate-200 dark:border-slate-700
                  focus-visible:ring-2
                  focus-visible:ring-primary/40
                "
                required
              />
            </div>
          </div>

          {/* BOTÓN */}
          <Button
            type="submit"
            disabled={isLoading}
            className="
              w-full h-11 text-base
              bg-primary hover:bg-primary/90
              text-white
            "
          >
            {isLoading ? "Iniciando sesión…" : "Iniciar sesión"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
