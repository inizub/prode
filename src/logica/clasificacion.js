// ============================================================
// CÁLCULO DE LA TABLA DE UN GRUPO + DESEMPATES (Art. 13 FIFA)
// Orden oficial Mundial 2026:
//  Paso 1 (solo entre los empatados): a) pts directos b) dg directos c) gf directos
//  Paso 2: si SIGUEN empatados algunos, se re-aplican a/b/c SOLO entre ellos.
//          Si aun así no decide -> d) dg total e) gf total f) (fair play)
//  Paso 3: g/h) ranking FIFA.  Empate "duro" -> orden manual del usuario.
// ============================================================
export function calcularTabla(
  equipos,
  partidos,
  resultados,
  rankingFIFA = {},
  ordenFairPlay = null
) {
  const st = {};
  for (const e of equipos)
    st[e] = { eq: e, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0, dg: 0 };

  const jugados = [];
  for (const p of partidos) {
    const r = resultados[p.id];
    if (!r) continue;
    if (r.local === "" || r.visita === "" || r.local == null || r.visita == null)
      continue;
    const gl = Number(r.local);
    const gv = Number(r.visita);
    if (Number.isNaN(gl) || Number.isNaN(gv)) continue;

    jugados.push({ ...p, gl, gv });
    const L = st[p.local];
    const V = st[p.visita];
    L.pj++; V.pj++;
    L.gf += gl; L.gc += gv;
    V.gf += gv; V.gc += gl;
    if (gl > gv) { L.g++; V.p++; L.pts += 3; }
    else if (gl < gv) { V.g++; L.p++; V.pts += 3; }
    else { L.e++; V.e++; L.pts++; V.pts++; }
  }
  for (const e of equipos) st[e].dg = st[e].gf - st[e].gc;

  // Mini-liga: SOLO los partidos donde AMBOS equipos están en `conjunto`.
  function miniLiga(conjunto) {
    const m = {};
    for (const e of conjunto) m[e] = { pts: 0, dg: 0, gf: 0 };
    for (const j of jugados) {
      if (conjunto.includes(j.local) && conjunto.includes(j.visita)) {
        m[j.local].gf += j.gl; m[j.visita].gf += j.gv;
        m[j.local].dg += j.gl - j.gv; m[j.visita].dg += j.gv - j.gl;
        if (j.gl > j.gv) m[j.local].pts += 3;
        else if (j.gl < j.gv) m[j.visita].pts += 3;
        else { m[j.local].pts++; m[j.visita].pts++; }
      }
    }
    return m;
  }

  // Ordena un conjunto por una lista de claves (mayor = mejor) y lo parte
  // en sub-bloques de equipos que quedan IGUALES en todas esas claves.
  function partir(conjunto, clave) {
    const arr = conjunto.map((e) => ({ e, k: clave(e) }));
    arr.sort((a, b) => {
      for (let i = 0; i < a.k.length; i++) if (a.k[i] !== b.k[i]) return b.k[i] - a.k[i];
      return 0;
    });
    const bloques = [];
    let i = 0;
    while (i < arr.length) {
      let j = i + 1;
      while (j < arr.length && arr[j].k.every((v, idx) => v === arr[i].k[idx])) j++;
      bloques.push(arr.slice(i, j).map((x) => x.e));
      i = j;
    }
    return bloques;
  }

  // Empate "duro" final: respeta el orden manual del usuario si existe.
  function resolverFairPlay(b) {
    if (b.length === 1) return b;
    if (ordenFairPlay) {
      const conIndice = b.every((e) => ordenFairPlay.indexOf(e) !== -1);
      if (conIndice) {
        return [...b].sort((a, c) => ordenFairPlay.indexOf(a) - ordenFairPlay.indexOf(c));
      }
    }
    return b; // irresoluble: se deja en orden estable
  }

  // Pasos d) e) + ranking + fair play. En cadena (no reinicia).
  function criteriosFinales(conjunto) {
    const bloques = partir(conjunto, (e) => [st[e].dg, st[e].gf]); // d) dg total e) gf total
    const salida = [];
    for (const b of bloques) {
      if (b.length === 1) { salida.push(b[0]); continue; }
      const todosConRanking = b.every((e) => rankingFIFA[e] != null);
      if (todosConRanking) {
        const partesR = partir(b, (e) => [-(rankingFIFA[e])]); // menor ranking = mejor
        for (const pr of partesR) salida.push(...resolverFairPlay(pr));
      } else {
        salida.push(...resolverFairPlay(b));
      }
    }
    return salida;
  }

  // Paso 2: re-aplicar a/b/c SOLO entre los equipos que siguen empatados.
  function reaplicarDirectos(conjunto) {
    const m = miniLiga(conjunto);
    const bloques = partir(conjunto, (e) => [m[e].pts, m[e].dg, m[e].gf]);
    const salida = [];
    for (const b of bloques) {
      if (b.length === 1) salida.push(b[0]);
      else salida.push(...criteriosFinales(b));
    }
    return salida;
  }

  // Rompe el empate de un conjunto igualado en PUNTOS totales.
  function romperEmpate(conjunto) {
    if (conjunto.length === 1) return conjunto;
    const m = miniLiga(conjunto); // Paso 1: a/b/c sobre todo el conjunto
    const bloques = partir(conjunto, (e) => [m[e].pts, m[e].dg, m[e].gf]);
    const salida = [];
    for (const b of bloques) {
      if (b.length === 1) salida.push(b[0]);
      else salida.push(...reaplicarDirectos(b)); // Paso 2
    }
    return salida;
  }

  const bloquesPts = partir(equipos, (e) => [st[e].pts]);
  const resultado = [];
  for (const b of bloquesPts) resultado.push(...romperEmpate(b));

  return resultado.map((e, idx) => ({ pos: idx + 1, ...st[e] }));
}

export function empatesDuros(equipos, partidos, resultados) {
  const tabla = calcularTabla(equipos, partidos, resultados);
  const grupos = [];
  let i = 0;
  while (i < tabla.length) {
    let j = i + 1;
    while (
      j < tabla.length &&
      tabla[j].pts === tabla[i].pts &&
      tabla[j].dg === tabla[i].dg &&
      tabla[j].gf === tabla[i].gf
    ) {
      j++;
    }
    if (j - i > 1) grupos.push(tabla.slice(i, j).map((f) => f.eq));
    i = j;
  }
  return grupos;
}