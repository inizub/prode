// ============================================================
// BRACKET REAL — Lo que pasó de verdad en el Mundial.
// Reusa el MISMO motor probado que arma el bracket de cada participante.
// A partir de los resultados reales de grupos (que mete el admin), arma el
// Round de 32 real; luego propaga los marcadores reales de cada eliminatoria.
// ============================================================
import { construirRound32, resolverBracketCompleto } from "./motorBracket";

// ordenFairPlay:     empates DENTRO de grupo del Mundial real (decide el admin)
// desempateTerceros: orden por fair play del empate de terceros que cruza el
//                    corte 8º/9º del Mundial real (decide el admin)
export function construirBracketReal(
  resultadosGrupos,
  marcadoresElim = {},
  avancesElim = {},
  correccionesR32 = {},
  ordenFairPlay = {},
  desempateTerceros = []
) {
  // 1) Round de 32 real con el motor probado (clasificación + Anexo C)
  const base = construirRound32(resultadosGrupos, ordenFairPlay, desempateTerceros);
  const r32 = {};
  for (const m in base.r32) r32[m] = [...base.r32[m]];

  // 2) Anulación de emergencia: si el admin corrigió alguna casilla, se aplica.
  for (const m in correccionesR32) {
    if (correccionesR32[m]) r32[m] = [...correccionesR32[m]];
  }

  // 3) Determinar el avance de cada partido según el marcador real.
  //    Si hay empate en reglamentario, se usa la decisión del admin (avancesElim).
  const avances = {};
  const todosLosPartidos = [
    ...Object.keys(r32),
    "M89","M90","M91","M92","M93","M94","M95","M96",
    "M97","M98","M99","M100","M101","M102","M103","M104",
  ];
  for (const m of todosLosPartidos) {
    const mc = marcadoresElim[m];
    if (!mc || mc.local === "" || mc.visita === "" || mc.local == null || mc.visita == null) {
      continue; // sin marcador real aún
    }
    const l = Number(mc.local), v = Number(mc.visita);
    if (l > v) avances[m] = 0;
    else if (v > l) avances[m] = 1;
    else if (avancesElim[m] != null) avances[m] = avancesElim[m]; // empate -> decisión admin
  }

  // 4) Propagar por todo el árbol con el motor probado.
  const resuelto = resolverBracketCompleto(r32, avances);

  return {
    r32,
    rondas: resuelto.rondas,
    win: resuelto.win,
    lose: resuelto.lose,
    base,
  };
}

export function prepararParaPuntaje(resuelto, marcadores, avances) {
  const campeonIdx = avances?.M104 != null ? avances.M104 : null;
  const terceroGanaIdx = avances?.M103 != null ? avances.M103 : null;

  return {
    rondas: {
      R32: resuelto.rondas.R32 || {},
      R16: resuelto.rondas.R16 || {},
      CUARTOS: resuelto.rondas.CUARTOS || {},
      SEMIS: resuelto.rondas.SEMIS || {},
      TERCER_LUGAR: resuelto.rondas.TERCER_LUGAR || {},
      FINAL: resuelto.rondas.FINAL || {},
    },
    marcadores: marcadores || {},
    campeonIdx,
    terceroGanaIdx,
  };
}