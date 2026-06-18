// ============================================================
// PRUEBAS DEL MOTOR DEL BRACKET
// Verifican que el Round de 32 se arma bien y que el Anexo C
// coloca a los terceros respetando las reglas del Art. 12.6.
// Correr: se ejecutan al cargar (ver main.jsx) y salen en la consola (F12).
// ============================================================
import { construirRound32 } from "./motorBracket";
import { partidosDeGrupo } from "../datos/partidos";

// Genera marcadores donde, en cada grupo, X1 gana todo, X2 2º, X3 3º, X4 4º.
function marcadoresPredecibles() {
  const m = {};
  for (const L of "ABCDEFGHIJKL") {
    const partidos = partidosDeGrupo(L);
    for (const p of partidos) {
      // El equipo con menor número (mejor) gana 2-0.
      const nLocal = Number(p.local[1]);
      const nVisita = Number(p.visita[1]);
      if (nLocal < nVisita) m[p.id] = { local: 2, visita: 0 };
      else m[p.id] = { local: 0, visita: 2 };
    }
  }
  return m;
}

export function correrPruebasBracket() {
  let fallos = 0;
  const check = (nombre, cond) => {
    if (cond) console.log(`✅ ${nombre}`);
    else { fallos++; console.log(`❌ ${nombre}`); }
  };

  console.log("=== PRUEBAS MOTOR DEL BRACKET ===");

  const m = marcadoresPredecibles();
  const b = construirRound32(m);

  // 1) Se encontró un patrón del Anexo C
  check("Se encontró patrón del Anexo C", b.hayPatron === true);

  // 2) Hay exactamente 8 mejores terceros
  check("Hay 8 mejores terceros", b.mejores8.length === 8);

  // 3) Los 16 partidos del R32 tienen 2 equipos cada uno
  const todos16 = Object.keys(b.r32).length === 16;
  check("R32 tiene 16 partidos", todos16);
  let todosConDos = true;
  for (const mm in b.r32)
    if (!b.r32[mm][0] || !b.r32[mm][1]) todosConDos = false;
  check("Todos los partidos R32 tienen 2 equipos", todosConDos);

  // 4) Ningún equipo enfrenta a otro de su mismo grupo en R32
  let mismoGrupo = false;
  for (const mm in b.r32) {
    const [x, y] = b.r32[mm];
    if (x[0] === y[0]) mismoGrupo = true; // misma letra de grupo
  }
  check("Ningún cruce R32 es del mismo grupo", !mismoGrupo);

  // 5) Ningún equipo aparece dos veces en el R32
  const todos = [];
  for (const mm in b.r32) todos.push(...b.r32[mm]);
  const sinRepetir = new Set(todos).size === todos.length;
  check("Ningún equipo repetido en R32", sinRepetir);

  // 6) Debe haber 32 equipos en total (24 de 1º/2º + 8 terceros)
  check("Hay 32 equipos en el R32", todos.length === 32);

  console.log(
    fallos === 0 ? "🎉 BRACKET: TODAS LAS PRUEBAS PASARON" : `⚠️ ${fallos} FALLARON`
  );
  return fallos === 0;
}