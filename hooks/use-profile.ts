"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

// 🔹 Helper para leer cache una sola vez
function loadCachedUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("edu_sentri_user_cache");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useProfile() {
  const cached = loadCachedUser();

  // 🔹 Estados inicializados desde cache (NO useEffect)
  const [user, setUser] = useState<any>(cached?.user ?? null);
  const [email, setEmail] = useState<string>(cached?.email ?? "");
  const [profile, setProfile] = useState<Profile | null>(
    cached?.profile ?? null
  );
  const [loading, setLoading] = useState<boolean>(!cached);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      // 1️⃣ Obtener sesión real
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (!mounted) return;

        setUser(null);
        setEmail("");
        setProfile(null);
        setLoading(false);

        if (typeof window !== "undefined") {
          localStorage.removeItem("edu_sentri_user_cache");
        }
        return;
      }

      const currentUser = session.user;

      if (mounted) {
        setUser(currentUser);
        setEmail(currentUser.email || "");
      }

      // 2️⃣ Obtener perfil
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (!error && mounted) {
        setProfile(data);

        // 3️⃣ Guardar cache actualizado
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "edu_sentri_user_cache",
            JSON.stringify({
              user: currentUser,
              email: currentUser.email || "",
              profile: data,
            })
          );
        }
      }

      if (mounted) setLoading(false);
    };

    load();

    // 4️⃣ Escuchar cambios de sesión
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setEmail("");
        setProfile(null);
        setLoading(false);

        if (typeof window !== "undefined") {
          localStorage.removeItem("edu_sentri_user_cache");
        }
      } else {
        load();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    email,
    profile,
    loading,
  };
}
