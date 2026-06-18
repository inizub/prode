// ============================================================
// LÓGICA DEL PANEL DE ADMIN
// Crear participantes y generar sus links únicos.
// (Meter resultados y cerrar predicciones llegan en la Etapa 5b.)
// ============================================================
import { supabase } from "./supabaseClient";

// Contraseña de admin. Protección sencilla para uso entre amigos.
export const CLAVE_ADMIN = "ArgentinaCampeon2026";

// Trae todos los participantes con su token (para construir sus links).
export async function listarParticipantes() {
  const { data, error } = await supabase
    .from("participantes")
    .select("id, nombre, token, creado_en, activo")
    .order("creado_en", { ascending: true });
  if (error) {
    console.error("Error al listar participantes:", error);
    return [];
  }
  return data;
}

// Crea un participante nuevo. Devuelve el participante creado (con su token).
export async function crearParticipante(nombre) {
  const limpio = (nombre || "").trim();
  if (!limpio) return { error: "El nombre no puede estar vacío." };

  const { data, error } = await supabase
    .from("participantes")
    .insert({ nombre: limpio })
    .select("id, nombre, token")
    .single();

  if (error) {
    console.error("Error al crear participante:", error);
    return { error: "No se pudo crear el participante." };
  }
  return { participante: data };
}

// Construye el link único de un participante a partir de su token.
// Usa la dirección actual de la app (sirve igual en StackBlitz y en Vercel).
export function construirLink(token) {
  const base = window.location.origin + window.location.pathname;
  return `${base}?jugador=${token}`;
}

// ============================================================
// ETAPA 5b: Resultados reales + cerrar/abrir predicciones
// ============================================================

// Lee todos los resultados reales guardados.
// Devuelve { "G-A1": {local: 2, visita: 1}, ... }
export async function leerResultados() {
  const { data, error } = await supabase
    .from("resultados")
    .select("partido_id, goles_local, goles_visita");
  if (error) {
    console.error("Error al leer resultados:", error);
    return {};
  }
  const mapa = {};
  for (const r of data) {
    mapa[r.partido_id] = { local: r.goles_local, visita: r.goles_visita };
  }
  return mapa;
}

// Guarda (crea o actualiza) el resultado real de un partido.
export async function guardarResultado(partidoId, golesLocal, golesVisita) {
  // Validación: números enteros >= 0
  const gl = Number(golesLocal);
  const gv = Number(golesVisita);
  if (
    golesLocal === "" || golesVisita === "" ||
    Number.isNaN(gl) || Number.isNaN(gv) ||
    gl < 0 || gv < 0
  ) {
    return { error: "Marcador inválido." };
  }
  const { error } = await supabase.from("resultados").upsert(
    {
      partido_id: partidoId,
      goles_local: gl,
      goles_visita: gv,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "partido_id" }
  );
  if (error) {
    console.error("Error al guardar resultado:", error);
    return { error: "No se pudo guardar." };
  }
  return { ok: true };
}

// Borra el resultado de un partido (por si te equivocas).
export async function borrarResultado(partidoId) {
  const { error } = await supabase
    .from("resultados")
    .delete()
    .eq("partido_id", partidoId);
  if (error) {
    console.error("Error al borrar resultado:", error);
    return { error: "No se pudo borrar." };
  }
  return { ok: true };
}

// Lee si las predicciones están abiertas (true) o cerradas (false).
// Lee si las predicciones (fase de grupos) están abiertas. Si la fila no existe, asume abiertas.
export async function leerPrediccionesAbiertas() {
  const { data, error } = await supabase
    .from("config")
    .select("valor")
    .eq("clave", "predicciones_abiertas")
    .maybeSingle();
  if (error) {
    console.error("Error al leer estado de predicciones:", error);
    return true;
  }
  if (!data) return true; // nunca se guardó -> por defecto abiertas
  return data.valor === true;
}

// Cambia el estado (abiertas/cerradas). upsert: crea la fila si no existe.
export async function cambiarPrediccionesAbiertas(abiertas) {
  const { error } = await supabase
    .from("config")
    .upsert({ clave: "predicciones_abiertas", valor: abiertas }, { onConflict: "clave" });
  if (error) {
    console.error("Error al cambiar estado:", error);
    return { error: "No se pudo cambiar el estado." };
  }
  return { ok: true };
}

// ============================================================
// ETAPA 7c: Bracket real (resultados de eliminatorias que mete el admin)
// Se guarda en config con la clave "bracket_real".
// ============================================================

// Lee el bracket real guardado: { marcadoresElim, avancesElim, correccionesR32 }
export async function leerBracketReal() {
  const { data, error } = await supabase
    .from("config")
    .select("valor")
    .eq("clave", "bracket_real")
    .maybeSingle();
  if (error) {
    console.error("Error al leer bracket real:", error);
    return { marcadoresElim: {}, avancesElim: {}, correccionesR32: {} };
  }
  return data?.valor || { marcadoresElim: {}, avancesElim: {}, correccionesR32: {} };
}

// Guarda el bracket real.
export async function guardarBracketReal(bracketReal) {
  // upsert por si la clave aún no existe
  const { error } = await supabase
    .from("config")
    .upsert({ clave: "bracket_real", valor: bracketReal }, { onConflict: "clave" });
  if (error) {
    console.error("Error al guardar bracket real:", error);
    return { error: "No se pudo guardar." };
  }
  return { ok: true };
}

// ============================================================
// Borrar / desactivar participantes
// ============================================================

// Desactiva o reactiva un participante (Opción B, reversible).
// Su link deja de funcionar y no aparece en la tabla de posiciones,
// pero sus datos se conservan.
export async function cambiarActivoParticipante(id, activo) {
  const { error } = await supabase
    .from("participantes")
    .update({ activo })
    .eq("id", id);
  if (error) {
    console.error("Error al cambiar estado del participante:", error);
    return { error: "No se pudo cambiar el estado." };
  }
  return { ok: true };
}

// Borra un participante DEFINITIVAMENTE junto con su predicción (Opción A).
// Irreversible. La predicción se borra sola por el "on delete cascade".
export async function borrarParticipante(id) {
  const { error } = await supabase
    .from("participantes")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("Error al borrar participante:", error);
    return { error: "No se pudo borrar." };
  }
  return { ok: true };
}

// ============================================================
// Adjudicación manual de premios (Etapa 8)
// Se guarda en config con la clave "premios_adjudicados".
// Estructura: { botaOro:[idParticipante,...], balonOro:[...], asistidor:[...], joven:[...] }
// ============================================================

export async function leerPremiosAdjudicados() {
  const { data, error } = await supabase
    .from("config")
    .select("valor")
    .eq("clave", "premios_adjudicados")
    .maybeSingle();
  if (error) {
    console.error("Error al leer premios adjudicados:", error);
    return {};
  }
  return data?.valor || {};
}

export async function guardarPremiosAdjudicados(adjudicaciones) {
  const { error } = await supabase
    .from("config")
    .upsert({ clave: "premios_adjudicados", valor: adjudicaciones }, { onConflict: "clave" });
  if (error) {
    console.error("Error al guardar premios adjudicados:", error);
    return { error: "No se pudo guardar." };
  }
  return { ok: true };
}

// Lee las predicciones de premios de todos los participantes (lo que escribieron).
// Devuelve [{ id, nombre, premios: {botaOro, balonOro, asistidor, joven} }]
export async function leerPremiosDeParticipantes() {
  const { data: participantes, error: e1 } = await supabase
    .from("participantes")
    .select("id, nombre")
    .order("nombre", { ascending: true });
  if (e1) {
    console.error(e1);
    return [];
  }
  const { data: predicciones, error: e2 } = await supabase
    .from("predicciones")
    .select("participante_id, datos");
  if (e2) {
    console.error(e2);
    return [];
  }
  const porId = {};
  for (const pr of predicciones) porId[pr.participante_id] = pr.datos?.premios || {};
  return participantes.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    premios: porId[p.id] || {},
  }));
}

// Lee los marcadores de fase de grupos de TODOS los participantes. Solo lectura.
// Devuelve { idParticipante: { "G-A1": {local, visita}, ... } }
export async function leerMarcadoresDeParticipantes() {
  const { data: predicciones, error } = await supabase
    .from("predicciones")
    .select("participante_id, datos");
  if (error) {
    console.error("Error al leer marcadores de participantes:", error);
    return {};
  }
  const porId = {};
  for (const pr of predicciones) {
    porId[pr.participante_id] = pr.datos?.marcadoresGrupos || {};
  }
  return porId;
}

// Lee los marcadores de ELIMINATORIAS de TODOS los participantes. Solo lectura.
// Devuelve { idParticipante: { M73: {local, visita}, ... } }
export async function leerMarcadoresElimDeParticipantes() {
  const { data: predicciones, error } = await supabase
    .from("predicciones")
    .select("participante_id, datos");
  if (error) {
    console.error("Error al leer marcadores de eliminatorias:", error);
    return {};
  }
  const porId = {};
  for (const pr of predicciones) {
    porId[pr.participante_id] = pr.datos?.bracket?.marcadores || {};
  }
  return porId;
}

// ============================================================
// Borrar TODOS los resultados reales (para empezar el Mundial limpio).
// Borra: resultados de grupos + bracket real + premios adjudicados.
// NO toca las predicciones de los participantes.
// ============================================================
export async function borrarTodosLosResultados() {
  // 1) Borrar todos los resultados de grupos
  const { error: e1 } = await supabase
    .from("resultados")
    .delete()
    .neq("partido_id", ""); // borra todas las filas
  // 2) Borrar el bracket real (clave en config)
  const { error: e2 } = await supabase
    .from("config")
    .delete()
    .eq("clave", "bracket_real");
  // 3) Borrar las adjudicaciones de premios
  const { error: e3 } = await supabase
    .from("config")
    .delete()
    .eq("clave", "premios_adjudicados");

  if (e1 || e2 || e3) {
    console.error("Error al borrar resultados:", e1, e2, e3);
    return { error: "Hubo un problema al borrar." };
  }
  return { ok: true };
}

// ============================================================
// ESTADO DE RONDAS (modo por fases) — clave "estado_rondas" en config
// Cada ronda eliminatoria tiene uno de tres estados:
//   "pendiente" (bloqueada) · "abierta" (los jugadores ponen marcadores) · "cerrada" (solo ver)
// (La fase de grupos sigue controlándose con "predicciones_abiertas".)
// ============================================================

// Lista ordenada de rondas eliminatorias (la usa el admin y, luego, las pantallas).
export const RONDAS_ELIM = [
  { clave: "R32", nombre: "Ronda de 32 (dieciseisavos)" },
  { clave: "R16", nombre: "Octavos de final" },
  { clave: "CUARTOS", nombre: "Cuartos de final" },
  { clave: "SEMIS", nombre: "Semifinales" },
  { clave: "FINAL", nombre: "Final y 3er lugar" },
];

// Estado por defecto: todo pendiente.
export function estadoRondasPorDefecto() {
  const e = {};
  for (const r of RONDAS_ELIM) e[r.clave] = "pendiente";
  return e;
}

// Lee el estado de las rondas. Si nunca se guardó, devuelve todo "pendiente".
export async function leerEstadoRondas() {
  const { data, error } = await supabase
    .from("config")
    .select("valor")
    .eq("clave", "estado_rondas")
    .maybeSingle();
  if (error) {
    console.error("Error al leer estado de rondas:", error);
    return estadoRondasPorDefecto();
  }
  // Mezcla con el por defecto por si se añade alguna ronda en el futuro.
  return { ...estadoRondasPorDefecto(), ...(data?.valor || {}) };
}

// Guarda el estado completo de las rondas.
export async function guardarEstadoRondas(estado) {
  const { error } = await supabase
    .from("config")
    .upsert({ clave: "estado_rondas", valor: estado }, { onConflict: "clave" });
  if (error) {
    console.error("Error al guardar estado de rondas:", error);
    return { error: "No se pudo guardar." };
  }
  return { ok: true };
}
