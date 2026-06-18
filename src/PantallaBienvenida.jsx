export default function PantallaBienvenida({ nombre, onEntrar }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* Saludo arriba */}
      <div className="z-10 pt-10 px-6 text-center shrink-0">
      <p className="text-xs uppercase tracking-[0.25em] text-blue-600 font-semibold">
          {nombre ? "Hola de nuevo" : "Bienvenido"}
        </p>
        {nombre && (
          <p className="text-4xl font-black mt-1">{nombre} 👋</p>
        )}
      </div>

      {/* Portada: ocupa el medio, centrada */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-2">
      <img
          src="/BienvenidaAyon.png"
          alt="Prode Mundial"
          className="w-full h-full max-w-sm max-h-[420px] mx-auto object-contain"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      </div>

      {/* Botón abajo */}
      <div className="shrink-0 p-6 pb-10">
      <button
          onClick={onEntrar}
          className="w-full max-w-xs mx-auto block bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 active:scale-[0.98] transition text-white font-extrabold rounded-xl py-4 text-base shadow-lg tracking-wide"
        >
          ENTRAR
        </button>
      </div>
    </div>
  );
}