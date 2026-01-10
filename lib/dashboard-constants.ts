import { BookOpen, Brain, Lightbulb, Heart } from "lucide-react";

// Mapeo de colores por disciplina (con esencia conceptual y hex específicos)
export const coloresPorDisciplina: Record<
  string,
  { bg: string; border: string; text: string; progressHex: string }
> = {
  Lenguaje: {
    bg: "bg-blue-900/10",
    border: "border-blue-900/20",
    text: "text-blue-900",
    progressHex: "#1E3A8A", // Comunicación, expresión, claridad verbal
  },
  Geografía: {
    bg: "bg-green-800/10",
    border: "border-green-800/20",
    text: "text-green-800",
    progressHex: "#2E7D32", // Naturaleza, territorio, mapas
  },
  "Identificación de Patrones": {
    bg: "bg-purple-900/10",
    border: "border-purple-900/20",
    text: "text-purple-900",
    progressHex: "#6A1B9A", // Abstracción, conexiones mentales
  },
  "Técnica Tecnológica": {
    bg: "bg-cyan-700/10",
    border: "border-cyan-700/20",
    text: "text-cyan-700",
    progressHex: "#0288D1", // Innovación, sistemas, tecnología
  },
  Química: {
    bg: "bg-emerald-600/10",
    border: "border-emerald-600/20",
    text: "text-emerald-700",
    progressHex: "#00A86B", // Reacciones, laboratorio, ciencia aplicada
  },
  "Problemas Matemático": {
    bg: "bg-orange-700/10",
    border: "border-orange-700/20",
    text: "text-orange-700",
    progressHex: "#F57C00", // Reto, análisis, resolución
  },
  Psicología: {
    bg: "bg-pink-700/10",
    border: "border-pink-700/20",
    text: "text-pink-700",
    progressHex: "#C2185B", // Emoción, mente, conducta humana
  },
  Matemática: {
    bg: "bg-red-800/10",
    border: "border-red-800/20",
    text: "text-red-800",
    progressHex: "#C62828", // Precisión, rigor, lógica formal
  },
  Biología: {
    bg: "bg-green-600/10",
    border: "border-green-600/20",
    text: "text-green-600",
    progressHex: "#4CAF50", // Vida, organismos, equilibrio
  },
  "Razonamiento Lógico Matemático": {
    bg: "bg-indigo-800/10",
    border: "border-indigo-800/20",
    text: "text-indigo-800",
    progressHex: "#303F9F", // Pensamiento estructurado, lógica
  },
  Filosofía: {
    bg: "bg-gray-700/10",
    border: "border-gray-700/20",
    text: "text-gray-700",
    progressHex: "#424242", // Reflexión, pensamiento crítico
  },
  Historia: {
    bg: "bg-amber-900/10",
    border: "border-amber-900/20",
    text: "text-amber-900",
    progressHex: "#6D4C41", // Pasado, cultura, tradición
  },
  Física: {
    bg: "bg-blue-800/10",
    border: "border-blue-800/20",
    text: "text-blue-800",
    progressHex: "#1565C0", // Energía, leyes naturales
  },
};

export const iconosPorArea = {
  "Comprensión Lectora": BookOpen,
  "Razonamiento Lógico": Brain,
  "Conocimientos Generales": Lightbulb,
  "Habilidades Socioemocionales": Heart,
};

// Colores por área con hex específicos
export const coloresPorArea: Record<
  string,
  { text: string; progressHex: string }
> = {
  "Comprensión Lectora": {
    text: "text-[#0F4C75]",
    progressHex: "#0F4C75", // Azul petróleo - Análisis, interpretación profunda
  },
  "Razonamiento Lógico": {
    text: "text-[#3949AB]",
    progressHex: "#3949AB", // Índigo medio - Secuencia, lógica, inferencia
  },
  "Conocimientos Generales": {
    text: "text-[#6B8E23]",
    progressHex: "#6B8E23", // Verde oliva - Cultura general, saber amplio
  },
  "Habilidades Socioemocionales": {
    text: "text-[#F9A825]",
    progressHex: "#F9A825", // Naranja cálido - Empatía, interacción, emociones
  },
};

// Función helper para obtener clase de color de progreso basado en el porcentaje
export const getProgressColorClass = (valor: number): string => {
  if (valor >= 80) return "bg-green-600";
  if (valor >= 60) return "bg-blue-700";
  if (valor >= 40) return "bg-blue-500";
  return "bg-red-500";
};

// Función helper para obtener clase de color de texto basado en el porcentaje
export const getTextColorClass = (valor: number): string => {
  if (valor >= 80) return "text-green-600";
  if (valor >= 60) return "text-blue-600";
  if (valor >= 40) return "text-orange-600";
  return "text-red-600";
};

// Función helper para obtener colores de background/border basado en el porcentaje
export const getBackgroundClasses = (valor: number) => {
  if (valor >= 80) {
    return {
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800/30",
    };
  }
  if (valor >= 60) {
    return {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800/30",
    };
  }
  if (valor >= 40) {
    return {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-200 dark:border-orange-800/30",
    };
  }
  return {
    bg: "bg-red-50 dark:bg-red-900/10",
    border: "border-red-100 dark:border-red-900/20",
  };
};
