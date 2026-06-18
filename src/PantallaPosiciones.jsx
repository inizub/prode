import { useState, useEffect } from "react";
import { obtenerPosiciones, suscribirCambios } from "./posiciones";

export default function PantallaPosiciones() {
  const [tabla, setTabla] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    let activo = true;
    async function recargar() {
      const datos = await obtenerPosiciones();
      if (activo) {
        setTabla(datos);
        setCargando(false);
        setActualizando(false);
      }
    }
    recargar();
    const cancelar = suscribirCambios(() => {
      setActualizando(true);
      recargar();
    });
    return () => {
      activo = false;
      cancelar();
    };
  }, []);

  if (cargando)
    return <p className="text-center text-slate-400 mt-10">Cargando posiciones…</p>;

  const lider = tabla[0];

  return (
    <main className="max-w-md mx-auto pb-24">
      {/* Portada: foto del grupo + título */}
      <div className="relative">
      <img
          src="/bannerAyon.png"
          alt="Nuestro grupo"
          className="w-full h-44 object-contain"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />

      </div>

      <div className="p-4">
        {/* Podio */}
        {tabla.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-5 items-end">
            {[1, 0, 2].map((idx) => {
              const f = tabla[idx];
              if (!f) return <div key={idx} />;
              const esLider = idx === 0;
              const medalla = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
              return (
                <div
                  key={f.id}
                  className={
                    "rounded-xl text-center px-2 pt-3 pb-2 shadow-sm " +
                    (esLider
                      ? "bg-amber-50 border-2 border-amber-300 -mt-2"
                      : "bg-white border border-slate-200")
                  }
                >
                  <div className={esLider ? "text-3xl" : "text-2xl"}>{medalla}</div>
                  <p className="text-xs font-semibold text-slate-700 truncate mt-1">{f.nombre}</p>
                  <p className={"font-extrabold tabular-nums " + (esLider ? "text-amber-600 text-lg" : "text-slate-600")}>
                    {f.puntos}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Lista completa */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
          {tabla.map((fila, i) => {
            const medalla = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <div
                key={fila.id}
                className={"flex items-center gap-3 px-3 py-3 transition-colors " + (i === 0 ? "bg-amber-50/60" : "")}
              >
                <div className="w-7 text-center shrink-0">
                  {medalla ? <span className="text-lg">{medalla}</span> : <span className="text-slate-400 font-semibold text-sm">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 text-sm truncate">{fila.nombre}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    Grupos {fila.puntosGrupos ?? 0}
                    {fila.puntosBonus ? ` (+${fila.puntosBonus} bonus)` : ""} · Elim {fila.puntosElim ?? 0} · Premios {(fila.puntosPremios ?? 0) + (fila.puntosCampeon ?? 0)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-extrabold text-indigo-700 tabular-nums leading-none">{fila.puntos}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{fila.partidosPredichos}/72</p>
                </div>
              </div>
            );
          })}
          {tabla.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">Aún no hay participantes.</p>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Suma de grupos, eliminatorias y premios. Se actualiza en tiempo real.
        </p>
      </div>
    </main>
  );
}