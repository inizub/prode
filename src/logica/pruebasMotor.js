// ============================================================
// PRUEBAS DEL MOTOR DE PUNTAJE
// Cómo correrlas: abre la consola del navegador (F12) y verás los
// resultados al cargar la app (lo importamos temporalmente en main.jsx).
// Todas deben decir ✅. Si alguna dice ❌, hay un bug que avisar.
// ============================================================
import {
  puntosPartidoGrupo,
  puntosGruposParticipante,
  puntosPremios,
} from "./motorPuntaje";

export function correrPruebas() {
  let fallos = 0;
  function eq(nombre, got, exp) {
    if (got !== exp) {
      fallos++;
      console.log(`❌ ${nombre}: esperaba ${exp}, obtuvo ${got}`);
    } else {
      console.log(`✅ ${nombre} = ${got}`);
    }
  }

  console.log("=== PRUEBAS MOTOR DE PUNTAJE ===");

  eq("exacto 2-1", puntosPartidoGrupo({ local: 2, visita: 1 }, { local: 2, visita: 1 }).puntos, 5);
  eq("ganador 3-0 vs 2-1", puntosPartidoGrupo({ local: 3, visita: 0 }, { local: 2, visita: 1 }).puntos, 3);
  eq("empate exacto 1-1", puntosPartidoGrupo({ local: 1, visita: 1 }, { local: 1, visita: 1 }).puntos, 5);
  eq("empate 0-0 vs 2-2", puntosPartidoGrupo({ local: 0, visita: 0 }, { local: 2, visita: 2 }).puntos, 3);
  eq("fallo 2-1 vs 0-3", puntosPartidoGrupo({ local: 2, visita: 1 }, { local: 0, visita: 3 }).puntos, 0);
  eq("empate predicho, gano local", puntosPartidoGrupo({ local: 1, visita: 1 }, { local: 2, visita: 1 }).puntos, 0);
  eq("gano local predicho, fue empate", puntosPartidoGrupo({ local: 2, visita: 0 }, { local: 1, visita: 1 }).puntos, 0);
  eq("max 5 goleada exacta", puntosPartidoGrupo({ local: 7, visita: 0 }, { local: 7, visita: 0 }).puntos, 5);
  eq("sin prediccion", puntosPartidoGrupo({ local: "", visita: "" }, { local: 1, visita: 0 }).puntos, 0);
  eq("0-0 exacto", puntosPartidoGrupo({ local: 0, visita: 0 }, { local: 0, visita: 0 }).puntos, 5);

  const partidos = [{ id: "G-A1" }, { id: "G-A2" }, { id: "G-A3" }];
  const preds = { "G-A1": { local: 2, visita: 1 }, "G-A2": { local: 0, visita: 0 }, "G-A3": { local: 1, visita: 0 } };
  const reals = { "G-A1": { local: 2, visita: 1 }, "G-A2": { local: 1, visita: 1 } };
  const tot = puntosGruposParticipante(preds, reals, partidos);
  eq("total participante", tot.total, 8);
  eq("desglose solo evalua jugados", Object.keys(tot.desglose).length, 2);

  eq("bota oro acertada", puntosPremios({ botaOro: "Mbappé" }, { botaOro: "mbappé" }).total, 5);
  eq("balon oro acertado", puntosPremios({ balonOro: "Messi" }, { balonOro: "MESSI " }).total, 5);
  eq("ambos premios", puntosPremios({ botaOro: "Kane", balonOro: "Bellingham" }, { botaOro: "Kane", balonOro: "Bellingham" }).total, 10);
  eq("premio fallado", puntosPremios({ botaOro: "X" }, { botaOro: "Y" }).total, 0);

  console.log(fallos === 0 ? "🎉 TODAS LAS PRUEBAS PASARON" : `⚠️ ${fallos} FALLARON`);
  return fallos === 0;
}