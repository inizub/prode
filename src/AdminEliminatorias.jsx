import { useState, useEffect } from "react";
import { EQUIPO_POR_CODIGO } from "./datos/equipos";
import { RONDAS } from "./datos/cruces";
import { leerResultados, leerBracketReal, guardarBracketReal } from "./admin";
import { construirBracketReal } from "./logica/bracketReal";
import { calcularTabla } from "./logica/clasificacion";
import { GRUPOS, LETRAS_GRUPOS } from "./datos/equipos";
import { partidosDeGrupo } from "./datos/partidos";
import { detectarEmpatesFairPlay, empatesTerceros } from "./logica/motorBracket";
import Bandera from "./Bandera";
import DesempateTerceros from "./DesempateTerceros";

// Muestra un equipo (bandera + abreviatura) o un guion si no está definido.
function Equipo({ codigo }) {
  if (!codigo) return <span className="text-slate-300 text-sm">— por definir —</span>;
  const eq = EQUIPO_POR_CODIGO[codigo];
  if (!eq) return <span className="text-sm">{codigo}</span>;
  return (
    <span className="flex items-center gap-1.5 text-sm font-medium">
      <Bandera iso={eq.iso} tam={24} />
      <span>{eq.abrev}</span>
    </span>
  );
}

export default function AdminEliminatorias() {
  const [resultadosGrupos, setResultadosGrupos] = useState({});
  const [bracketReal, setBracketRealState] = useState({
    marcadoresElim: {},
    avancesElim: {},
    correccionesR32: {},
    ordenFairPlay: {},
    desempateTerceros: [],
  });
  const [rondaActiva, setRondaActiva] = useState("R32");
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState("idle"); // idle | guardando | guardado | error

  async function recargar() {
    const [res, br] = await Promise.all([leerResultados(), leerBracketReal()]);
    setResultadosGrupos(res);
    setBracketRealState({
      marcadoresElim: br.marcadoresElim || {},
      avancesElim: br.avancesElim || {},
      correccionesR32: br.correccionesR32 || {},
      ordenFairPlay: br.ordenFairPlay || {},
      desempateTerceros: br.desempateTerceros || [],
    });
    setCargando(false);
  }
  useEffect(() => {
    recargar();
  }, []);

  // ¿Están los 72 de grupos metidos? Necesario para armar el bracket real.
  const totalGrupos = Object.keys(resultadosGrupos).length;
  const gruposCompletos = totalGrupos === 72;

  if (cargando)
    return <p className="text-center text-slate-400 mt-6">Cargando…</p>;

  if (!gruposCompletos) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        🔒 Para armar el bracket real necesitas haber metido los <strong>72
        resultados de fase de grupos</strong> primero (llevas {totalGrupos}/72).
        Ve a la pestaña "Resultados reales" y complétalos.
      </div>
    );
  }

  // Detectar empates de grupo que solo se resuelven por fair play.
  const empatesFairPlay = detectarEmpatesFairPlay(resultadosGrupos);

  // Detectar empates de terceros (corte 8º/9º) del Mundial real.
  const empatesTerc = empatesTerceros(
    resultadosGrupos,
    bracketReal.ordenFairPlay || {},
    bracketReal.desempateTerceros || []
  );

  // Armar el bracket real con todo lo que hay (incluye los desempates del admin).
  const real = construirBracketReal(
    resultadosGrupos,
    bracketReal.marcadoresElim,
    bracketReal.avancesElim,
    bracketReal.correccionesR32,
    bracketReal.ordenFairPlay || {},
    bracketReal.desempateTerceros || []
  );

  // --- Guardado ---
  async function guardar(nuevo) {
    const data = nuevo || bracketReal;
    setEstado("guardando");
    const res = await guardarBracketReal(data);
    setEstado(res.error ? "error" : "guardado");
  }

  // Cambiar marcador real de un partido de eliminatoria.
  function cambiarMarcador(partido, lado, valor) {
    if (valor !== "" && !/^\d{1,2}$/.test(valor)) return;
    const nuevo = {
      ...bracketReal,
      marcadoresElim: {
        ...bracketReal.marcadoresElim,
        [partido]: { ...bracketReal.marcadoresElim[partido], [lado]: valor },
      },
    };
    setBracketRealState(nuevo);
    setEstado("idle");
  }

  // Decidir quién avanzó (para empates de eliminatoria).
  function decidirAvance(partido, idx) {
    const nuevo = {
      ...bracketReal,
      avancesElim: { ...bracketReal.avancesElim, [partido]: idx },
    };
    setBracketRealState(nuevo);
    setEstado("idle");
  }

  const ronda = RONDAS.find((r) => r.clave === rondaActiva);

  return (
    <div>
      <TablasReales
        resultadosGrupos={resultadosGrupos}
        ordenFairPlay={bracketReal.ordenFairPlay || {}}
      />
      {/* Aviso de fair play en grupos (si aplica) */}
      {empatesFairPlay.length > 0 && (
        <FairPlayGrupos
          empates={empatesFairPlay}
          bracketReal={bracketReal}
          onGuardar={(nuevo) => {
            setBracketRealState(nuevo);
            guardar(nuevo);
          }}
        />
      )}

      {/* Desempate de terceros del Mundial real (corte 8º/9º) */}
      {empatesTerc.length > 0 && (
        <div className="mb-4">
          <DesempateTerceros
            empates={empatesTerc}
            desempateTerceros={bracketReal.desempateTerceros || []}
            tercerosPorGrupo={real.base.tercerosPorGrupo}
            onCambio={(nuevo) => {
              const actualizado = { ...bracketReal, desempateTerceros: nuevo };
              setBracketRealState(actualizado);
              guardar(actualizado);
            }}
          />
        </div>
      )}

      {/* Tabs de rondas */}
      <nav className="flex overflow-x-auto gap-2 pb-3">
        {RONDAS.map((r) => (
          <button
            key={r.clave}
            onClick={() => setRondaActiva(r.clave)}
            className={
              "shrink-0 px-3 h-9 rounded-full text-xs font-semibold transition " +
              (rondaActiva === r.clave
                ? "bg-red-600 text-white"
                : "bg-white text-slate-600 border")
            }
          >
            {r.nombre}
          </button>
        ))}
      </nav>

      <p className="text-xs text-slate-400 mb-3">
        Mete el marcador real (tiempo reglamentario) de cada partido. Si hay
        empate, indica quién avanzó.
      </p>

      <ul className="space-y-3">
        {ronda.partidos.map((partido) => {
          const equipos = real.rondas[rondaActiva][partido] || [null, null];
          const m = bracketReal.marcadoresElim[partido] || {};
          const esEmpate =
            m.local !== "" && m.visita !== "" && m.local != null && m.visita != null &&
            Number(m.local) === Number(m.visita);
          const guardado = m.local != null && m.visita != null && m.local !== "" && m.visita !== "";

          return (
            <li
              key={partido}
              className={"rounded-xl px-3 py-3 shadow-sm " + (guardado ? "bg-emerald-50" : "bg-white")}
            >
              <p className="text-center text-[10px] text-slate-300 mb-2">{partido}</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0"><Equipo codigo={equipos[0]} /></div>
                <div className="flex items-center gap-1">
                  <input
                    type="text" inputMode="numeric"
                    disabled={!equipos[0] || !equipos[1]}
                    value={m.local || ""}
                    onChange={(e) => cambiarMarcador(partido, "local", e.target.value)}
                    className="w-9 h-9 text-center font-bold border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none disabled:bg-slate-100"
                  />
                  <span className="text-slate-300 font-bold">:</span>
                  <input
                    type="text" inputMode="numeric"
                    disabled={!equipos[0] || !equipos[1]}
                    value={m.visita || ""}
                    onChange={(e) => cambiarMarcador(partido, "visita", e.target.value)}
                    className="w-9 h-9 text-center font-bold border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none disabled:bg-slate-100"
                  />
                </div>
                <div className="flex-1 min-w-0 flex justify-end"><Equipo codigo={equipos[1]} /></div>
              </div>

              {/* Empate: quién avanzó */}
              {esEmpate && equipos[0] && equipos[1] && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-amber-600 font-medium mb-2">
                    Empate en el reglamentario. ¿Quién avanzó? (prórroga/penales)
                  </p>
                  <div className="flex gap-2">
                    {[0, 1].map((idx) => (
                      <button
                        key={idx}
                        onClick={() => decidirAvance(partido, idx)}
                        className={
                          "flex-1 py-2 rounded-lg text-sm font-semibold border " +
                          (bracketReal.avancesElim[partido] === idx
                            ? "bg-red-600 text-white border-amber-500"
                            : "bg-white text-slate-600")
                        }
                      >
                        {EQUIPO_POR_CODIGO[equipos[idx]]?.abrev}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Barra de guardado */}
      <div className="sticky bottom-16 mt-4">
        <button
          onClick={() => guardar()}
          disabled={estado === "guardando"}
          className="w-full bg-emerald-600 text-white font-semibold rounded-lg py-3 disabled:opacity-60"
        >
          {estado === "guardando" ? "Guardando…" : "Guardar resultados de eliminatorias"}
        </button>
        {estado === "guardado" && (
          <p className="text-center text-emerald-600 text-sm mt-1">✅ Guardado</p>
        )}
        {estado === "error" && (
          <p className="text-center text-red-600 text-sm mt-1">⚠️ Error al guardar</p>
        )}
      </div>
    </div>
  );
}

// --- Aviso de fair play para empates de grupo (flujo normal) ---
// --- Selector de fair play para empates de grupo (funcional) ---
function FairPlayGrupos({ empates, bracketReal, onGuardar }) {
  // Sube/baja un equipo dentro del orden de su grupo.
  function mover(grupo, equiposEmpatados, idx, dir) {
    // Orden actual: el guardado, o el orden de empate por defecto.
    const actual = (bracketReal.ordenFairPlay && bracketReal.ordenFairPlay[grupo])
      ? [...bracketReal.ordenFairPlay[grupo]]
      : [...equiposEmpatados];
    const j = idx + dir;
    if (j < 0 || j >= actual.length) return;
    [actual[idx], actual[j]] = [actual[j], actual[idx]];
    const nuevo = {
      ...bracketReal,
      ordenFairPlay: { ...(bracketReal.ordenFairPlay || {}), [grupo]: actual },
    };
    onGuardar(nuevo);
  }

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-4">
      <p className="text-sm font-semibold text-amber-800 mb-1">⚖️ Desempate por fair play</p>
      <p className="text-xs text-amber-700 mb-3">
        En estos grupos hay equipos empatados en todos los criterios deportivos. El
        desempate real fue por fair play (tarjetas), que la app no puede saber. Ordénalos
        del <strong>mejor (arriba)</strong> al peor con las flechas:
      </p>
      {empates.map((emp) => {
        const orden = (bracketReal.ordenFairPlay && bracketReal.ordenFairPlay[emp.grupo])
          ? bracketReal.ordenFairPlay[emp.grupo]
          : emp.equipos;
        return (
          <div key={emp.grupo} className="mb-3 last:mb-0">
            <p className="text-xs font-medium text-slate-600 mb-1.5">Grupo {emp.grupo}</p>
            <ul className="space-y-1">
              {orden.map((cod, idx) => (
                <li key={cod} className="flex items-center gap-2 bg-white rounded-lg px-2 py-1.5 border">
                  <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}º</span>
                  <span className="flex-1"><Equipo codigo={cod} /></span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => mover(emp.grupo, emp.equipos, idx, -1)}
                      disabled={idx === 0}
                      className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 font-bold disabled:opacity-30"
                    >↑</button>
                    <button
                      onClick={() => mover(emp.grupo, emp.equipos, idx, 1)}
                      disabled={idx === orden.length - 1}
                      className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 font-bold disabled:opacity-30"
                    >↓</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// --- Tablas reales de los 12 grupos (con los resultados reales metidos) ---
function TablasReales({ resultadosGrupos, ordenFairPlay }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-slate-700 mb-2">Cómo quedaron los grupos (real)</p>
      <div className="grid grid-cols-2 gap-2">
        {LETRAS_GRUPOS.map((L) => {
          const equipos = GRUPOS[L].map((e) => e.codigo);
          const partidos = partidosDeGrupo(L);
          const tabla = calcularTabla(equipos, partidos, resultadosGrupos, {}, ordenFairPlay[L] || null);
          return (
            <div key={L} className="bg-white rounded-xl shadow-sm p-2">
              <p className="text-xs font-bold text-slate-500 mb-1">Grupo {L}</p>
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-slate-400">
                    <th className="text-left font-medium">#</th>
                    <th className="text-left font-medium">Eq</th>
                    <th className="text-right font-medium">DG</th>
                    <th className="text-right font-medium">Pt</th>
                  </tr>
                </thead>
                <tbody>
                  {tabla.map((fila, i) => {
                    const eq = EQUIPO_POR_CODIGO[fila.eq];
                    const clasifica = i < 2;
                    return (
                      <tr key={fila.eq} className={clasifica ? "text-slate-800 font-semibold" : "text-slate-400"}>
                        <td>{i + 1}</td>
                        <td className="flex items-center gap-1 py-0.5">
                          {eq && <Bandera iso={eq.iso} tam={14} />}
                          <span>{eq ? eq.abrev : fila.eq}</span>
                        </td>
                        <td className="text-right tabular-nums">{fila.dg > 0 ? "+" + fila.dg : fila.dg}</td>
                        <td className="text-right tabular-nums font-bold">{fila.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 mt-1">Verde/oscuro = clasifican (1º y 2º). Los mejores terceros se deciden aparte.</p>
    </div>
  );
}