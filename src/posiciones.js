// ============================================================
// TABLA DE POSICIONES GENERAL + TIEMPO REAL  (modo por fases)
// Puntos = grupos (partidos) + bonus de posición + premios + eliminatorias.
// Eliminatorias: marcadores del jugador vs marcadores reales (mismos partidos).
// ============================================================
import { supabase } from "./supabaseClient";
import { PARTIDOS_GRUPOS } from "./datos/partidos";
import { puntosTotales, puntosEliminatorias, puntosCampeon } from "./logica/motorPuntaje";
import { construirBracketReal } from "./logica/bracketReal";

// Cuenta cuántos partidos de grupos tiene el jugador con marcador completo.
function contarPartidosPredichos(datos) {
  const marcadores = datos?.marcadoresGrupos || {};
  let n = 0;
  for (const id in marcadores) {
    const m = marcadores[id];
    if (m && m.local !== "" && m.visita !== "" && m.local != null && m.visita != null) n++;
  }
  return n;
}

// Lee resultados reales de grupos, premios adjudicados y el bracket real.
async function leerDatosReales() {
  const { data: res } = await supabase
    .from("resultados")
    .select("partido_id, goles_local, goles_visita");
  const resultados = {};
  for (const r of res || []) {
    resultados[r.partido_id] = { local: r.goles_local, visita: r.goles_visita };
  }

  let premiosAdjudicados = {};
  const { data: cfgP } = await supabase
    .from("config").select("valor").eq("clave", "premios_adjudicados").maybeSingle();
  if (cfgP?.valor) premiosAdjudicados = cfgP.valor;

  let bracketReal = null;
  const { data: cfgB } = await supabase
    .from("config").select("valor").eq("clave", "bracket_real").maybeSingle();
  if (cfgB?.valor) bracketReal = cfgB.valor;

  return { resultados, premiosAdjudicados, bracketReal };
}

export async function obtenerPosiciones() {
  const { data: participantes, error: errP } = await supabase
    .from("participantes")
    .select("id, nombre")
    .eq("activo", true);
  if (errP) {
    console.error("Error al leer participantes:", errP);
    return [];
  }

  const { data: predicciones, error: errPr } = await supabase
    .from("predicciones")
    .select("participante_id, datos");
  if (errPr) {
    console.error("Error al leer predicciones:", errPr);
    return [];
  }

  const { resultados, premiosAdjudicados, bracketReal } = await leerDatosReales();

  // Marcadores reales de eliminatorias + fair-play real del admin (para el bonus de grupo).
  const realMarcElim = (bracketReal && bracketReal.marcadoresElim) || {};
  const ordenFairPlayReal = (bracketReal && bracketReal.ordenFairPlay) || {};

  // Campeón real = ganador de la final (M104) del bracket real, si ya está decidido.
  let campeonReal = null;
  if (bracketReal && Object.keys(resultados).length === 72) {
    try {
      const real = construirBracketReal(
        resultados,
        bracketReal.marcadoresElim || {},
        bracketReal.avancesElim || {},
        bracketReal.correccionesR32 || {},
        bracketReal.ordenFairPlay || {},
        bracketReal.desempateTerceros || []
      );
      const finalEqs = (real.rondas.FINAL && real.rondas.FINAL.M104) || [null, null];
      const idxF = real.win && real.win.W104 ? null : (bracketReal.avancesElim || {}).M104;
      // El ganador de la final ya está resuelto en real.win["W104"] si hubo resultado.
      campeonReal = (real.win && real.win["W104"]) || null;
    } catch (e) {
      console.error("No se pudo determinar el campeón real:", e);
    }
  }

  const porId = {};
  for (const pr of predicciones) porId[pr.participante_id] = pr.datos;

  const tabla = participantes.map((p) => {
    const datos = porId[p.id] || {};

    // Grupos (partidos) + bonus de posición + premios. El fair-play real afina el bonus.
    const calc = puntosTotales(
      datos, resultados, PARTIDOS_GRUPOS, premiosAdjudicados, p.id, ordenFairPlayReal
    );

    // Eliminatorias: mis marcadores vs los reales (mismos partidos para todos).
    const ce = puntosEliminatorias(
      { marcadores: (datos.bracket && datos.bracket.marcadores) || {} },
      { marcadores: realMarcElim }
    );
    const puntosElim = ce.total;

    // Premio del campeón (+10 automático).
    const camp = puntosCampeon(datos.premios || {}, campeonReal);
    const puntosCamp = camp.total;

    return {
      id: p.id,
      nombre: p.nombre,
      puntos: calc.total + puntosElim + puntosCamp,
      puntosCampeon: puntosCamp,
      puntosGrupos: calc.grupos,
      puntosBonus: calc.bonusGrupos,
      puntosPremios: calc.premios,
      puntosElim,
      partidosPredichos: contarPartidosPredichos(datos),
    };
  });

  tabla.sort((a, b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre));
  return tabla;
}

export function suscribirCambios(alCambiar) {
  const canal = supabase
    .channel("cambios-posiciones")
    .on("postgres_changes", { event: "*", schema: "public", table: "predicciones" }, () => alCambiar())
    .on("postgres_changes", { event: "*", schema: "public", table: "participantes" }, () => alCambiar())
    .on("postgres_changes", { event: "*", schema: "public", table: "resultados" }, () => alCambiar())
    .on("postgres_changes", { event: "*", schema: "public", table: "config" }, () => alCambiar())
    .subscribe();

  return () => {
    supabase.removeChannel(canal);
  };
}