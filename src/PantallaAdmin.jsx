import { useState, useEffect } from 'react';
import AdminPremios from "./AdminPremios";
import AdminEliminatorias from "./AdminEliminatorias";
import {
  CLAVE_ADMIN,
  listarParticipantes,
  crearParticipante,
  construirLink,
  leerResultados,
  guardarResultado,
  borrarResultado,
  leerPrediccionesAbiertas,
  cambiarPrediccionesAbiertas,
  cambiarActivoParticipante,
  borrarParticipante,
  borrarTodosLosResultados,
  leerEstadoRondas,
  guardarEstadoRondas,
  RONDAS_ELIM,
} from './admin';
import { GRUPOS, LETRAS_GRUPOS, EQUIPO_POR_CODIGO } from './datos/equipos';
import { partidosDeGrupo } from './datos/partidos';
import Bandera from "./Bandera";

export default function PantallaAdmin() {
  return <PanelAdmin />;
}

function PanelAdmin() {
  const [seccion, setSeccion] = useState('participantes');

  return (
    <main className="p-4 max-w-md mx-auto pb-24">
      <h2 className="text-base font-semibold text-slate-700 mb-3 mt-2">
        Panel de administrador
      </h2>

      <ControlRondas />

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSeccion("participantes")}
          className={
            "flex-1 py-2 rounded-lg text-xs font-medium " +
            (seccion === "participantes" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border")
          }
        >
          Participantes
        </button>
        <button
          onClick={() => setSeccion("resultados")}
          className={
            "flex-1 py-2 rounded-lg text-xs font-medium " +
            (seccion === "resultados" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border")
          }
        >
          Grupos
        </button>
        <button
          onClick={() => setSeccion("eliminatorias")}
          className={
            "flex-1 py-2 rounded-lg text-xs font-medium " +
            (seccion === "eliminatorias" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border")
          }
        >
          Eliminatorias
        </button>
        <button
          onClick={() => setSeccion("premios")}
          className={
            "flex-1 py-2 rounded-lg text-xs font-medium " +
            (seccion === "premios" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border")
          }
        >
          Premios
        </button>
      </div>

      {seccion === 'participantes' && <SeccionParticipantes />}
      {seccion === 'resultados' && <SeccionResultados />}
      {seccion === "eliminatorias" && <AdminEliminatorias />}
      {seccion === "premios" && <AdminPremios />}
    </main>
  );
}

// --- Control de fase del torneo: grupos + rondas eliminatorias ---
function ControlRondas() {
  const [estado, setEstado] = useState(null);
  const [grupos, setGrupos] = useState(null); // true = abierta, false = solo ver
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    leerEstadoRondas().then(setEstado);
    leerPrediccionesAbiertas().then(setGrupos);
  }, []);

  async function cambiarRonda(clave, nuevoEstado) {
    if (!estado || guardando) return;
    const nuevo = { ...estado, [clave]: nuevoEstado };
    setEstado(nuevo);
    setGuardando(true);
    const res = await guardarEstadoRondas(nuevo);
    setGuardando(false);
    if (res.error) { leerEstadoRondas().then(setEstado); alert(res.error); }
  }

  async function cambiarGrupos(abierta) {
    if (guardando) return;
    setGrupos(abierta);
    setGuardando(true);
    const res = await cambiarPrediccionesAbiertas(abierta);
    setGuardando(false);
    if (res.error) { leerPrediccionesAbiertas().then(setGrupos); alert(res.error); }
  }

  if (estado === null || grupos === null)
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 text-sm text-slate-400">
        Cargando fase del torneo…
      </div>
    );

  const ESTADOS = [
    { val: "pendiente", icono: "🔒", texto: "Bloqueada" },
    { val: "abierta", icono: "🟢", texto: "Abierta" },
    { val: "cerrada", icono: "✅", texto: "Solo ver" },
  ];
  const colorActivo = {
    pendiente: "bg-slate-300 text-slate-700",
    abierta: "bg-emerald-600 text-white",
    cerrada: "bg-blue-500 text-white",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
      <p className="text-sm font-semibold text-slate-700 mb-1">Fase del torneo</p>
      <p className="text-xs text-slate-400 mb-3">
        Controla cada fase. Lo normal: ábrela mientras se predice/juega; cuando termine,
        ponla en “Solo ver” y abre la siguiente.
      </p>
      <ul className="space-y-2">
        {/* Fase de grupos (solo 2 estados) */}
        <li className="border-t pt-2 first:border-0 first:pt-0">
          <p className="text-xs font-medium text-slate-600 mb-1">Fase de grupos</p>
          <div className="flex gap-1">
            <button
              onClick={() => cambiarGrupos(true)}
              disabled={guardando}
              className={
                "flex-1 text-xs font-medium rounded-lg py-1.5 disabled:opacity-60 " +
                (grupos ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-500 border")
              }
            >
              🟢 Abierta
            </button>
            <button
              onClick={() => cambiarGrupos(false)}
              disabled={guardando}
              className={
                "flex-1 text-xs font-medium rounded-lg py-1.5 disabled:opacity-60 " +
                (!grupos ? "bg-blue-500 text-white" : "bg-slate-50 text-slate-500 border")
              }
            >
              ✅ Solo ver
            </button>
          </div>
        </li>

        {/* Rondas eliminatorias (3 estados) */}
        {RONDAS_ELIM.map((r) => {
          const actual = estado[r.clave] || "pendiente";
          return (
            <li key={r.clave} className="border-t pt-2">
              <p className="text-xs font-medium text-slate-600 mb-1">{r.nombre}</p>
              <div className="flex gap-1">
                {ESTADOS.map((e) => (
                  <button
                    key={e.val}
                    onClick={() => cambiarRonda(r.clave, e.val)}
                    disabled={guardando}
                    className={
                      "flex-1 text-xs font-medium rounded-lg py-1.5 disabled:opacity-60 " +
                      (actual === e.val ? colorActivo[e.val] : "bg-slate-50 text-slate-500 border")
                    }
                  >
                    {e.icono} {e.texto}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// --- Sección participantes ---
function SeccionParticipantes() {
  const [participantes, setParticipantes] = useState([]);
  const [nombre, setNombre] = useState('');
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(null);
  const [ocupadoId, setOcupadoId] = useState(null);

  async function recargar() {
    setParticipantes(await listarParticipantes());
  }
  useEffect(() => {
    recargar();
  }, []);

  async function alCrear() {
    setError('');
    if (!nombre.trim()) {
      setError('Escribe un nombre.');
      return;
    }
    setCreando(true);
    const res = await crearParticipante(nombre);
    setCreando(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setNombre('');
    await recargar();
  }

  async function copiarLink(p) {
    const link = construirLink(p.token);
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(p.id);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      window.prompt('Copia este link:', link);
    }
  }

  async function alternarActivo(p) {
    setOcupadoId(p.id);
    await cambiarActivoParticipante(p.id, !p.activo);
    setOcupadoId(null);
    await recargar();
  }

  async function eliminar(p) {
    const ok1 = window.confirm(
      `¿Borrar a "${p.nombre}" DEFINITIVAMENTE? Se perderán todas sus predicciones y su link dejará de servir. Esto no se puede deshacer.`
    );
    if (!ok1) return;
    const ok2 = window.confirm(`Confirma otra vez: borrar a "${p.nombre}" para siempre.`);
    if (!ok2) return;
    setOcupadoId(p.id);
    await borrarParticipante(p.id);
    setOcupadoId(null);
    await recargar();
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="text-sm font-semibold text-slate-600 mb-2">
          Crear participante
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && alCrear()}
            placeholder="Nombre de la persona"
            className="flex-1 border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={alCrear}
            disabled={creando}
            className="bg-emerald-600 text-white font-semibold rounded-lg px-4 disabled:opacity-60"
          >
            {creando ? '...' : 'Crear'}
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-600 mb-3">
          Participantes ({participantes.length})
        </h3>
        {participantes.length === 0 && (
          <p className="text-sm text-slate-400">Aún no hay participantes.</p>
        )}
        <ul className="space-y-3">
          {participantes.map((p) => (
            <li key={p.id} className="border-t pt-3 first:border-0 first:pt-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={"font-medium text-sm " + (p.activo ? "" : "text-slate-400 line-through")}>
                  {p.nombre}
                  {!p.activo && <span className="ml-2 text-xs no-underline">(inactivo)</span>}
                </span>
                <button
                  onClick={() => copiarLink(p)}
                  disabled={!p.activo}
                  className="text-xs bg-slate-100 hover:bg-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-600 disabled:opacity-40"
                >
                  {copiado === p.id ? '✅ Copiado' : '📋 Copiar link'}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => alternarActivo(p)}
                  disabled={ocupadoId === p.id}
                  className={
                    "flex-1 text-xs font-medium rounded-lg py-1.5 disabled:opacity-60 " +
                    (p.activo ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800")
                  }
                >
                  {ocupadoId === p.id ? '...' : p.activo ? 'Desactivar' : 'Reactivar'}
                </button>
                <button
                  onClick={() => eliminar(p)}
                  disabled={ocupadoId === p.id}
                  className="text-xs font-medium rounded-lg py-1.5 px-3 bg-red-50 text-red-600 disabled:opacity-60"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-400 mt-3">
          <strong>Desactivar:</strong> reversible, su link deja de servir y sale de
          posiciones. <strong>Borrar:</strong> definitivo, elimina sus predicciones.
        </p>
      </div>
    </>
  );
}

// --- Sección resultados reales (Grupos) ---
function SeccionResultados() {
  const [grupoActivo, setGrupoActivo] = useState('A');
  const [resultados, setResultados] = useState({});
  const [borrador, setBorrador] = useState({});
  const [guardandoId, setGuardandoId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [rellenando, setRellenando] = useState(false);

  async function recargar() {
    const r = await leerResultados();
    setResultados(r);
    const b = {};
    for (const id in r)
      b[id] = { local: String(r[id].local), visita: String(r[id].visita) };
    setBorrador(b);
    setCargando(false);
  }
  useEffect(() => {
    recargar();
  }, []);

  async function rellenarTodoAlAzar() {
    setRellenando(true);
    for (const L of LETRAS_GRUPOS) {
      for (const p of partidosDeGrupo(L)) {
        const gl = Math.floor(Math.random() * 4);
        const gv = Math.floor(Math.random() * 4);
        await guardarResultado(p.id, gl, gv);
      }
    }
    await recargar();
    setRellenando(false);
  }

  async function borrarTodo() {
    const ok1 = window.confirm(
      "¿Borrar TODOS los resultados reales (grupos, eliminatorias y premios)? Esto deja el prode lista para empezar el Mundial. NO borra las predicciones de los participantes."
    );
    if (!ok1) return;
    const ok2 = window.confirm("Confirma otra vez: se borrarán todos los resultados reales.");
    if (!ok2) return;
    setRellenando(true);
    await borrarTodosLosResultados();
    await recargar();
    setRellenando(false);
    alert("Resultados borrados. El prode está listo para los resultados reales.");
  }

  function cambiar(id, lado, valor) {
    if (valor !== '' && !/^\d{1,2}$/.test(valor)) return;
    setBorrador((prev) => ({ ...prev, [id]: { ...prev[id], [lado]: valor } }));
  }

  async function guardar(id) {
    const b = borrador[id] || {};
    setGuardandoId(id);
    const res = await guardarResultado(id, b.local, b.visita);
    setGuardandoId(null);
    if (res.error) {
      alert(res.error);
      return;
    }
    await recargar();
  }

  async function borrar(id) {
    setGuardandoId(id);
    await borrarResultado(id);
    setGuardandoId(null);
    setBorrador((prev) => {
      const copia = { ...prev };
      delete copia[id];
      return copia;
    });
    await recargar();
  }

  if (cargando)
    return (
      <p className="text-center text-slate-400 mt-6">Cargando resultados…</p>
    );

  const partidos = partidosDeGrupo(grupoActivo);

  return (
    <>
      <button
        onClick={rellenarTodoAlAzar}
        disabled={rellenando}
        className="mb-3 w-full bg-amber-100 text-amber-800 text-sm font-medium rounded-lg py-2 disabled:opacity-60"
      >
        {rellenando ? 'Rellenando…' : '🎲 Rellenar los 72 resultados reales al azar (prueba)'}
      </button>

      <button
        onClick={borrarTodo}
        disabled={rellenando}
        className="mb-3 w-full bg-red-50 text-red-600 text-sm font-medium rounded-lg py-2 disabled:opacity-60"
      >
        🗑️ Borrar TODOS los resultados reales
      </button>

      <nav className="flex overflow-x-auto gap-2 pb-3">
        {LETRAS_GRUPOS.map((letra) => (
          <button
            key={letra}
            onClick={() => setGrupoActivo(letra)}
            className={
              'shrink-0 w-10 h-10 rounded-full font-bold text-sm transition ' +
              (grupoActivo === letra ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 border')
            }
          >
            {letra}
          </button>
        ))}
      </nav>

      <p className="text-xs text-slate-400 mb-3">
        Mete el marcador real (tiempo reglamentario). Verde = ya guardado.
      </p>

      <ul className="space-y-3">
        {partidos.map((p) => {
          const local = EQUIPO_POR_CODIGO[p.local];
          const visita = EQUIPO_POR_CODIGO[p.visita];
          const b = borrador[p.id] || {};
          const guardado = resultados[p.id] != null;
          return (
            <li
              key={p.id}
              className={'rounded-xl px-3 py-3 shadow-sm ' + (guardado ? 'bg-emerald-50' : 'bg-white')}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Bandera iso={local.iso} tam={26} />
                  <span className="font-semibold text-sm">{local.abrev}</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={b.local || ''}
                    onChange={(e) => cambiar(p.id, 'local', e.target.value)}
                    className="w-9 h-9 text-center font-bold border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-slate-300 font-bold">:</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={b.visita || ''}
                    onChange={(e) => cambiar(p.id, 'visita', e.target.value)}
                    className="w-9 h-9 text-center font-bold border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="font-semibold text-sm">{visita.abrev}</span>
                  <Bandera iso={visita.iso} tam={26} />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => guardar(p.id)}
                  disabled={guardandoId === p.id}
                  className="flex-1 bg-emerald-600 text-white text-sm font-semibold rounded-lg py-1.5 disabled:opacity-60"
                >
                  {guardandoId === p.id ? '...' : guardado ? 'Actualizar' : 'Guardar'}
                </button>
                {guardado && (
                  <button
                    onClick={() => borrar(p.id)}
                    disabled={guardandoId === p.id}
                    className="bg-slate-200 text-slate-600 text-sm font-semibold rounded-lg px-3 disabled:opacity-60"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}