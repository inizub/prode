import { useState } from "react";
import { CLAVE_ADMIN } from "./admin";

const ZONAS = {
  MX: { etiqueta: "Mexico (UTC−6)" },
  ES: { etiqueta: "España (UTC+2 verano)" },
  BO: { etiqueta: "Argentina (UTC−3)" },
};

export default function PantallaAjustes({ zona, onCambioZona, onAbrirAdmin }) {
  return (
    <main className="p-4 max-w-md mx-auto pb-24 space-y-4">
      <h2 className="text-base font-semibold text-slate-700 mt-2">Ajustes</h2>

      {/* Zona horaria */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Zona horaria</h3>
        <p className="text-xs text-slate-400 mb-3">
          Las fechas y horas de los partidos se muestran en esta zona.
        </p>
        <select
          value={zona}
          onChange={(e) => onCambioZona(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none"
        >
          {Object.entries(ZONAS).map(([k, v]) => (
            <option key={k} value={k}>{v.etiqueta}</option>
          ))}
        </select>
      </section>

      {/* Cómo funciona */}
      <Acordeon titulo="¿Cómo funciona el prode?">
        <div className="space-y-5">
          {/* Lo más importante */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-amber-800 mb-1">⏰ Lo más importante</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Completa tus <strong>72 marcadores de grupos</strong> antes de que arranque
              el primer partido del Mundial. Después, cada ronda se juega en su momento y hay que completar todos los marcadores de la ronda <strong>antes</strong> de que arranque el primero.
            </p>
          </div>

          <Paso n="1" titulo="Fase de grupos">
            Predice el marcador de los <strong>72 partidos</strong>. La tabla de cada
            grupo se actualiza en vivo.
          </Paso>
          <Paso n="2" titulo="Arranca el Mundial">
            Al empezar el primer partido, los grupos se cierran y entran los{" "}
            <strong>resultados reales</strong>.
          </Paso>
          <Paso n="3" titulo="Ronda por ronda">
            Cada fase eliminatoria se abre a su tiempo y predices sus{" "}
            <strong>partidos reales</strong>. En los empates, eliges quién avanza.
          </Paso>
          <Paso n="4" titulo="Premios y campeón">
            Eliges tus premios individuales y tu <strong>Campeón del Mundial</strong>.
          </Paso>
          <Paso n="5" titulo="Puntos en vivo">
            Sumas según tus aciertos y subes en la tabla <strong>en tiempo real</strong>.
          </Paso>
        </div>
      </Acordeon>

      {/* Cómo se puntúa */}
      <Acordeon titulo="Cómo se puntúa">
        <div className="space-y-4">
          {/* Grupos */}
          <Tarjeta titulo="Fase de grupos" subtitulo="Por cada partido">
            <FilaPunto pts="+3">Aciertas el <strong>ganador</strong> o el <strong>empate</strong></FilaPunto>
            <FilaPunto pts="+1">Aciertas la <strong>diferencia de goles</strong> (mismo margen y mismo ganador). Un empate también cuenta.</FilaPunto>
            <FilaPunto pts="+2">Marcador <strong>exacto</strong></FilaPunto>
            <Nota>
              Ej.: predices 1-0 y queda 2-1 → +3 (ganador) y +1 (diferencia) = 4. Si
              aciertas el marcador exacto te llevas los tres = <strong>6</strong>.
            </Nota>
          </Tarjeta>

          {/* Bonus de posición */}
          <Tarjeta titulo="Bonus de posición de grupo" subtitulo="Se otorga al cerrar el grupo">
            <FilaPunto pts="+2"><strong>1º</strong> del grupo exacto</FilaPunto>
            <FilaPunto pts="+2"><strong>2º</strong> del grupo exacto</FilaPunto>
            <FilaPunto pts="+1">Un equipo que quedó <strong>top 2</strong> pero en la posición cambiada (por equipo)</FilaPunto>
            <Nota>
              Se calcula cuando el grupo tiene <strong>todos sus resultados reales</strong>,
              comparando con cómo quedó de verdad.
            </Nota>
          </Tarjeta>

          {/* Eliminatorias */}
          <Tarjeta titulo="Eliminatorias" subtitulo="Igual que un partido de grupos">
            <FilaPunto pts="+3">Aciertas el <strong>ganador</strong> o el <strong>empate</strong> del partido</FilaPunto>
            <FilaPunto pts="+1">Aciertas la <strong>diferencia de goles</strong></FilaPunto>
            <FilaPunto pts="+2">Marcador <strong>exacto</strong></FilaPunto>
            <Nota>
              Máximo <strong>6</strong> por partido. Cuenta el tiempo reglamentario (90');
              prórroga y penales no dan puntos, solo deciden quién avanza. Aplica a todas
              las rondas, incluida la Final.
            </Nota>
          </Tarjeta>

          {/* Premios */}
          <Tarjeta titulo="Premios individuales">
            <FilaPunto pts="+10">🏆 <strong>Campeón del Mundial</strong></FilaPunto>
            <FilaPunto pts="+5">Bota de Oro (goleador)</FilaPunto>
            <FilaPunto pts="+5">Balón de Oro (mejor jugador)</FilaPunto>
            <FilaPunto pts="+3">Máximo asistidor</FilaPunto>
            <FilaPunto pts="+3">Mejor jugador joven</FilaPunto>
          </Tarjeta>
        </div>
      </Acordeon>

      {/* Acceso administrador */}
      <AccesoAdmin onAbrirAdmin={onAbrirAdmin} />

      <p className="text-center text-xs text-slate-300">Prode Mundial</p>
    </main>
  );
}

// Paso numerado (círculo verde alineado con el título).
function Paso({ n, titulo, children }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center leading-none">
        {n}
      </div>
      <div className="flex-1 pt-0.5">
        <p className="text-sm font-semibold text-slate-700 leading-none mb-1.5">{titulo}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

// Tarjeta de una categoría de puntaje.
function Tarjeta({ titulo, subtitulo, children }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-700">{titulo}</p>
        {subtitulo && <p className="text-[11px] text-slate-400">{subtitulo}</p>}
      </div>
      <div className="p-3 space-y-2">{children}</div>
    </div>
  );
}

// Fila: texto a la izquierda, píldora verde con los puntos a la derecha.
function FilaPunto({ pts, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-600 leading-snug">{children}</span>
      <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-1">
        {pts}
      </span>
    </div>
  );
}

// Nota gris al pie de una tarjeta.
function Nota({ children }) {
  return <p className="text-[11px] text-slate-400 leading-relaxed pt-1">{children}</p>;
}

// Sección plegable reutilizable.
function Acordeon({ titulo, children }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setAbierto((a) => !a)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-slate-700">{titulo}</span>
        <span className={"text-slate-400 transition-transform " + (abierto ? "rotate-180" : "")}>▾</span>
      </button>
      {abierto && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

function AccesoAdmin({ onAbrirAdmin }) {
  const [abierto, setAbierto] = useState(false);
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  function entrar() {
    if (clave === CLAVE_ADMIN) {
      setError("");
      setClave("");
      setAbierto(false);
      onAbrirAdmin();
    } else {
      setError("Contraseña incorrecta.");
    }
  }

  return (
    <section className="bg-white rounded-xl shadow-sm p-4">
      {!abierto ? (
        <button onClick={() => setAbierto(true)} className="text-sm text-slate-500 font-medium">
          🔒 Acceso administrador
        </button>
      ) : (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">🔒 Acceso administrador</h3>
          <div className="flex gap-2">
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && entrar()}
              placeholder="Contraseña"
              className="flex-1 border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none"
            />
            <button onClick={entrar} className="bg-blue-600 text-white font-semibold rounded-lg px-4">
              Entrar
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
      )}
    </section>
  );
}