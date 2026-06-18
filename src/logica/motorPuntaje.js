// ============================================================
// MOTOR DE PUNTAJE — Modo "por fases" (Mundial 2026 · Quiniela 2)
//
// REGLAS (confirmadas):
//  PARTIDO (grupos Y eliminatorias, sobre el marcador de 90'):
//    - Resultado correcto (gana local / empate / gana visita): +3
//    - Diferencia de goles correcta (con signo, incluye empates): +1
//    - Marcador exacto: +2            ->  máximo 6 por partido
//  BONUS DE GRUPO (solo cuando el grupo tiene TODOS los resultados reales):
//    - 1º exacto: +2 · 2º exacto: +2
//    - Equipo que quedó top-2 pero en posición cambiada: +1 (por equipo)
//  PREMIOS (adjudicación manual del admin):
//    - bota/balón/asistidor/joven + Ganador del Mundial (+10)
//  Las eliminatorias YA NO usan "casilla correcta/incorrecta": puntúan como
//  un partido normal. El campeón se cuenta como premio aparte (+10).
// ============================================================
 
import { GRUPOS, LETRAS_GRUPOS } from "../datos/equipos";
import { partidosDeGrupo } from "../datos/partidos";
import { calcularTabla } from "./clasificacion";
 
function signo(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
}
 
// ---------- PUNTAJE DE UN PARTIDO (sirve para grupos Y eliminatorias) ----------
 
export function puntosPartidoGrupo(prediccion, real) {
  if (!prediccion || !real)
    return { puntos: 0, motivo: "Sin datos", acertoResultado: false, acertoDif: false, exacto: false };
 
  const pl = prediccion.local, pv = prediccion.visita;
  const rl = real.local, rv = real.visita;
 
  if (pl === "" || pv === "" || pl == null || pv == null)
    return { puntos: 0, motivo: "Sin predicción", acertoResultado: false, acertoDif: false, exacto: false };
  if (rl === "" || rv === "" || rl == null || rv == null)
    return { puntos: 0, motivo: "Sin resultado", acertoResultado: false, acertoDif: false, exacto: false };
 
  const PL = Number(pl), PV = Number(pv), RL = Number(rl), RV = Number(rv);
  const acertoResultado = signo(PL, PV) === signo(RL, RV);
  const acertoDif = PL - PV === RL - RV; // diferencia CON signo (implica acertar el resultado)
  const exacto = PL === RL && PV === RV;
 
  let puntos = 0;
  let motivo = "No acertado (0)";
  if (acertoResultado) {
    const partes = [];
    puntos += 3;
    partes.push(signo(RL, RV) === 0 ? "Empate acertado (+3)" : "Ganador acertado (+3)");
    if (acertoDif) {
      puntos += 1;
      partes.push("Diferencia acertada (+1)");
    }
    if (exacto) {
      puntos += 2;
      partes.push("Marcador exacto (+2)");
    }
    motivo = partes.join(" · ");
  }
  return { puntos, motivo, acertoResultado, acertoDif, exacto };
}
 
export function puntosGruposParticipante(predicciones, resultados, partidos) {
  let total = 0;
  const desglose = {};
  for (const p of partidos) {
    const real = resultados[p.id];
    if (!real || real.local == null || real.visita == null) continue;
    const r = puntosPartidoGrupo(predicciones[p.id], real);
    desglose[p.id] = r;
    total += r.puntos;
  }
  return { total, desglose };
}
 
// ---------- BONUS POR POSICIÓN DE GRUPO ----------
// Se otorga SOLO cuando el grupo tiene sus 6 resultados reales metidos.
// Compara el top-2 PREDICHO del participante contra el top-2 REAL.
// Devuelve, por grupo: { puntos, completo, porEquipo, motivos, pred, real }
//   - porEquipo: { codigoEquipo: "+2 (1º exacto)" }  -> para pintar en pantalla.
export function puntosBonusGrupos(
  predMarcadores,
  resultados,
  ordenFairPlayPred = {},
  ordenFairPlayReal = {}
) {
  let total = 0;
  const desglose = {};
 
  for (const L of LETRAS_GRUPOS) {
    const equipos = GRUPOS[L].map((e) => e.codigo);
    const partidos = partidosDeGrupo(L);
 
    // ¿El grupo está completo en resultados REALES? (sus 6 partidos)
    const completo = partidos.every((p) => {
      const r = resultados[p.id];
      return r && r.local != null && r.visita != null && r.local !== "" && r.visita !== "";
    });
 
    if (!completo) {
      desglose[L] = { puntos: 0, completo: false, porEquipo: {}, motivos: [] };
      continue;
    }
 
    const tablaReal = calcularTabla(equipos, partidos, resultados, {}, ordenFairPlayReal[L] || null);
    const tablaPred = calcularTabla(equipos, partidos, predMarcadores, {}, ordenFairPlayPred[L] || null);
 
    const real1 = tablaReal[0] && tablaReal[0].eq;
    const real2 = tablaReal[1] && tablaReal[1].eq;
    const pred1 = tablaPred[0] && tablaPred[0].eq;
    const pred2 = tablaPred[1] && tablaPred[1].eq;
 
    let puntos = 0;
    const porEquipo = {};
    const motivos = [];
 
    // Posición 1 real
    if (pred1 && pred1 === real1) {
      puntos += 2; porEquipo[real1] = "+2 (1º exacto)"; motivos.push("1º del grupo exacto (+2)");
    } else if (pred2 && pred2 === real1) {
      puntos += 1; porEquipo[real1] = "+1 (top 2, posición cambiada)"; motivos.push("Top 2 en posición cambiada (+1)");
    }
 
    // Posición 2 real
    if (pred2 && pred2 === real2) {
      puntos += 2; porEquipo[real2] = "+2 (2º exacto)"; motivos.push("2º del grupo exacto (+2)");
    } else if (pred1 && pred1 === real2) {
      puntos += 1; porEquipo[real2] = "+1 (top 2, posición cambiada)"; motivos.push("Top 2 en posición cambiada (+1)");
    }
 
    desglose[L] = { puntos, completo: true, porEquipo, motivos, pred: [pred1, pred2], real: [real1, real2] };
    total += puntos;
  }
 
  return { total, desglose };
}
 
// ---------- PREMIOS (adjudicación manual del admin) ----------
// adjudicaciones: { botaOro:[idParticipante,...], balonOro:[...], asistidor:[...], joven:[...], ganadorMundial:[...] }
const PUNTOS_PREMIOS = { botaOro: 5, balonOro: 5, asistidor: 3, joven: 3, ganadorMundial: 10 };
 
export function puntosPremios(participanteId, adjudicaciones) {
  if (!adjudicaciones || !participanteId) return { total: 0, desglose: {} };
  let total = 0;
  const desglose = {};
  for (const premio in PUNTOS_PREMIOS) {
    const lista = adjudicaciones[premio] || [];
    if (lista.includes(participanteId)) {
      desglose[premio] = PUNTOS_PREMIOS[premio];
      total += PUNTOS_PREMIOS[premio];
    }
  }
  return { total, desglose };
}
 
// ---------- ELIMINATORIAS (puntúan como partidos normales) ----------
// En el modo por fases TODOS predicen los MISMOS partidos reales de cada ronda,
// así que cada partido se puntúa igual que uno de grupos (resultado / dif / exacto).
// El campeón NO se cuenta aquí: es un premio aparte (+10).
// predBracket.marcadores / realBracket.marcadores: { M73:{local,visita}, ... }
export function puntosEliminatorias(predBracket, realBracket) {
  let total = 0;
  const desglose = {};
  if (!predBracket || !realBracket) return { total: 0, desglose: {} };
 
  const predMarc = predBracket.marcadores || {};
  const realMarc = realBracket.marcadores || {};
 
  for (const m in realMarc) {
    const real = realMarc[m];
    if (!real || real.local == null || real.visita == null || real.local === "" || real.visita === "")
      continue;
    const r = puntosPartidoGrupo(predMarc[m], real);
    desglose[m] = { pts: r.puntos, motivos: r.puntos > 0 ? [r.motivo] : [] };
    total += r.puntos;
  }
 
  return { total, desglose };
}
 
// ---------- TOTAL GENERAL ----------
// Total de un participante: grupos (partidos) + bonus de grupo + premios (manual).
// (Las eliminatorias se suman aparte en posiciones.js porque necesitan el bracket real.)
export function puntosTotales(predicciones, resultados, partidos, adjudicacionesPremios, participanteId, ordenFairPlayReal = {}) {
  const grupos = puntosGruposParticipante(
    predicciones.marcadoresGrupos || {},
    resultados,
    partidos
  );
  const bonus = puntosBonusGrupos(
    predicciones.marcadoresGrupos || {},
    resultados,
    predicciones.ordenFairPlay || {},
    ordenFairPlayReal
  );
  const premios = puntosPremios(participanteId, adjudicacionesPremios);
  return {
    total: grupos.total + bonus.total + premios.total,
    grupos: grupos.total,
    bonusGrupos: bonus.total,
    premios: premios.total,
    desgloseGrupos: grupos.desglose,
    desgloseBonusGrupos: bonus.desglose,
    desglosePremios: premios.desglose,
  };
}

// ---------- PREMIO: GANADOR DEL MUNDIAL (automático) ----------
// Compara el campeón elegido por el jugador (datos.premios.ganadorMundial)
// contra el campeón real, y da +10 si acierta.
export function puntosCampeon(premiosJugador, campeonReal) {
  const elegido = premiosJugador && premiosJugador.ganadorMundial;
  if (!campeonReal || !elegido) return { total: 0, acerto: false };
  const acerto = elegido === campeonReal;
  return { total: acerto ? 10 : 0, acerto };
}