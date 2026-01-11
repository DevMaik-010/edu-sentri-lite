-- Función para obtener prueba general
CREATE OR REPLACE FUNCTION public.obtener_prueba_general(preguntas_por_componente integer DEFAULT 25)
 RETURNS TABLE(id uuid, enunciado text, opciones jsonb, sustento text, dificultad text, activa boolean, componente_nombre text, disciplina_nombre text, num_pregunta integer, texto_lectura_id uuid)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH preguntas_seleccionadas AS (
        -- Seleccionar preguntas por componente de manera aleatoria
        SELECT 
            p.id,
            p.enunciado,
            p.opciones,
            p.sustento,
            p.dificultad,
            p.activa,
            c.nombre as componente_nombre,
            d.nombre as disciplina_nombre,
            p.num_pregunta,
            p.texto_lectura_id,
            ROW_NUMBER() OVER (
                PARTITION BY c.nombre 
                ORDER BY random()
            ) as rn
        FROM preguntas p
        JOIN componentes c ON p.componente_id = c.id
        LEFT JOIN disciplinas d ON p.disciplina_id = d.id
        WHERE p.activa = true
    )
    SELECT 
        ps.id,
        ps.enunciado,
        ps.opciones,
        ps.sustento,
        ps.dificultad::text,
        ps.activa,
        ps.componente_nombre,
        ps.disciplina_nombre,
        ps.num_pregunta,
        ps.texto_lectura_id
    FROM preguntas_seleccionadas ps
    WHERE ps.rn <= preguntas_por_componente;
END;
$function$;
