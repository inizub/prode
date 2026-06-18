import { useState, useEffect } from "react";
import {
  leerPremiosAdjudicados,
  guardarPremiosAdjudicados,
  leerPremiosDeParticipantes,
} from "./admin";

const PREMIOS = [
  { clave: "botaOro", titulo: "🥇 Bota de Oro", pts: 5 },
  { clave: "balonOro", titulo: "🏅 Balón de Oro", pts: 5 },
  { clave: "asistidor", titulo: "🎯 Máximo asistidor", pts: 3 },
  { clave: "joven", titulo: "🌟 Mejor jugador joven", pts: 3 },
];

export default function AdminPremios() {
  const [premioActivo, setPremioActivo] = useState("botaOro");
  const [participantes, setParticipantes] = useState([]);
  const [adjudicaciones, setAdjudicaciones] = useState({});
  const [cargando, setCargando] = useState(true);
  const [estado, setEstado] = useState("idle");

  useEffect(() => {
    async function cargar() {
      const [parts, adj] = await Promise.all([
        leerPremiosDeParticipantes(),
        leerPremiosAdjudicados(),
      ]);
      setParticipantes(parts);
      setAdjudicaciones(adj);
      setCargando(false);
    }
    cargar();
  }, []);

  // Marca/desmarca a un participante para el premio activo.
  function alternar(idParticipante) {
    setAdjudicaciones((prev) => {
      const lista = prev[premioActivo] || [];
      const nueva = lista.includes(idParticipante)
        ? lista.filter((x) => x !== idParticipante)
        : [...lista, idParticipante];
      return { ...prev, [premioActivo]: nueva };
    });
    setEstado("idle");
  }

  async function guardar() {
    setEstado("guardando");
    const res = await guardarPremiosAdjudicados(adjudicaciones);
    setEstado(res.error ? "error" : "guardado");
  }

  if (cargando)
    return <p className="text-center text-slate-400 mt-6">Cargando…</p>;

  const premio = PREMIOS.find((p) => p.clave === premioActivo);
  const marcados = adjudicaciones[premioActivo] || [];

  return (
    <div>
     <p className="text-xs text-slate-400 mb-3">
        Marca a qué participantes les otorgas los puntos de cada premio.
      </p>
      
      {/* Selector de premio */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PREMIOS.map((p) => (
          <button
            key={p.clave}
            onClick={() => setPremioActivo(p.clave)}
            className={
              "text-xs font-medium rounded-lg px-3 py-2 " +
              (premioActivo === p.clave
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border")
            }
          >
            {p.titulo}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">{premio.titulo}</h3>
          <span className="text-xs font-bold text-emerald-600">+{premio.pts} pts c/u</span>
        </div>

        <ul className="space-y-2">
          {participantes.map((p) => {
            const respuesta = (p.premios && p.premios[premioActivo]) || "";
            const marcado = marcados.includes(p.id);
            return (
              <li
                key={p.id}
                className={
                  "flex items-center justify-between gap-2 rounded-lg px-3 py-2 border " +
                  (marcado ? "bg-emerald-50 border-emerald-300" : "border-slate-100")
                }
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700">{p.nombre}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {respuesta ? `"${respuesta}"` : "— sin respuesta —"}
                  </p>
                </div>
                <button
                  onClick={() => alternar(p.id)}
                  disabled={!respuesta}
                  className={
                    "shrink-0 text-xs font-semibold rounded-lg px-3 py-1.5 disabled:opacity-30 " +
                    (marcado
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600")
                  }
                >
                  {marcado ? "✓ Acertó" : "Dar punto"}
                </button>
              </li>
            );
          })}
        </ul>
        {participantes.length === 0 && (
          <p className="text-sm text-slate-400">No hay participantes.</p>
        )}
      </div>

      <div className="sticky bottom-16 mt-4">
        <button
          onClick={guardar}
          disabled={estado === "guardando"}
          className="w-full bg-emerald-600 text-white font-semibold rounded-lg py-3 disabled:opacity-60"
        >
          {estado === "guardando" ? "Guardando…" : "Guardar adjudicaciones"}
        </button>
        {estado === "guardado" && (
          <p className="text-center text-emerald-600 text-sm mt-1">✅ Guardado</p>
        )}
        {estado === "error" && (
          <p className="text-center text-red-600 text-sm mt-1">⚠️ Error</p>
        )}
      </div>
    </div>
  );
}

// ---------- PREMIO: GANADOR DEL MUNDIAL (automático) ----------
// Compara el campeón elegido por el jugador (datos.premios.ganadorMundial,
// un código de equipo tipo "A1") contra el campeón real, y da +10 si acierta.
// campeonReal: código de equipo ganador de la final, o null si aún no se sabe.
export function puntosCampeon(premiosJugador, campeonReal) {
  const elegido = premiosJugador && premiosJugador.ganadorMundial;
  if (!campeonReal || !elegido) return { total: 0, acerto: false };
  const acerto = elegido === campeonReal;
  return { total: acerto ? 10 : 0, acerto };
}