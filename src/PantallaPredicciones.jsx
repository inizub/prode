import { useState, useEffect, useRef, Fragment } from 'react';
import { GRUPOS, LETRAS_GRUPOS, EQUIPO_POR_CODIGO } from './datos/equipos';
import { partidosDeGrupo, PARTIDOS_GRUPOS } from './datos/partidos';
import { calcularTabla, empatesDuros } from './logica/clasificacion';
import { puntosPartidoGrupo, puntosBonusGrupos } from './logica/motorPuntaje';
import { leerResultados, leerMarcadoresDeParticipantes } from './admin';
import { obtenerPosiciones } from './posiciones';
import Bandera from './Bandera';

const ZONAS = {
  MX: { offset: -6 },
  ES: { offset: +2 },
  BO: { offset: -3 },
};

function fechaConvertida(fechaUTC, zona) {
  const off = (ZONAS[zona] || ZONAS.MX).offset;
  return new Date(new Date(fechaUTC).getTime() + off * 3600 * 1000);
}

function formatearFecha(fechaUTC, zona) {
  const d = fechaConvertida(fechaUTC, zona);
  const dias = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  return `${dias[d.getUTCDay()]} ${d.getUTCDate()}/${
    d.getUTCMonth() + 1
  } · ${String(d.getUTCHours()).padStart(2, '0')}:${String(
    d.getUTCMinutes()
  ).padStart(2, '0')}`;
}

function claveDia(fechaUTC, zona) {
  const d = fechaConvertida(fechaUTC, zona);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function etiquetaDia(fechaUTC, zona) {
  const d = fechaConvertida(fechaUTC, zona);
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${dias[d.getUTCDay()]} ${d.getUTCDate()} de ${meses[d.getUTCMonth()]}`;
}

export default function PantallaPredicciones({
  marcadores,
  onCambio,
  ordenFairPlay,
  onCambioFairPlay,
  zona = 'MX',
  bloqueado,
}) {
  const [vista, setVista] = useState('grupo'); // 'grupo' | 'crono'
  const [grupoActivo, setGrupoActivo] = useState('A');
  const [resultadosReales, setResultadosReales] = useState({});

  const [verPartido, setVerPartido] = useState(null);
  const [ordenJugadores, setOrdenJugadores] = useState([]);
  const [marcadoresTodos, setMarcadoresTodos] = useState({});

  useEffect(() => {
    leerResultados().then(setResultadosReales);
  }, []);

  useEffect(() => {
    if (!bloqueado) return;
    Promise.all([obtenerPosiciones(), leerMarcadoresDeParticipantes()]).then(
      ([pos, marc]) => {
        setOrdenJugadores(pos.map((p) => ({ id: p.id, nombre: p.nombre })));
        setMarcadoresTodos(marc);
      }
    );
  }, [bloqueado]);

  function cambiarMarcador(idPartido, lado, valor) {
    if (valor !== '' && !/^\d{1,2}$/.test(valor)) return;
    onCambio({
      ...marcadores,
      [idPartido]: { ...marcadores[idPartido], [lado]: valor },
    });
  }

  const partidos = partidosDeGrupo(grupoActivo);
  const equiposDelGrupo = GRUPOS[grupoActivo].map((e) => e.codigo);

  const grupoCompleto = partidos.every((p) => {
    const m = marcadores[p.id];
    return (
      m && m.local !== '' && m.visita !== '' && m.local != null && m.visita != null
    );
  });

  const empates = grupoCompleto
    ? empatesDuros(equiposDelGrupo, partidos, marcadores)
    : [];
  const ordenGrupo = (ordenFairPlay && ordenFairPlay[grupoActivo]) || null;

  const tabla = calcularTabla(equiposDelGrupo, partidos, marcadores, {}, ordenGrupo);

  const bonusGrupo = puntosBonusGrupos(
    marcadores,
    resultadosReales,
    ordenFairPlay || {}
  ).desglose[grupoActivo] || { puntos: 0, completo: false, porEquipo: {} };

  function definirOrden(nuevoOrdenDelGrupo) {
    onCambioFairPlay({
      ...(ordenFairPlay || {}),
      [grupoActivo]: nuevoOrdenDelGrupo,
    });
  }

  return (
    <div className="pb-40">
      {verPartido && (
        <OverlayPartido
          partido={verPartido}
          real={resultadosReales[verPartido.id]}
          jugadores={ordenJugadores}
          marcadoresTodos={marcadoresTodos}
          zona={zona}
          onCerrar={() => setVerPartido(null)}
        />
      )}

      {/* Toggle de vista */}
      <div className="px-3 pt-3">
        <div className="flex bg-slate-100 rounded-full p-1 max-w-md mx-auto">
          <button
            onClick={() => setVista('grupo')}
            className={
              'flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-150 ' +
              (vista === 'grupo' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500')
            }
          >
            Por grupo
          </button>
          <button
            onClick={() => setVista('crono')}
            className={
              'flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-150 ' +
              (vista === 'crono' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500')
            }
          >
            Cronológico
          </button>
        </div>
      </div>

      {vista === 'grupo' ? (
        <>
          <nav className="flex overflow-x-auto gap-2 px-3 py-3 bg-white border-b mt-3">
            {LETRAS_GRUPOS.map((letra) => (
              <button
                key={letra}
                onClick={() => setGrupoActivo(letra)}
                className={
                  'shrink-0 w-11 h-11 rounded-full font-bold text-sm transition active:scale-95 ' +
                  (grupoActivo === letra
                    ? 'bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-md shadow-blue-300'
                    : 'bg-slate-100 text-slate-600')
                }
              >
                {letra}
              </button>
            ))}
          </nav>

          <main className="p-4 max-w-md mx-auto">
            <h2 className="text-base font-semibold mb-3 text-slate-700">
              Grupo {grupoActivo} · Predice los marcadores
            </h2>

            {bloqueado && (
              <div className="mb-3 bg-amber-100 text-amber-800 text-sm rounded-lg px-3 py-2">
                🔒 Las predicciones están cerradas. Ya no se pueden editar.
              </div>
            )}

            <ul className="space-y-3">
              {partidos.map((p) => (
                <li key={p.id}>
                  <TarjetaPartido
                    partido={p}
                    marcador={marcadores[p.id]}
                    real={resultadosReales[p.id]}
                    bloqueado={bloqueado}
                    zona={zona}
                    onCambiar={(lado, valor) => cambiarMarcador(p.id, lado, valor)}
                    onVer={(p) => setVerPartido(p)}
                  />
                </li>
              ))}
            </ul>

            <TablaGrupo tabla={tabla} bonus={bonusGrupo} />

            {!bloqueado &&
              empates.map((conjunto, idx) => (
                <DesempateFairPlay
                  key={idx}
                  conjunto={conjunto}
                  ordenActual={ordenGrupo}
                  onDefinir={definirOrden}
                />
              ))}
          </main>
        </>
      ) : (
        <VistaCronologica
          marcadores={marcadores}
          resultadosReales={resultadosReales}
          bloqueado={bloqueado}
          zona={zona}
          onCambiar={cambiarMarcador}
          onVer={(p) => setVerPartido(p)}
        />
      )}
    </div>
  );
}

function VistaCronologica({ marcadores, resultadosReales, bloqueado, zona, onCambiar, onVer }) {
  const refs = useRef({});
  const refsDia = useRef({});
  const [altoHeader, setAltoHeader] = useState(64);

  useEffect(() => {
    const h = document.querySelector('header');
    if (h) setAltoHeader(h.offsetHeight);
  }, []);

  const ordenados = [...PARTIDOS_GRUPOS].sort(
    (a, b) => new Date(a.fechaUTC) - new Date(b.fechaUTC)
  );

  const idxHoy = ordenados.findIndex((p) => {
    const r = resultadosReales[p.id];
    return !r || r.local == null || r.visita == null;
  });

  useEffect(() => {
    const objetivo =
      idxHoy === -1 ? ordenados[ordenados.length - 1] : ordenados[idxHoy];
    if (!objetivo) return;
    const clave = claveDia(objetivo.fechaUTC, zona);
    function irAlDia(suave) {
      const el = refsDia.current[clave] || refs.current[objetivo.id];
      const h = document.querySelector('header');
      const offset = (h ? h.offsetHeight : altoHeader) + 12;
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, y), behavior: suave ? 'smooth' : 'auto' });
    }
    requestAnimationFrame(() =>
      setTimeout(() => {
        irAlDia(true);
        setTimeout(() => irAlDia(true), 250);
      }, 120)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultadosReales]);

  let diaPrev = null;

  return (
    <main className="p-4 max-w-md mx-auto">
      {bloqueado && (
        <div className="mb-3 bg-amber-100 text-amber-800 text-sm rounded-lg px-3 py-2">
          🔒 Las predicciones están cerradas. Ya no se pueden editar.
        </div>
      )}

      <div className="space-y-3">
        {ordenados.map((p) => {
          const dia = claveDia(p.fechaUTC, zona);
          const nuevoDia = dia !== diaPrev;
          diaPrev = dia;
          return (
            <Fragment key={p.id}>
              {nuevoDia && (
                <div
                  ref={(el) => (refsDia.current[dia] = el)}
                  style={{ top: altoHeader }}
                  className="sticky z-10 -mx-4 px-4 py-2 bg-slate-50/95 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 max-w-md mx-auto">
                    <span className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {etiquetaDia(p.fechaUTC, zona)}
                    </span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                </div>
              )}
              <div
                ref={(el) => (refs.current[p.id] = el)}
                className="scroll-mt-[108px]"
              >
                <TarjetaPartido
                  partido={p}
                  marcador={marcadores[p.id]}
                  real={resultadosReales[p.id]}
                  bloqueado={bloqueado}
                  zona={zona}
                  mostrarGrupo
                  onCambiar={(lado, valor) => onCambiar(p.id, lado, valor)}
                  onVer={onVer}
                />
              </div>
            </Fragment>
          );
        })}
      </div>
    </main>
  );
}

function TarjetaPartido({ partido, marcador, real, bloqueado, zona, mostrarGrupo, onCambiar, onVer }) {
  const local = EQUIPO_POR_CODIGO[partido.local];
  const visita = EQUIPO_POR_CODIGO[partido.visita];
  const m = marcador || {};
  const clickable = bloqueado && !!onVer;

  return (
    <div
      onClick={clickable ? () => onVer(partido) : undefined}
      className={
        'bg-white rounded-xl px-3 py-4 shadow-sm border border-slate-100 transition-shadow hover:shadow-md ' +
        (clickable ? 'cursor-pointer active:scale-[0.99]' : '')
      }
    >
      <div className="flex items-center justify-center gap-2 mb-3">
        {mostrarGrupo && (
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 rounded-full px-2 py-0.5">
            Grupo {partido.grupo}
          </span>
        )}
        <p className="text-center text-xs text-slate-400">
          {formatearFecha(partido.fechaUTC, zona)}
        </p>
        {clickable && (
          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 rounded-full px-2 py-0.5">
            👁 ver
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <Bandera iso={local.iso} tam={44} />
          <span className="font-semibold text-sm text-slate-700">{local.abrev}</span>
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          <input
            type="text"
            inputMode="numeric"
            disabled={bloqueado}
            value={m.local || ''}
            onChange={(e) => onCambiar('local', e.target.value)}
            className={
              "w-11 h-11 text-center text-lg font-bold border-2 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-slate-100 transition-colors " +
              (m.local !== '' && m.local != null
                ? "border-blue-400 bg-blue-50 text-blue-800"
                : "border-slate-200")
            }
          />
          <span className="text-slate-300 text-xs font-medium">vs</span>
          <input
            type="text"
            inputMode="numeric"
            disabled={bloqueado}
            value={m.visita || ''}
            onChange={(e) => onCambiar('visita', e.target.value)}
            className={
              "w-11 h-11 text-center text-lg font-bold border-2 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-slate-100 transition-colors " +
              (m.visita !== '' && m.visita != null
                ? "border-blue-400 bg-blue-50 text-blue-800"
                : "border-slate-200")
            }
          />
        </div>

        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <Bandera iso={visita.iso} tam={44} />
          <span className="font-semibold text-sm text-slate-700">{visita.abrev}</span>
        </div>
      </div>
      <EtiquetaPuntos prediccion={m} real={real} />
    </div>
  );
}

function OverlayPartido({ partido, real, jugadores, marcadoresTodos, zona, onCerrar }) {
  const local = EQUIPO_POR_CODIGO[partido.local];
  const visita = EQUIPO_POR_CODIGO[partido.visita];
  const hayReal = real && real.local != null && real.visita != null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold">Predicciones · Grupo {partido.grupo}</h2>
        <button
          onClick={onCerrar}
          className="text-sm bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 font-medium transition active:scale-95"
        >
          Salir
        </button>
      </div>

      <div className="bg-white border-b px-4 py-3 shrink-0">
        <p className="text-center text-xs text-slate-400 mb-2">
          {formatearFecha(partido.fechaUTC, zona)}
        </p>
        <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
          <span className="flex items-center gap-2">
            <Bandera iso={local.iso} tam={28} />
            <span className="font-semibold text-sm text-slate-700">{local.abrev}</span>
          </span>
          {hayReal ? (
            <span className="text-lg font-extrabold tabular-nums text-slate-800">
              {real.local} - {real.visita}
            </span>
          ) : (
            <span className="text-slate-300 text-sm font-medium">vs</span>
          )}
          <span className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-700">{visita.abrev}</span>
            <Bandera iso={visita.iso} tam={28} />
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
              const mj = marcadoresTodos[j.id]?.[partido.id] || {};
              const tiene =
                mj.local !== '' && mj.local != null && mj.visita !== '' && mj.visita != null;
              const pts = hayReal && tiene ? puntosPartidoGrupo(mj, real) : null;
              const acerto = pts && pts.puntos > 0;
              return (
                <li
                  key={j.id}
                  className={
                    'bg-white rounded-xl px-3 py-2.5 shadow-sm flex items-center gap-3 ' +
                    (acerto ? 'border-l-4 border-emerald-500' : '')
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
                      'text-sm font-bold tabular-nums ' +
                      (tiene ? 'text-slate-700' : 'text-slate-300')
                    }
                  >
                    {tiene ? `${mj.local} - ${mj.visita}` : '—'}
                  </span>
                  {hayReal && (
                    <span
                      className={
                        'text-sm font-extrabold tabular-nums w-10 text-right shrink-0 ' +
                        (acerto ? 'text-emerald-600' : 'text-slate-300')
                      }
                    >
                      {acerto ? `+${pts.puntos}` : tiene ? '0' : ''}
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

function DesempateFairPlay({ conjunto, ordenActual, onDefinir }) {
  let orden = conjunto;
  if (ordenActual) {
    const enOrden = ordenActual.filter((c) => conjunto.includes(c));
    const faltantes = conjunto.filter((c) => !enOrden.includes(c));
    orden = [...enOrden, ...faltantes];
  }

  function mover(codigo, direccion) {
    const i = orden.indexOf(codigo);
    const j = i + direccion;
    if (j < 0 || j >= orden.length) return;
    const nuevo = [...orden];
    [nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]];
    onDefinir(nuevo);
  }

  return (
    <div className="mt-4 bg-amber-50 border border-amber-300 rounded-xl p-4">
      <p className="text-sm font-semibold text-amber-800 mb-1">
        ⚖️ Empate que decides tú
      </p>
      <p className="text-xs text-amber-700 mb-3">
        Estos equipos quedan empatados en todos los criterios (puntos,
        diferencia de goles y goles). En la realidad se desempataría por fair
        play (tarjetas), algo que no se puede predecir. Ordénalos como crees que
        quedarán — esto afecta tu bracket.
      </p>
      <ul className="space-y-2">
        {orden.map((codigo, i) => {
          const eq = EQUIPO_POR_CODIGO[codigo];
          return (
            <li
              key={codigo}
              className="flex items-center justify-between bg-white rounded-lg px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="text-slate-400 w-4">{i + 1}º</span>
                <Bandera iso={eq.iso} tam={26} />
                {eq.abrev}
              </span>
              <span className="flex gap-1">
                <button
                  onClick={() => mover(codigo, -1)}
                  disabled={i === 0}
                  className="w-8 h-8 rounded bg-slate-100 disabled:opacity-30 font-bold"
                >
                  ↑
                </button>
                <button
                  onClick={() => mover(codigo, +1)}
                  disabled={i === orden.length - 1}
                  className="w-8 h-8 rounded bg-slate-100 disabled:opacity-30 font-bold"
                >
                  ↓
                </button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EtiquetaPuntos({ prediccion, real }) {
  if (!real || real.local == null || real.visita == null) return null;
  const r = puntosPartidoGrupo(prediccion, real);
  const gano = r.puntos > 0;
  const partes = gano ? r.motivo.split(' · ') : [];
  return (
    <div
      className={
        'mt-3 -mx-3 -mb-4 px-3 py-2.5 rounded-b-xl border-l-4 ' +
        (gano ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50')
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
            Final
          </span>
          <span className="text-sm font-bold text-slate-700 tabular-nums">
            {real.local} - {real.visita}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {gano ? (
            <div className="flex flex-col items-end gap-0.5">
              {partes.map((parte, i) => (
                <span
                  key={i}
                  className="text-[11px] leading-tight text-emerald-700 font-medium"
                >
                  {parte}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium">Sin aciertos</span>
          )}
          <span
            className={
              'text-base font-extrabold tabular-nums min-w-[2.5rem] text-right ' +
              (gano ? 'text-emerald-600' : 'text-slate-400')
            }
          >
            {gano ? `+${r.puntos}` : '0'}
          </span>
        </div>
      </div>
    </div>
  );
}

function TablaGrupo({ tabla, bonus }) {
  const porEquipo = (bonus && bonus.porEquipo) || {};
  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
      <h3 className="text-sm font-semibold px-3 py-2 bg-slate-100 text-slate-600">
        Tabla del grupo (en vivo)
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-xs">
            <th className="text-left px-3 py-1 font-medium">#</th>
            <th className="text-left py-1 font-medium">Equipo</th>
            <th className="px-2 py-1 font-medium">PJ</th>
            <th className="px-2 py-1 font-medium">DG</th>
            <th className="px-2 py-1 font-medium">GF</th>
            <th className="px-2 py-1 font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {tabla.map((fila) => {
            const eq = EQUIPO_POR_CODIGO[fila.eq];
            const colorFila =
              fila.pos <= 2 ? 'bg-emerald-50' : fila.pos === 3 ? 'bg-amber-50' : '';
            const etiqueta = porEquipo[fila.eq];
            return (
              <tr key={fila.eq} className={'border-t ' + colorFila}>
                <td className="px-3 py-2 text-slate-400">{fila.pos}</td>
                <td className="py-2">
                  <span className="flex items-center gap-2">
                    <Bandera iso={eq.iso} tam={22} />
                    <span className="font-medium">{eq.abrev}</span>
                    {etiqueta && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded px-1.5 py-0.5 whitespace-nowrap">
                        {etiqueta}
                      </span>
                    )}
                  </span>
                </td>
                <td className="text-center px-2 py-2">{fila.pj}</td>
                <td className="text-center px-2 py-2">
                  {fila.dg > 0 ? '+' + fila.dg : fila.dg}
                </td>
                <td className="text-center px-2 py-2">{fila.gf}</td>
                <td className="text-center px-2 py-2 font-bold">{fila.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-slate-400 px-3 py-2">
        🟢 Clasifican (1º y 2º) · 🟡 3º (posible mejor tercero)
        {bonus && bonus.completo && bonus.puntos > 0 && (
          <span className="block text-emerald-700 font-medium mt-1">
            Bonus de posición de este grupo: +{bonus.puntos}
          </span>
        )}
      </p>
    </div>
  );
}