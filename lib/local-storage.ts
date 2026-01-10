import { IntentoHistorico, PreguntaUI } from "@/types/pregunta";

const KEYS = {
  HISTORY: "edu_sentri_historial",
  MASTERY: "edu_sentri_mastery",
  ERRORS: "edu_sentri_errores",
  RECALL: "edu_sentri_recordar",
};

// --- HISTORIAL ---

export function getLocalHistory(): IntentoHistorico[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(KEYS.HISTORY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.map((item: IntentoHistorico & { fecha: string }) => ({
      ...item,
      fecha: new Date(item.fecha),
    }));
  } catch (error) {
    console.error("Error loading local history:", error);
    return [];
  }
}

export function saveLocalHistory(intento: IntentoHistorico): void {
  if (typeof window === "undefined") return;
  try {
    const history = getLocalHistory();
    // Buscar si ya existe un intento con este ID o con este Tipo+Area para actualizarlo
    const existingIndex = history.findIndex(
      (h) =>
        h.id === intento.id ||
        (h.tipo === intento.tipo &&
          h.area === intento.area &&
          (h.disciplina || null) === (intento.disciplina || null))
    );

    if (existingIndex !== -1) {
      // Reemplazar existente
      history[existingIndex] = intento;
    } else {
      // Agregar nuevo al inicio
      history.unshift(intento);
    }

    // Limitar a los últimos X si fuera necesario, pero la regla es 1 por área/tipo
    // Así que con el upsert anterior deberíamos mantenernos en el límite natural.

    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error("Error saving local history:", error);
  }
}

export function setLocalHistory(historial: IntentoHistorico[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(historial));
  } catch (error) {
    console.error("Error setting local history:", error);
  }
}

// --- MASTERY STATS ---

export function getLocalMastery(): Record<string, number> | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(KEYS.MASTERY);
    // Verificar si existe y si tiene timestamp válido (opcional, por ahora simple)
    // Podemos guardar { data: ..., timestamp: ... } si queremos expirar
    if (!data) return null;

    // Check old format validity or just return
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading local mastery:", error);
    return null;
  }
}

export function saveLocalMastery(stats: Record<string, number>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEYS.MASTERY, JSON.stringify(stats));
  } catch (error) {
    console.error("Error saving local mastery:", error);
  }
}

export function clearLocalMastery(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEYS.MASTERY);
}

// --- ERRORES / ACTIVE RECALL ---

export function getReviewQueue(): PreguntaUI[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(KEYS.ERRORS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading review queue:", error);
    return [];
  }
}

export function addToReviewQueue(pregunta: PreguntaUI): void {
  if (typeof window === "undefined") return;
  try {
    const queue = getReviewQueue();
    if (!queue.find((p) => p.id === pregunta.id)) {
      queue.push(pregunta);
      localStorage.setItem(KEYS.ERRORS, JSON.stringify(queue));
    }
  } catch (error) {
    console.error("Error adding to review queue:", error);
  }
}

export function removeFromReviewQueue(preguntaId: string): void {
  if (typeof window === "undefined") return;
  try {
    const queue = getReviewQueue();
    const filtered = queue.filter((p) => p.id !== preguntaId);
    localStorage.setItem(KEYS.ERRORS, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error removing from review queue:", error);
  }
}

export function clearReviewQueue(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEYS.ERRORS);
}

// --- ACTIVE SESSIONS ---

import { RespuestaUsuario } from "@/types/pregunta";

export interface ActiveSession {
  tipo: string;
  area: string | null;
  preguntas: PreguntaUI[];
  respuestas: RespuestaUsuario[];
  preguntaActual: number;
  timeLeft?: number; // Tiempo restante en segundos
  timestamp: number;
}

function getSessionKey(tipo: string, area?: string | null): string {
  // Sanitize area to avoid key issues
  const safeArea = area ? area.replace(/\s+/g, "_") : "general";
  return `edu_sentri_session_${tipo}_${safeArea}`;
}

export function getActiveSession(
  tipo: string,
  area?: string | null
): ActiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const key = getSessionKey(tipo, area);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error loading active session:", error);
    return null;
  }
}

export function saveActiveSession(session: ActiveSession): void {
  if (typeof window === "undefined") return;
  try {
    const key = getSessionKey(session.tipo, session.area);
    localStorage.setItem(key, JSON.stringify(session));
  } catch (error) {
    console.error("Error saving active session:", error);
  }
}

export function clearActiveSession(tipo: string, area?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const key = getSessionKey(tipo, area);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing active session:", error);
  }
}
