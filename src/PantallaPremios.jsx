import { useState } from "react";
import { GRUPOS, LETRAS_GRUPOS, EQUIPO_POR_CODIGO } from "./datos/equipos";
import Bandera from "./Bandera";

const PREMIOS = [
  { clave: "botaOro", titulo: "🥇 Bota de Oro", desc: "Máximo goleador del torneo", pts: 5 },
  { clave: "balonOro", titulo: "🏅 Balón de Oro", desc: "Mejor jugador del torneo", pts: 5 },
  { clave: "asistidor", titulo: "🎯 Máximo asistidor", desc: "Jugador con más asistencias", pts: 3 },
  { clave: "joven", titulo: "🌟 Mejor jugador joven", desc: "Mejor jugador sub-21", pts: 3 },
];

// Lista de equipos (un país por código de equipo del Mundial), en orden alfabético.
const EQUIPOS_MUNDIAL = (() => {
  const vistos = new Set();
  const lista = [];
  for (const L of LETRAS_GRUPOS) {
    for (const e of GRUPOS[L]) {
      const eq = EQUIPO_POR_CODIGO[e.codigo];
      if (eq && !vistos.has(eq.abrev)) {
        vistos.add(eq.abrev);
        lista.push(eq);
      }
    }
  }
  return lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
})();

export default function PantallaPremios({ premios, onCambio, bloqueado }) {
  function cambiar(clave, valor) {
    onCambio({ ...premios, [clave]: valor });
  }

  return (
    <main className="p-4 max-w-md mx-auto pb-40">
      <h2 className="text-base font-semibold text-slate-700 mb-1 mt-2">
        Premios individuales
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        Escribe el <strong>nombre y apellido</strong> del jugador (ej. Kylian Mbappé).
      </p>

      {bloqueado && (
        <div className="mb-3 bg-amber-100 text-amber-800 text-sm rounded-lg px-3 py-2">
          🔒 Las predicciones están cerradas. Ya no se pueden editar.
        </div>
      )}

      <div className="space-y-3">
        {/* Premio del Campeón del Mundial (selector de país con buscador) */}
        <SelectorCampeon
          valor={premios.ganadorMundial || ""}
          onCambio={(cod) => cambiar("ganadorMundial", cod)}
          bloqueado={bloqueado}
        />

        {PREMIOS.map((premio) => (
          <div key={premio.clave} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-slate-700">{premio.titulo}</span>
              <span className="text-xs font-bold text-emerald-600">+{premio.pts} pts</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">{premio.desc}</p>
            <input
              type="text"
              disabled={bloqueado}
              value={premios[premio.clave] || ""}
              onChange={(e) => cambiar(premio.clave, e.target.value)}
              placeholder="Nombre y apellido"
              className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none disabled:bg-slate-100"
            />
          </div>
        ))}
      </div>
    </main>
  );
}

// Selector de país campeón: buscador que filtra + lista alfabética.
function SelectorCampeon({ valor, onCambio, bloqueado }) {
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(false);

  const seleccionado = valor ? EQUIPO_POR_CODIGO[valor] : null;

  const filtrados = busqueda.trim()
    ? EQUIPOS_MUNDIAL.filter((eq) =>
        eq.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()) ||
        eq.abrev.toLowerCase().includes(busqueda.trim().toLowerCase())
      )
    : EQUIPOS_MUNDIAL;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm text-slate-700">🏆 Campeón del Mundial</span>
        <span className="text-xs font-bold text-emerald-600">+10 pts</span>
      </div>
      <p className="text-xs text-slate-400 mb-2">¿Qué selección levanta la copa?</p>

      {/* Selección actual */}
      {seleccionado && !abierto && (
        <button
          onClick={() => !bloqueado && setAbierto(true)}
          disabled={bloqueado}
          className="w-full flex items-center gap-2 border-2 border-blue-300 bg-blue-50 rounded-lg px-3 py-2 disabled:opacity-60"
        >
          <Bandera iso={seleccionado.iso} tam={26} />
          <span className="font-semibold text-sm flex-1 text-left">{seleccionado.nombre}</span>
          {!bloqueado && <span className="text-xs text-blue-700 font-medium">Cambiar</span>}
        </button>
      )}

      {/* Buscador + lista */}
      {(!seleccionado || abierto) && (
        <div>
          <input
            type="text"
            disabled={bloqueado}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Busca un país…"
            className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 mb-2 focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
          />
          <ul className="max-h-52 overflow-y-auto space-y-1">
            {filtrados.map((eq) => (
              <li key={eq.codigo}>
                <button
                  onClick={() => { onCambio(eq.codigo); setAbierto(false); setBusqueda(""); }}
                  disabled={bloqueado}
                  className={
                    "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left disabled:opacity-60 " +
                    (valor === eq.codigo ? "bg-blue-100" : "hover:bg-slate-50")
                  }
                >
                  <Bandera iso={eq.iso} tam={22} />
                  <span className="text-sm flex-1">{eq.nombre}</span>
                  <span className="text-xs text-slate-400">{eq.abrev}</span>
                </button>
              </li>
            ))}
            {filtrados.length === 0 && (
              <li className="text-xs text-slate-400 px-3 py-2">Sin resultados para “{busqueda}”.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}