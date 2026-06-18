import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  buscarParticipantePorToken,
  leerPrediccion,
  guardarPrediccion,
} from "./almacenamiento";
import PantallaPredicciones from "./PantallaPredicciones";
import PantallaPosiciones from "./PantallaPosiciones";
import PantallaBracket from "./PantallaBracket";
import PantallaPremios from "./PantallaPremios";
import PantallaAjustes from "./PantallaAjustes";
import PantallaAdmin from "./PantallaAdmin";
import PantallaBienvenida from "./PantallaBienvenida";

// Lee el token del participante desde la URL (?jugador=TOKEN).
function tokenDeLaUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("jugador");
  } catch {
    return null;
  }
}

export default function App() {
  const [pantalla, setPantalla] = useState("predicciones");
  const [adminAbierto, setAdminAbierto] = useState(false);
  const [mostrarBienvenida, setMostrarBienvenida] = useState(true);

  const [participante, setParticipante] = useState(null);
  const [abiertas, setAbiertas] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Partes de la predicción
  const [marcadoresGrupos, setMarcadoresGrupos] = useState({});
  const [bracketPred, setBracketPred] = useState({ avances: {}, marcadores: {} });
  const [ordenFairPlay, setOrdenFairPlay] = useState({});
  const [desempateTerceros, setDesempateTerceros] = useState([]);
  const [premios, setPremios] = useState({});
  const [zona, setZona] = useState("MX");

  const [estadoGuardado, setEstadoGuardado] = useState("idle");

  useEffect(() => {
    async function inicializar() {
      try {
        const { data: cfg } = await supabase
          .from("config")
          .select("valor")
          .eq("clave", "predicciones_abiertas")
          .maybeSingle();
        setAbiertas(cfg ? cfg.valor === true : true);

        const token = tokenDeLaUrl();
        if (token) {
          const p = await buscarParticipantePorToken(token);
          setParticipante(p);
          if (p) {
            const datos = await leerPrediccion(p.id);
            setMarcadoresGrupos(datos.marcadoresGrupos || {});
            setBracketPred(datos.bracket || { avances: {}, marcadores: {} });
            setOrdenFairPlay(datos.ordenFairPlay || {});
            setDesempateTerceros(datos.desempateTerceros || []);
            setPremios(datos.premios || {});
            if (datos.zona) setZona(datos.zona);
          }
        }
      } catch (e) {
        console.error("Error al inicializar:", e);
      } finally {
        setCargando(false);
      }
    }
    inicializar();
  }, []);

  // Realtime: si el admin abre/cierra la fase de grupos, se refleja al instante.
  useEffect(() => {
    const canal = supabase
      .channel("cfg-predicciones-abiertas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "config" },
        async () => {
          const { data } = await supabase
            .from("config")
            .select("valor")
            .eq("clave", "predicciones_abiertas")
            .maybeSingle();
          setAbiertas(data ? data.valor === true : true);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const bloqueado = abiertas === false;
  const haySesion = !!participante;

  useEffect(() => {
    if (!cargando && !haySesion &&
        (pantalla === "predicciones" || pantalla === "bracket" || pantalla === "premios")) {
      setPantalla("posiciones");
    }
  }, [cargando, haySesion, pantalla]);

  async function guardarTodo() {
    if (!participante) return;
    setEstadoGuardado("guardando");
    const ok = await guardarPrediccion(participante.id, {
      marcadoresGrupos,
      bracket: bracketPred,
      ordenFairPlay,
      desempateTerceros,
      premios,
      zona,
    });
    setEstadoGuardado(ok ? "guardado" : "error");
  }

  function alCambiarGrupos(nuevos) { setMarcadoresGrupos(nuevos); setEstadoGuardado("idle"); }
  function alCambiarBracket(nuevo) { setBracketPred(nuevo); setEstadoGuardado("idle"); }
  function alCambiarFairPlay(nuevo) { setOrdenFairPlay(nuevo); setEstadoGuardado("idle"); }
  function alCambiarDesempateTerceros(nuevo) { setDesempateTerceros(nuevo); setEstadoGuardado("idle"); }
  function alCambiarPremios(nuevo) { setPremios(nuevo); setEstadoGuardado("idle"); }

  async function alCambiarZona(nuevaZona) {
    setZona(nuevaZona);
    if (participante) {
      await guardarPrediccion(participante.id, {
        marcadoresGrupos, bracket: bracketPred, ordenFairPlay, desempateTerceros, premios, zona: nuevaZona,
      });
    }
  }

  if (cargando)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Cargando…
      </div>
    );

  // Pantalla de bienvenida (se muestra cada vez que se abre la app).
  if (mostrarBienvenida) {
    return (
      <PantallaBienvenida
        nombre={participante ? participante.nombre : null}
        onEntrar={() => setMostrarBienvenida(false)}
      />
    );
  }

  // Panel de admin a pantalla completa.
  if (adminAbierto) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-3 shadow-lg sticky top-0 z-20 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">⚙️ Administración</h1>
          <button
            onClick={() => setAdminAbierto(false)}
            className="text-sm bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5 font-medium transition active:scale-95"
          >
            Salir
          </button>
        </header>
        <PantallaAdmin />
      </div>
    );
  }

  const mostrarBarraGuardado =
    haySesion &&
    (pantalla === "bracket" ||
      ((pantalla === "predicciones" || pantalla === "premios") && !bloqueado));

  function PantallaSinLink() {
    return (
      <main className="p-4 max-w-md mx-auto pb-24">
        <div className="bg-white border border-slate-200 rounded-xl p-6 mt-6 text-center">
          <p className="text-4xl mb-3">🔑</p>
          <p className="font-semibold text-slate-700 mb-1">Necesitas tu link personal</p>
          <p className="text-sm text-slate-500">
            Para hacer tus predicciones, entra con el link que te compartió tu grupo.
            Mientras tanto, puedes ver la tabla de posiciones.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 text-slate-900">
      {/* Header con degradado azul */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-3 shadow-lg sticky top-0 z-20">
      <div className="flex items-center justify-between gap-3">
          <div className="text-left">
          <h1 className="text-xl font-serif font-bold tracking-tight leading-none text-white">
              Alfajor <span className="text-sky-300">vs</span> Tortilla
            </h1>
            <p className="text-[10px] uppercase tracking-[0.25em] text-sky-200/90 mt-0.5">
              Prode Mundial 2026
            </p>
          </div>
          <span className="text-xs font-medium text-white bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1">
            {participante ? participante.nombre : "Invitado"}
          </span>
        </div>
      </header>

      {/* Contenido con animación de entrada al cambiar de pestaña */}
      <div key={pantalla} className="animate-pantalla">
        {pantalla === "predicciones" && (
          haySesion ? (
            <PantallaPredicciones
              marcadores={marcadoresGrupos}
              onCambio={alCambiarGrupos}
              ordenFairPlay={ordenFairPlay}
              onCambioFairPlay={alCambiarFairPlay}
              zona={zona}
              bloqueado={bloqueado}
            />
          ) : <PantallaSinLink />
        )}
        {pantalla === "bracket" && (
          haySesion ? (
            <PantallaBracket
              bracketPred={bracketPred}
              onCambio={alCambiarBracket}
            />
          ) : <PantallaSinLink />
        )}
        {pantalla === "premios" && (
          haySesion ? (
            <PantallaPremios
              premios={premios}
              onCambio={alCambiarPremios}
              bloqueado={bloqueado}
            />
          ) : <PantallaSinLink />
        )}
        {pantalla === "posiciones" && <PantallaPosiciones />}
        {pantalla === "ajustes" && (
          <PantallaAjustes
            zona={zona}
            onCambioZona={alCambiarZona}
            onAbrirAdmin={() => setAdminAbierto(true)}
          />
        )}
      </div>

      {mostrarBarraGuardado && (
        <div className="fixed bottom-16 inset-x-0 bg-white border-t px-4 py-3 z-20">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <button
              onClick={guardarTodo}
              disabled={estadoGuardado === "guardando"}
              className="flex-1 bg-blue-600 text-white font-semibold rounded-lg py-3 disabled:opacity-60 transition active:scale-95"
            >
              {estadoGuardado === "guardando" ? "Guardando…" : "Guardar predicción"}
            </button>
            {estadoGuardado === "guardado" && (
              <span className="text-emerald-600 text-sm font-medium animate-pop">✅ Guardado</span>
            )}
            {estadoGuardado === "error" && (
              <span className="text-red-600 text-sm font-medium animate-pop">⚠️ Error</span>
            )}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t flex z-30">
        <BotonMenu activo={pantalla === "predicciones"} onClick={() => setPantalla("predicciones")} icono="✏️" texto="Predicciones" />
        <BotonMenu activo={pantalla === "bracket"} onClick={() => setPantalla("bracket")} icono="🏟️" texto="Bracket" />
        <BotonMenu activo={pantalla === "premios"} onClick={() => setPantalla("premios")} icono="🥇" texto="Premios" />
        <BotonMenu activo={pantalla === "posiciones"} onClick={() => setPantalla("posiciones")} icono="🏆" texto="Posiciones" />
        <BotonMenu activo={pantalla === "ajustes"} onClick={() => setPantalla("ajustes")} icono="⚙️" texto="Ajustes" />
      </nav>
    </div>
  );
}

function BotonMenu({ activo, onClick, icono, texto }) {
  return (
    <button
      onClick={onClick}
      className={
        "flex-1 py-2.5 text-center font-medium transition-colors relative active:scale-95 " +
        (activo ? "text-blue-700" : "text-slate-400")
      }
    >
      {activo && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-700 rounded-full" />
      )}
      <div className="text-lg leading-none">{icono}</div>
      <div className="text-[10px] mt-0.5">{texto}</div>
    </button>
  );
}