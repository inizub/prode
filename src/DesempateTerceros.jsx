import { EQUIPO_POR_CODIGO } from "./datos/equipos";
import Bandera from "./Bandera";

// Orden actual de un bloque de empate: respeta lo ya elegido en
// desempateTerceros y completa el resto alfabéticamente.
function ordenBloque(equipos, desempateTerceros) {
  const enOrden = desempateTerceros.filter((g) => equipos.includes(g));
  const resto = equipos.filter((g) => !enOrden.includes(g)).sort();
  return [...enOrden, ...resto];
}

// Panel reutilizable (usuario y admin) para resolver empates de terceros que
// cruzan el corte 8º/9º. "empates" viene de empatesTerceros(...).
// tercerosPorGrupo = base.tercerosPorGrupo (para mostrar bandera del equipo).
export default function DesempateTerceros({
  empates,
  desempateTerceros = [],
  tercerosPorGrupo = {},
  onCambio,
  bloqueado = false,
}) {
  if (!empates || empates.length === 0) return null;

  function escribir(ordenes) {
    onCambio(ordenes.flat());
  }

  function mover(bi, idx, dir) {
    if (bloqueado) return;
    const ordenes = empates.map((e) => ordenBloque(e.equipos, desempateTerceros));
    const arr = [...ordenes[bi]];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    ordenes[bi] = arr;
    escribir(ordenes);
  }

  function confirmar() {
    if (bloqueado) return;
    escribir(empates.map((e) => ordenBloque(e.equipos, desempateTerceros)));
  }

  return (
    <div
      id="desempate-terceros"
      className="mt-6 bg-white border-2 border-amber-300 rounded-xl p-4 scroll-mt-24"
    >
      <p className="text-sm font-bold text-amber-800 mb-1">
        ⚖️ Desempate de terceros lugares
      </p>
      <p className="text-xs text-slate-500 mb-4">
        Estos terceros quedaron empatados en todos los criterios deportivos y se
        disputan las últimas plazas. En el Mundial real esto se decide por fair
        play (tarjetas) o sorteo, así que <strong>tú decides el orden</strong>:
        los de arriba son los que clasifican.
      </p>

      {empates.map((emp, bi) => {
        const orden = ordenBloque(emp.equipos, desempateTerceros);
        return (
          <div key={bi} className="mb-4 last:mb-0">
            <p className="text-xs font-medium text-slate-600 mb-2">
              Clasifican <strong>{emp.cupos}</strong> de {emp.equipos.length}{" "}
              (empate a {emp.pts} pts, dif.{" "}
              {emp.dg >= 0 ? "+" + emp.dg : emp.dg}, {emp.gf} GF)
            </p>
            <ul className="space-y-2">
              {orden.map((g, idx) => {
                const clasifica = idx < emp.cupos;
                const eq = EQUIPO_POR_CODIGO[tercerosPorGrupo["3" + g]];
                return (
                  <li
                    key={g}
                    className={
                      "flex items-center gap-2 rounded-lg px-2 py-2 border " +
                      (clasifica
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-slate-50 border-slate-200")
                    }
                  >
                    <span className="text-xs font-bold w-5 text-center text-slate-400">
                      {idx + 1}
                    </span>
                    {eq ? <Bandera iso={eq.iso} tam={22} /> : <span className="w-[22px]" />}
                    <span className="text-sm font-medium flex-1">
                      {eq ? eq.abrev : "3" + g}{" "}
                      <span className="text-xs text-slate-400">(grupo {g})</span>
                    </span>
                    <span
                      className={
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full " +
                        (clasifica
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-300 text-slate-600")
                      }
                    >
                      {clasifica ? "Clasifica" : "Fuera"}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => mover(bi, idx, -1)}
                        disabled={bloqueado || idx === 0}
                        className="text-xs w-6 h-5 leading-none rounded bg-slate-200 text-slate-600 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => mover(bi, idx, +1)}
                        disabled={bloqueado || idx === orden.length - 1}
                        className="text-xs w-6 h-5 leading-none rounded bg-slate-200 text-slate-600 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {emp.resuelto ? (
              <p className="mt-2 text-xs text-emerald-600 font-medium text-center">
                ✅ Orden definido
              </p>
            ) : (
              <button
                onClick={confirmar}
                disabled={bloqueado}
                className="mt-2 w-full bg-amber-500 text-white text-sm font-semibold rounded-lg py-2 disabled:opacity-60"
              >
                Confirmar este orden
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}