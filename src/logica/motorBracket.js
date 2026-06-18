// ============================================================
// MOTOR DEL BRACKET — Arma el árbol de eliminatorias de un participante.
//
// Desempates de fair play (dos mecanismos DISTINTOS):
//  - ordenFairPlay: empates DENTRO de un grupo (quién es 2º vs 3º, etc.)
//    Forma: { "A": ["A3","A1"], "F": ["F2","F3"] }
//  - desempateTerceros: empate ENTRE terceros de distintos grupos que
//    cruza el corte 8º/9º (qué tercero entra al R32). Es un orden de
//    LETRAS de grupo elegido por el usuario, ej: ["J","H","I"].
// ============================================================
import { GRUPOS, LETRAS_GRUPOS } from "../datos/equipos";
import { partidosDeGrupo } from "../datos/partidos";
import { calcularTabla } from "./clasificacion";
import { ANEXO_C } from "../datos/anexoC";
import { R32, COLUMNA_A_PARTIDO } from "../datos/cruces";
import { R16, CUARTOS, SEMIS, TERCER_LUGAR, FINAL } from "../datos/cruces";

function clasificarTodosLosGrupos(marcadores, ordenFairPlay = {}) {
  const primeros = {};
  const segundos = {};
  const tercerosPorGrupo = {};
  const tercerosConStats = [];

  for (const L of LETRAS_GRUPOS) {
    const equipos = GRUPOS[L].map((e) => e.codigo);
    const partidos = partidosDeGrupo(L);
    const ordenGrupo = ordenFairPlay[L] || null;
    const tabla = calcularTabla(equipos, partidos, marcadores, {}, ordenGrupo);

    primeros[`1${L}`] = tabla[0].eq;
    segundos[`2${L}`] = tabla[1].eq;
    tercerosPorGrupo[`3${L}`] = tabla[2].eq;
    tercerosConStats.push({
      grupo: L,
      eq: tabla[2].eq,
      pts: tabla[2].pts,
      dg: tabla[2].dg,
      gf: tabla[2].gf,
    });
  }
  return { primeros, segundos, tercerosPorGrupo, tercerosConStats };
}

// Ordena los 12 terceros. El desempate por fair play (orden de letras de
// grupo que decide el usuario) reemplaza al alfabético; el alfabético queda
// como último recurso para que nada se rompa antes de resolver.
function rankearTerceros(tercerosConStats, desempateTerceros = []) {
  const idxFP = (g) => {
    const i = desempateTerceros.indexOf(g);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...tercerosConStats].sort(
    (a, b) =>
      b.pts - a.pts ||
      b.dg - a.dg ||
      b.gf - a.gf ||
      idxFP(a.grupo) - idxFP(b.grupo) ||
      a.grupo.localeCompare(b.grupo)
  );
}

function elegirMejoresTerceros(tercerosConStats, desempateTerceros = []) {
  return rankearTerceros(tercerosConStats, desempateTerceros).slice(0, 8);
}

// Detecta el empate de terceros que CRUZA el corte 8º/9º (el único que
// cambia el bracket). Devuelve [] si no hay nada que resolver.
// Cada elemento: { equipos:["H","I","J"], cupos:1, pts, dg, gf, resuelto }
export function empatesTerceros(marcadores, ordenFairPlay = {}, desempateTerceros = []) {
  const { tercerosConStats } = clasificarTodosLosGrupos(marcadores, ordenFairPlay);
  const ord = [...tercerosConStats].sort(
    (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf
  );
  const empates = [];
  let acumulado = 0;
  let i = 0;
  while (i < ord.length) {
    let j = i + 1;
    while (
      j < ord.length &&
      ord[j].pts === ord[i].pts &&
      ord[j].dg === ord[i].dg &&
      ord[j].gf === ord[i].gf
    ) {
      j++;
    }
    const bloque = ord.slice(i, j);
    const inicio = acumulado; // nº de terceros ya colocados antes del bloque
    const fin = acumulado + bloque.length;
    // Solo importa si el bloque cruza la línea 8/9 (algunos entran y otros no)
    if (bloque.length > 1 && inicio < 8 && fin > 8) {
      const equipos = bloque.map((t) => t.grupo);
      const resuelto = equipos.every((g) => desempateTerceros.includes(g));
      empates.push({
        equipos,
        cupos: 8 - inicio, // cuántos de este bloque clasifican
        pts: bloque[0].pts,
        dg: bloque[0].dg,
        gf: bloque[0].gf,
        resuelto,
      });
    }
    acumulado = fin;
    i = j;
  }
  return empates;
}

export function construirRound32(marcadores, ordenFairPlay = {}, desempateTerceros = []) {
  const { primeros, segundos, tercerosPorGrupo, tercerosConStats } =
    clasificarTodosLosGrupos(marcadores, ordenFairPlay);

  const mejores8 = elegirMejoresTerceros(tercerosConStats, desempateTerceros);
  const gruposClasifican = mejores8.map((t) => t.grupo).sort().join("");
  const patron = ANEXO_C[gruposClasifican];

  const slotAEquipo = { ...primeros, ...segundos, ...tercerosPorGrupo };

  const r32 = {};
  for (const m in R32) r32[m] = [...R32[m]];

  if (patron) {
    for (const columna in COLUMNA_A_PARTIDO) {
      const partido = COLUMNA_A_PARTIDO[columna];
      const tercero3X = patron[columna];
      r32[partido][1] = tercero3X;
    }
  }

  const r32Equipos = {};
  for (const m in r32) {
    r32Equipos[m] = r32[m].map((slot) => slotAEquipo[slot] || slot);
  }

  return {
    r32: r32Equipos,
    r32Slots: r32,
    primeros,
    segundos,
    tercerosPorGrupo,
    mejores8,
    gruposClasifican,
    patron,
    hayPatron: !!patron,
  };
}

export function resolverBracketCompleto(r32Equipos, avances) {
  const win = {};
  const lose = {};
  const val = (slot) =>
    slot in win ? win[slot] : slot in lose ? lose[slot] : slot;

  function procesa(cruces, yaEquipos = false) {
    const salida = {};
    for (const m in cruces) {
      const equipos = yaEquipos ? cruces[m] : cruces[m].map(val);
      salida[m] = equipos;
      const idx = avances[m];
      if (equipos[0] == null || equipos[1] == null || idx == null) continue;
      win[`W${m.slice(1)}`] = equipos[idx];
      lose[`L${m.slice(1)}`] = equipos[idx === 0 ? 1 : 0];
    }
    return salida;
  }

  const rondas = {
    R32: procesa(r32Equipos, true),
    R16: procesa(R16),
    CUARTOS: procesa(CUARTOS),
    SEMIS: procesa(SEMIS),
    TERCER_LUGAR: procesa(TERCER_LUGAR),
    FINAL: procesa(FINAL),
  };

  return { win, lose, rondas };
}

export function detectarEmpatesFairPlay(resultados) {
  const avisos = [];
  for (const L of LETRAS_GRUPOS) {
    const equipos = GRUPOS[L].map((e) => e.codigo);
    const partidos = partidosDeGrupo(L);
    const tabla = calcularTabla(equipos, partidos, resultados);

    for (let i = 0; i < tabla.length; i++) {
      const grupo = [tabla[i]];
      for (let j = i + 1; j < tabla.length; j++) {
        if (
          tabla[j].pts === tabla[i].pts &&
          tabla[j].dg === tabla[i].dg &&
          tabla[j].gf === tabla[i].gf
        ) {
          grupo.push(tabla[j]);
        } else break;
      }
      if (grupo.length > 1) {
        avisos.push({ grupo: L, equipos: grupo.map((f) => f.eq) });
        i += grupo.length - 1;
      }
    }
  }
  return avisos;
}