import type {
  IntentoHistorico,
  RespuestaUsuario,
  PreguntaUI,
} from "@/types/pregunta";

import { supabase } from "@/lib/supabase/client";
import {
  getLocalHistory,
  setLocalHistory,
  saveLocalHistory,
  getLocalMastery,
  saveLocalMastery,
  clearLocalMastery,
} from "@/lib/local-storage";

export interface GuardarIntentoParams {
  tipo: string;
  area?: string;
  totalPreguntas: number;
  correctas: number;
  incorrectas: number;
  porcentaje: number;
  preguntas: PreguntaUI[];
  respuestas: RespuestaUsuario[];
  disciplina?: string | null;
}

/**
 * Guarda un intento en Supabase y localStorage
 * Lógica simple:
 * 1. Verificar localStorage para comparar
 * 2. Si es mejor o no existe → Guardar en Supabase
 * 3. Actualizar localStorage
 */
export async function guardarIntentoSupabase(
  params: GuardarIntentoParams
): Promise<{
  success: boolean;
  error?: string;
  intentoId?: string;
  mejorado?: boolean;
  guardadoLocal?: boolean;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Usuario no autenticado" };
    }

    const tableName = "intentos";

    // Unificación de lógica:
    // params.tipo 'practica' se guarda como 'tipo': 'practica' en la DB.
    // params.area se guarda en 'area' (si existe).
    // params.disciplina se guarda en 'disciplina' (si existe).

    console.log(
      `\n🔍 Guardando intento (${tableName}): tipo=${params.tipo}, area=${
        params.area || "general"
      }, %=${params.porcentaje}, disciplina=${params.disciplina || "N/A"}`
    );

    // PASO 1: Verificar localStorage primero
    const historialLocal = getLocalHistory();
    const intentoPrevioLocal = historialLocal.find((h) => {
      // Comparación estricta para identificar el mismo "slot" de intento
      const mismoTipo = h.tipo === params.tipo;
      const mismaArea = h.area === params.area;
      // Normalizar null/undefined
      const mismaDisciplina =
        (h.disciplina || null) === (params.disciplina || null);

      return mismoTipo && mismaArea && mismaDisciplina;
    });

    if (intentoPrevioLocal) {
      console.log(
        `📊 Intento previo en localStorage: ${intentoPrevioLocal.porcentaje}% (${intentoPrevioLocal.totalPreguntas}p)`
      );

      const mejoraLocal = params.porcentaje > intentoPrevioLocal.porcentaje;
      const cantidadValidaLocal =
        params.totalPreguntas >= intentoPrevioLocal.totalPreguntas;

      if (!mejoraLocal || !cantidadValidaLocal) {
        console.log(
          `⏭️ No hay mejora suficiente: (${params.porcentaje}%, ${params.totalPreguntas}p) vs Local(${intentoPrevioLocal.porcentaje}%, ${intentoPrevioLocal.totalPreguntas}p)`
        );
        return {
          success: true,
          intentoId: intentoPrevioLocal.id,
          mejorado: false,
          guardadoLocal: false,
        };
      }
      console.log(
        `✓ Mejora detectada: ${intentoPrevioLocal.porcentaje}% → ${params.porcentaje}%`
      );
    }

    // PASO 2: Buscar en Supabase
    let queryBuilder = supabase
      .from(tableName)
      .select("id, porcentaje, total_preguntas")
      .eq("user_id", user.id)
      .eq("tipo", params.tipo);

    if (params.area) {
      queryBuilder = queryBuilder.eq("area", params.area);
    } else {
      queryBuilder = queryBuilder.is("area", null);
    }

    if (params.disciplina) {
      queryBuilder = queryBuilder.eq("disciplina", params.disciplina);
    } else {
      queryBuilder = queryBuilder.is("disciplina", null);
    }

    const { data: registroExistente, error: errorBusqueda } =
      await queryBuilder.maybeSingle();

    if (errorBusqueda) {
      console.error("❌ Error buscando en Supabase:", errorBusqueda);
      // Guardar solo en localStorage como fallback
      const intentoLocal: IntentoHistorico = {
        id: `local_${Date.now()}`,
        fecha: new Date(),
        tipo: params.tipo,
        area: params.area,
        totalPreguntas: params.totalPreguntas,
        correctas: params.correctas,
        incorrectas: params.incorrectas,
        porcentaje: params.porcentaje,
        disciplina: params.disciplina || undefined,
      };
      saveLocalHistory(intentoLocal);
      return {
        success: false,
        error: "Error de conexión con Supabase",
        guardadoLocal: true,
      };
    }

    let intentoId: string;

    // PASO 3: Crear o Actualizar en Supabase
    if (registroExistente) {
      // Verificar mejora contra DB
      const dbPorcentaje = registroExistente.porcentaje;
      const dbTotalPreguntas = registroExistente.total_preguntas;

      const mejoraPorcentaje = params.porcentaje > dbPorcentaje;
      const cantidadValida = params.totalPreguntas >= dbTotalPreguntas;

      if (!mejoraPorcentaje || !cantidadValida) {
        console.log(
          `⏭️ No mejora registro DB: DB(${dbPorcentaje}%, ${dbTotalPreguntas}p) vs New(${params.porcentaje}%, ${params.totalPreguntas}p)`
        );
        return {
          success: true,
          intentoId: registroExistente.id,
          mejorado: false,
          guardadoLocal: false,
        };
      }

      // ACTUALIZAR
      console.log(
        `🔄 Actualizando registro existente: ${registroExistente.id}`
      );
      intentoId = registroExistente.id;

      const updateData: any = {
        total_preguntas: params.totalPreguntas,
        correctas: params.correctas,
        incorrectas: params.incorrectas,
        porcentaje: params.porcentaje,
        fecha: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from(tableName)
        .update(updateData)
        .eq("id", intentoId);

      if (updateError) {
        console.error("❌ Error actualizando:", updateError);
        return {
          success: false,
          error: "Error al actualizar en Supabase",
        };
      }

      // Limpiar respuestas antiguas
      await supabase
        .from("respuestas_usuario")
        .delete()
        .eq("intento_id", intentoId);
    } else {
      // CREAR NUEVO
      console.log(`➕ Creando nuevo registro`);

      const insertData: any = {
        user_id: user.id,
        tipo: params.tipo,
        area: params.area || null,
        disciplina: params.disciplina || null,
        total_preguntas: params.totalPreguntas,
        correctas: params.correctas,
        incorrectas: params.incorrectas,
        porcentaje: params.porcentaje,
        // fecha suele ser default now() o podemos mandarla
        // fecha: new Date().toISOString(),
      };

      const { data: nuevoIntento, error: insertError } = await supabase
        .from(tableName)
        .insert(insertData)
        .select("id")
        .single();

      if (insertError || !nuevoIntento) {
        console.error("❌ Error creando:", insertError);
        return {
          success: false,
          error: "Error al crear en Supabase",
        };
      }

      intentoId = nuevoIntento.id;
    }

    // PASO 4: Guardar respuestas
    // Se guardan respuestas para todos los tipos si vienen presentes
    if (params.respuestas && params.respuestas.length > 0) {
      const respuestasParaGuardar = params.respuestas.map((respuesta) => {
        const pregunta = params.preguntas.find(
          (p) => p.id === respuesta.preguntaId
        );
        const esCorrecta = pregunta
          ? respuesta.respuestaSeleccionada ===
            pregunta.opciones.find((o) => o.es_correcta)?.clave
          : false;

        return {
          intento_id: intentoId,
          pregunta_id: respuesta.preguntaId,
          respuesta_seleccionada: respuesta.respuestaSeleccionada,
          es_correcta: esCorrecta,
        };
      });

      const { error: respuestasError } = await supabase
        .from("respuestas_usuario")
        .insert(respuestasParaGuardar);

      if (respuestasError) {
        console.error("⚠️ Error guardando respuestas:", respuestasError);
      }
    }

    // PASO 5: Actualizar localStorage
    const intentoLocal: IntentoHistorico = {
      id: intentoId,
      fecha: new Date(),
      tipo: params.tipo,
      area: params.area,
      totalPreguntas: params.totalPreguntas,
      correctas: params.correctas,
      incorrectas: params.incorrectas,
      porcentaje: params.porcentaje,
      disciplina: params.disciplina || undefined,
    };
    saveLocalHistory(intentoLocal);

    console.log(`✅ Intento guardado exitosamente`);
    // Limpiar cache de maestría para forzar recarga
    clearLocalMastery();

    return {
      success: true,
      intentoId,
      mejorado: true,
      guardadoLocal: true,
    };
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return { success: false, error: "Error inesperado" };
  }
}

/**
 * Obtiene el historial de intentos
 * 1. Primero intenta desde localStorage
 * 2. Si no hay, obtiene de Supabase y cachea
 */
export async function obtenerHistorialSupabase(): Promise<IntentoHistorico[]> {
  try {
    // 1. Verificar localStorage primero
    const cachedHistory = getLocalHistory();
    if (cachedHistory && cachedHistory.length > 0) {
      console.log(
        `📦 Usando historial desde localStorage (${cachedHistory.length} intentos)`
      );
      return cachedHistory;
    }

    // 2. Obtener de Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    console.log(`🔍 Obteniendo historial desde Supabase`);
    const { data, error } = await supabase
      .from("intentos")
      .select("*")
      .eq("user_id", user.id)
      .order("fecha", { ascending: false });

    if (error) {
      console.error("❌ Error obteniendo historial:", error);
      return [];
    }

    // 3. Transformar y cachear
    const historial: IntentoHistorico[] = (data || []).map((intento) => ({
      id: intento.id,
      fecha: new Date(intento.fecha),
      tipo: intento.tipo,
      area: intento.area || undefined,
      totalPreguntas: intento.total_preguntas,
      correctas: intento.correctas,
      incorrectas: intento.incorrectas,
      porcentaje: intento.porcentaje,
      disciplina: intento.disciplina || undefined,
    }));

    setLocalHistory(historial);
    console.log(
      `✅ Historial obtenido y cacheado (${historial.length} intentos)`
    );

    return historial;
  } catch (error) {
    console.error("❌ Error inesperado obteniendo historial:", error);
    return [];
  }
}

/**
 * Obtiene los detalles de un intento específico
 */
export async function obtenerIntentoDetalle(intentoId: string) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Buscar el intento
    const { data: intento, error: intentoError } = await supabase
      .from("intentos")
      .select("*")
      .eq("id", intentoId)
      .eq("user_id", user.id)
      .single();

    if (intentoError || !intento) {
      console.error("Error al obtener intento:", intentoError);
      return null;
    }

    // Obtener las respuestas
    const { data: respuestas, error: respuestasError } = await supabase
      .from("respuestas_usuario")
      .select("*")
      .eq("intento_id", intentoId);

    if (respuestasError) {
      console.error("Error al obtener respuestas:", respuestasError);
      return null;
    }

    return {
      intento: {
        id: intento.id,
        fecha: new Date(intento.fecha),
        tipo: intento.tipo,
        area: intento.area || undefined,
        totalPreguntas: intento.total_preguntas,
        correctas: intento.correctas,
        incorrectas: intento.incorrectas,
        porcentaje: intento.porcentaje,
      },
      respuestas: respuestas.map((r) => ({
        id: r.id,
        preguntaId: r.pregunta_id,
        respuestaSeleccionada: r.respuesta_seleccionada,
        esCorrecta: r.es_correcta,
      })),
    };
  } catch (error) {
    console.error("Error inesperado al obtener detalle del intento:", error);
    return null;
  }
}

/**
 * Obtiene estadísticas de maestría por área
 */
export async function obtenerEstadisticasMastery() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // 0. Intentar cargar desde localStorage primero
    const cachedMastery = getLocalMastery();
    if (cachedMastery) {
      console.log("📦 Usando estadísticas de maestría desde localStorage");
      return cachedMastery;
    }

    // 1. Obtener IDs de intentos del usuario (EXCLUYENDO PRÁCTICAS)
    const { data: intentos } = await supabase
      .from("intentos")
      .select("id")
      .eq("user_id", user.id)
      .neq("tipo", "practica"); // Solo contar pruebas reales (general, area, demo)

    if (!intentos || intentos.length === 0) return {};

    const intentoIds = intentos.map((i) => i.id);

    // 2. Obtener respuestas para esos intentos
    const { data: respuestas, error: errorRespuestas } = await supabase
      .from("respuestas_usuario")
      .select("pregunta_id, es_correcta")
      .in("intento_id", intentoIds);

    if (errorRespuestas || !respuestas || respuestas.length === 0) {
      return {};
    }

    // Obtener los IDs de preguntas únicos
    const preguntaIds = Array.from(
      new Set(respuestas.map((r) => r.pregunta_id))
    );

    // Obtener info de las preguntas (áreas)
    const { data: preguntasInfo, error: errorPreguntas } = await supabase
      .from("preguntas")
      .select("id, componentes!inner(nombre)")
      .in("id", preguntaIds);

    if (errorPreguntas) {
      console.error("Error al obtener info de preguntas:", errorPreguntas);
      return null;
    }

    // Mapa de preguntaId -> areas[]
    interface PreguntaInfo {
      id: string;
      componentes: { nombre: string }[] | { nombre: string } | null;
    }

    const mapaPreguntasAreas = new Map<string, string[]>();
    (preguntasInfo as unknown as PreguntaInfo[])?.forEach((p) => {
      const componentesRaw = p.componentes;
      const componentes = Array.isArray(componentesRaw)
        ? componentesRaw
        : [componentesRaw].filter(Boolean);

      const areas = componentes.map((c) => c?.nombre).filter(Boolean);
      if (areas.length > 0) {
        mapaPreguntasAreas.set(p.id, areas as string[]);
      }
    });

    const statsPorArea: {
      [key: string]: { attempted: Set<string>; correct: Set<string> };
    } = {};

    // Procesar respuestas
    respuestas.forEach((row) => {
      const areas = mapaPreguntasAreas.get(row.pregunta_id);

      if (!areas) return;

      areas.forEach((area) => {
        if (!statsPorArea[area]) {
          statsPorArea[area] = {
            attempted: new Set(),
            correct: new Set(),
          };
        }

        statsPorArea[area].attempted.add(row.pregunta_id);
        if (row.es_correcta) {
          statsPorArea[area].correct.add(row.pregunta_id);
        }
      });
    });

    // Calcular porcentajes
    const resultados: { [key: string]: number } = {};
    Object.entries(statsPorArea).forEach(([area, sets]) => {
      const totalUnicas = sets.attempted.size;
      const totalCorrectasUnicas = sets.correct.size;
      resultados[area] =
        totalUnicas > 0 ? (totalCorrectasUnicas / totalUnicas) * 100 : 0;
    });

    // Guardar en cache
    saveLocalMastery(resultados);
    console.log("✅ Estadísticas de maestría cacheadas");

    return resultados;
  } catch (error) {
    console.error("Error inesperado en estadísticas mastery:", error);
    return null;
  }
}
