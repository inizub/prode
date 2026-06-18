import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { EQUIPO_POR_CODIGO } from "./datos/equipos";
import { RONDAS } from "./datos/cruces";
import { construirBracketReal } from "./logica/bracketReal";
import { resolverBracketCompleto } from "./logica/motorBracket";
import VistaBracketCompleto from "./VistaBracketCompleto";
import { puntosEliminatorias } from "./logica/motorPuntaje";
import {
  leerResultados,
  leerBracketReal,
  leerEstadoRondas,
  leerMarcadoresElimDeParticipantes,
} from "./admin";
import { obtenerPosiciones } from "./posiciones";
import Bandera from "./Bandera";

function esEquipoCodigo(e) {
  return /^[A-L][1-4]$/.test(String(e));
}

function estadoDeRonda(claveRonda, estadoRondas) {
  const key = claveRonda === "TERCER_LUGAR" ? "FINAL" : claveRonda;
  return (estadoRondas && estadoRondas[key]) || "pendiente";
}

function Equipo({ codigo, alineado = "left" }) {
  if (!codigo || !esEquipoCodigo(codigo))
    return <span className="text-slate-300 text-sm">— por definir —</span>;
  const eq = EQUIPO_POR_CODIGO[codigo];
  if (!eq) return <span className="text-sm">{codigo}</span>;
  return (
    <span className={"flex items-center gap-2 text-sm font-medium " + (alineado === "right" ? "flex-row-reverse" : "")}>
      <Bandera iso={eq.iso} tam={28} />
      <span>{eq.abrev}</span>
    </span>
  );
}

export default function PantallaBracket({ bracketPred, onCambio }) {
  const [rondaActiva, setRondaActiva] = useState("R32");
  const [resultadosGruposReales, setResultadosGruposReales] = useState({});
  const [bracketRealRaw, setBracketRealRaw] = useState(null);
  const [estadoRondas, setEstadoRondas] = useState(null);
  const [vistaCompleta, setVistaCompleta] = useState(false);

  const [verPartido, setVerPartido] = useState(null);
  const [ordenJugadores, setOrdenJugadores] = useState([]);
  const [marcadoresElimTodos, setMarcadoresElimTodos] = useState({});

  useEffect(() => {
    leerResultados().then(setResultadosGruposReales);
    leerBracketReal().then(setBracketRealRaw);
    leerEstadoRondas().then(setEstadoRondas);
  }, []);

  useEffect(() => {
    function recargar() {
      leerResultados().then(setResultadosGruposReales);
      leerBracketReal().then(setBracketRealRaw);
      leerEstadoRondas().then(setEstadoRondas);
    }
    const canal = supabase
      .channel("bracket-tiempo-real")
      .on("postgres_changes", { event: "*", schema: "public", table: "config" }, recargar)
      .on("postgres_changes", { event: "*", schema: "public", table: "resultados" }, recargar)
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const hayRondaCerrada = estadoRondas
    ? Object.values(estadoRondas).some((s) => s === "cerrada")
    : false;

  useEffect(() => {
    if (!hayRondaCerrada) return;
    Promise.all([obtenerPosiciones(), leerMarcadoresElimDeParticipantes()]).then(
      ([pos, marc]) => {
        setOrdenJugadores(pos.map((p) => ({ id: p.id, nombre: p.nombre })));
        setMarcadoresElimTodos(marc);
      }
    );
  }, [hayRondaCerrada]);

  const marcadores = bracketPred?.marcadores || {};
  const avances = bracketPred?.avances || {};

  const real = bracketRealRaw
    ? construirBracketReal(
        resultadosGruposReales,
        bracketRealRaw.marcadoresElim || {},
        bracketRealRaw.avancesElim || {},
        bracketRealRaw.correccionesR32 || {},
        bracketRealRaw.ordenFairPlay || {},
        bracketRealRaw.desempateTerceros || []
      )
    : null;

  const desglosePuntos = puntosEliminatorias(
    { marcadores },
    { marcadores: (bracketRealRaw && bracketRealRaw.marcadoresElim) || {} }
  ).desglose;

  const realMarc = (bracketRealRaw && bracketRealRaw.marcadoresElim) || {};
  const realAv = (bracketRealRaw && bracketRealRaw.avancesElim) || {};

  function tieneMarc(mc) {
    return mc && mc.local !== "" && mc.visita !== "" && mc.local != null && mc.visita != null;
  }
  function avanceDe(mc, empateIdx) {
    if (!tieneMarc(mc)) return null;
    const l = Number(mc.local), v = Number(mc.visita);
    if (l > v) return 0;
    if (v > l) return 1;
    return empateIdx != null ? empateIdx : null;
  }

  let resueltoHibrido = null;
  const marcadoresHibrido = {};
  const partidosReales = new Set();
  let campeonHibrido = null;
  let campeonEsReal = false;

  if (real) {
    const llaves = [];
    for (const cl in real.rondas) for (const mm in real.rondas[cl]) llaves.push(mm);

    const avancesComb = {};
    for (const mm of llaves) {
      const aReal = avanceDe(realMarc[mm], realAv[mm]);
      if (aReal != null) {
        avancesComb[mm] = aReal;
        partidosReales.add(mm);
        marcadoresHibrido[mm] = realMarc[mm];
      } else {
        const aPred = avanceDe(marcadores[mm], avances[mm]);
        if (aPred != null) avancesComb[mm] = aPred;
        if (tieneMarc(marcadores[mm])) marcadoresHibrido[mm] = marcadores[mm];
      }
    }

    resueltoHibrido = resolverBracketCompleto(real.r32, avancesComb);

    const finalEqs = (resueltoHibrido.rondas.FINAL && resueltoHibrido.rondas.FINAL.M104) || [null, null];
    const idxF = avancesComb.M104;
    if (idxF != null && finalEqs[idxF] && esEquipoCodigo(finalEqs[idxF])) {
      campeonHibrido = finalEqs[idxF];
      campeonEsReal = partidosReales.has("M104");
    }
  }

  function cambiarMarcador(partido, lado, valor) {
    if (valor !== "" && !/^\d{1,2}$/.test(valor)) return;
    const nuevos = { ...marcadores, [partido]: { ...marcadores[partido], [lado]: valor } };
    onCambio({ avances, marcadores: nuevos });
  }

  function elegirAvance(partido, idx) {
    onCambio({ avances: { ...avances, [partido]: idx }, marcadores });
  }

  function avanceSegunMarcador(partido) {
    const m = marcadores[partido] || {};
    if (m.local === "" || m.visita === "" || m.local == null || m.visita == null) return null;
    const l = Number(m.local), v = Number(m.visita);
    if (l > v) return 0;
    if (v > l) return 1;
    return "empate";
  }

  const badge = { pendiente: "🔒", abierta: "🟢", cerrada: "✅" };

  if (estadoRondas === null)
    return <main className="p-4 max-w-md mx-auto"><p className="text-center text-slate-400 mt-6">Cargando…</p></main>;

  const ronda = RONDAS.find((r) => r.clave === rondaActiva);
  const estado = estadoDeRonda(rondaActiva, estadoRondas);
  const editable = estado === "abierta";
  const verActivo = estado === "cerrada";

  return (
    <main className="max-w-md mx-auto pb-40">
      {verPartido && (
        <OverlayPartidoElim
          partido={verPartido.partido}
          equipos={verPartido.equipos}
          nombreRonda={ronda.nombre}
          real={realMarc[verPartido.partido]}
          marcadoresReales={realMarc}
          jugadores={ordenJugadores}
          marcadoresElimTodos={marcadoresElimTodos}
          onCerrar={() => setVerPartido(null)}
        />
      )}

      {vistaCompleta && resueltoHibrido && (
        <VistaBracketCompleto
          rondas={resueltoHibrido.rondas}
          marcadores={marcadoresHibrido}
          partidosReales={partidosReales}
          campeon={campeonHibrido}
          campeonEsReal={campeonEsReal}
          onCerrar={() => setVistaCompleta(false)}
        />
      )}
      <nav className="flex overflow-x-auto gap-2 px-3 py-3 bg-white border-b sticky top-[60px] z-10">
        {RONDAS.map((r) => (
          <button
            key={r.clave}
            onClick={() => setRondaActiva(r.clave)}
            className={
              "shrink-0 px-3 h-9 rounded-full text-xs font-semibold transition " +
              (rondaActiva === r.clave ? "bg-gradient-to-br from-blue-700 to-blue-500 text-white shadow-md" : "bg-slate-100 text-slate-600")
            }
          >
            {badge[estadoDeRonda(r.clave, estadoRondas)]} {r.nombre}
          </button>
        ))}
      </nav>

      <div className="p-4">
      {real && (
          <button
            onClick={() => setVistaCompleta(true)}
            className="mb-4 w-full bg-slate-800 text-white text-sm font-semibold rounded-lg py-2.5"
          >
            📷 Ver bracket completo
          </button>
        )}
        <h2 className="text-base font-semibold text-slate-700 mb-1">{ronda.nombre}</h2>

        {estado === "pendiente" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-3 text-center">
            <p className="text-3xl mb-2">🔒</p>
            <p className="font-semibold text-slate-700 mb-1">Ronda bloqueada</p>
            <p className="text-sm text-slate-500">
              Esta ronda aún no ha empezado. Se abrirá cuando arranquen sus partidos.
            </p>
          </div>
        )}

        {estado === "cerrada" && (
          <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-3">
            ✅ Esta ronda ya terminó. Toca un partido para ver qué predijo cada quien.
          </p>
        )}

        {editable && (
          <p className="text-xs text-slate-400 mb-3">
            Predice el marcador del <strong>tiempo reglamentario</strong> (90 min). Si hay empate,
            elige quién avanza — la prórroga y los penales no afectan tus puntos.
          </p>
        )}

        {estado !== "pendiente" && (
          <ul className="space-y-3">
            {ronda.partidos.map((partido) => {
              const equipos = (real && real.rondas[rondaActiva] && real.rondas[rondaActiva][partido]) || [null, null];
              const resueltos = esEquipoCodigo(equipos[0]) && esEquipoCodigo(equipos[1]);
              const m = marcadores[partido] || {};
              const avance = avanceSegunMarcador(partido);
              const esEmpate = avance === "empate";
              const puntos = desglosePuntos[partido];

              if (editable && (avance === 0 || avance === 1) && avances[partido] !== avance) {
                setTimeout(() => elegirAvance(partido, avance), 0);
              }

              return (
                <li
                  key={partido}
                  onClick={verActivo ? () => setVerPartido({ partido, equipos }) : undefined}
                  className={
                    "bg-white rounded-xl px-3 py-3 shadow-sm " +
                    (verActivo ? "cursor-pointer active:scale-[0.99] transition-transform" : "")
                  }
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <p className="text-center text-[10px] text-slate-300">{partido}</p>
                    {verActivo && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 rounded-full px-2 py-0.5">
                        👁 ver
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0"><Equipo codigo={equipos[0]} /></div>
                    <div className="flex items-center gap-1">
                      <input
                        type="text" inputMode="numeric"
                        disabled={!editable || !resueltos}
                        value={m.local || ""}
                        onChange={(e) => cambiarMarcador(partido, "local", e.target.value)}
                        className="w-10 h-10 text-center text-lg font-bold border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
                      />
                      <span className="text-slate-300 font-bold">:</span>
                      <input
                        type="text" inputMode="numeric"
                        disabled={!editable || !resueltos}
                        value={m.visita || ""}
                        onChange={(e) => cambiarMarcador(partido, "visita", e.target.value)}
                        className="w-10 h-10 text-center text-lg font-bold border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex justify-end"><Equipo codigo={equipos[1]} alineado="right" /></div>
                  </div>

                  {esEmpate && resueltos && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-amber-600 font-medium mb-2">
                        Empate en el tiempo reglamentario. ¿Quién avanza? (no afecta tus puntos)
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); elegirAvance(partido, 0); }}
                          disabled={!editable}
                          className={"flex-1 py-2 rounded-lg text-sm font-semibold border disabled:opacity-60 " + (avances[partido] === 0 ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600")}
                        >
                          {EQUIPO_POR_CODIGO[equipos[0]]?.abrev}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); elegirAvance(partido, 1); }}
                          disabled={!editable}
                          className={"flex-1 py-2 rounded-lg text-sm font-semibold border disabled:opacity-60 " + (avances[partido] === 1 ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600")}
                        >
                          {EQUIPO_POR_CODIGO[equipos[1]]?.abrev}
                        </button>
                      </div>
                    </div>
                  )}

                  {puntos && (
                    <div className={"mt-3 -mx-3 -mb-3 px-3 py-2.5 rounded-b-xl border-l-4 " + (puntos.pts > 0 ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50")}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-0.5">
                          {puntos.motivos.length > 0 ? (
                            puntos.motivos.map((mot, i) => (
                              <span key={i} className="text-[11px] leading-tight text-emerald-700 font-medium">{mot}</span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Sin aciertos</span>
                          )}
                        </div>
                        <span className={"text-base font-extrabold tabular-nums " + (puntos.pts > 0 ? "text-emerald-600" : "text-slate-400")}>
                          {puntos.pts > 0 ? "+" + puntos.pts : "0"}
                        </span>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

function OverlayPartidoElim({ partido, equipos, nombreRonda, real, marcadoresReales, jugadores, marcadoresElimTodos, onCerrar }) {
  const local = esEquipoCodigo(equipos[0]) ? EQUIPO_POR_CODIGO[equipos[0]] : null;
  const visita = esEquipoCodigo(equipos[1]) ? EQUIPO_POR_CODIGO[equipos[1]] : null;
  const hayReal =
    real && real.local != null && real.visita != null && real.local !== "" && real.visita !== "";

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold">Predicciones · {nombreRonda}</h2>
        <button
          onClick={onCerrar}
          className="text-sm bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 font-medium transition active:scale-95"
        >
          Salir
        </button>
      </div>

      <div className="bg-white border-b px-4 py-3 shrink-0">
        <p className="text-center text-[10px] text-slate-300 mb-2">{partido}</p>
        <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
          <span className="flex items-center gap-2">
            {local && <Bandera iso={local.iso} tam={28} />}
            <span className="font-semibold text-sm text-slate-700">{local ? local.abrev : "—"}</span>
          </span>
          {hayReal ? (
            <span className="text-lg font-extrabold tabular-nums text-slate-800">
              {real.local} - {real.visita}
            </span>
          ) : (
            <span className="text-slate-300 text-sm font-medium">vs</span>
          )}
          <span className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-700">{visita ? visita.abrev : "—"}</span>
            {visita && <Bandera iso={visita.iso} tam={28} />}
          </span>
        </div>
        {hayReal && (
          <p className="text-center text-[10px] text-slate-400 mt-1">Resultado final</p>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {jugadores.length === 0 ? (
          <p className="text-center text-sm text-slate-400 mt-6">Cargando predicciones…</p>
        ) : (
          <ul className="space-y-2 max-w-md mx-auto">
            {jugadores.map((j, idx) => {
              const mj = marcadoresElimTodos[j.id]?.[partido] || {};
              const tiene =
                mj.local !== "" && mj.local != null && mj.visita !== "" && mj.visita != null;
              const pd =
                hayReal && tiene
                  ? puntosEliminatorias(
                      { marcadores: marcadoresElimTodos[j.id] || {} },
                      { marcadores: marcadoresReales }
                    ).desglose[partido]
                  : null;
              const acerto = pd && pd.pts > 0;
              return (
                <li
                  key={j.id}
                  className={
                    "bg-white rounded-xl px-3 py-2.5 shadow-sm flex items-center gap-3 " +
                    (acerto ? "border-l-4 border-emerald-500" : "")
                  }
                >
                  <span className="text-xs font-bold text-slate-400 w-5 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-700 flex-1 min-w-0 truncate">
                    {j.nombre}
                  </span>
                  <span
                    className={
                      "text-sm font-bold tabular-nums " +
                      (tiene ? "text-slate-700" : "text-slate-300")
                    }
                  >
                    {tiene ? `${mj.local} - ${mj.visita}` : "—"}
                  </span>
                  {hayReal && (
                    <span
                      className={
                        "text-sm font-extrabold tabular-nums w-10 text-right shrink-0 " +
                        (acerto ? "text-emerald-600" : "text-slate-300")
                      }
                    >
                      {acerto ? `+${pd.pts}` : tiene ? "0" : ""}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}