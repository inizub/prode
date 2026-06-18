// ============================================================
// GUARDADO Y LECTURA DE PREDICCIONES EN SUPABASE
// Todo el acceso a la base de datos de predicciones vive aquí,
// separado de la interfaz. Cada función maneja sus errores.
// ============================================================
import { supabase } from "./supabaseClient";

// Busca un participante por su token (el código de su link único).
// Devuelve { id, nombre } o null si no existe.
export async function buscarParticipantePorToken(token) {
  const { data, error } = await supabase
    .from("participantes")
    .select("id, nombre, activo")
    .eq("token", token)
    .single();
  if (error) {
    console.error("No se encontró el participante:", error);
    return null;
  }
  // Si está desactivado, su link ya no da acceso.
  if (data && data.activo === false) return null;
  return data;
}

// Lee la predicción guardada de un participante.
// Devuelve el objeto "datos" (o {} si aún no ha guardado nada).
export async function leerPrediccion(participanteId) {
  const { data, error } = await supabase
    .from("predicciones")
    .select("datos")
    .eq("participante_id", participanteId)
    .maybeSingle(); // maybeSingle: no falla si todavía no hay fila
  if (error) {
    console.error("Error al leer la predicción:", error);
    return {};
  }
  return data?.datos || {};
}

// Guarda (crea o actualiza) la predicción de un participante.
// "datos" es el objeto completo con todos los marcadores, bracket, etc.
export async function guardarPrediccion(participanteId, datos) {
  const { error } = await supabase.from("predicciones").upsert(
    {
      participante_id: participanteId,
      datos: datos,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "participante_id" } // si ya existe, la actualiza
  );
  if (error) {
    console.error("Error al guardar la predicción:", error);
    return false;
  }
  return true;
}