// Componente de bandera reutilizable (imagen real desde flagcdn).
// iso: código de país ("mx", "gb-eng", etc.). tam: ancho en px (alto proporcional).
export default function Bandera({ iso, tam = 32, className = "" }) {
  if (!iso) {
    // Sin código: marcador gris neutro (para slots sin equipo).
    return (
      <span
        className={"inline-block bg-slate-200 rounded-sm " + className}
        style={{ width: tam, height: Math.round(tam * 0.67) }}
      />
    );
  }
  return (
    <img
      src={`https://flagcdn.com/w80/${iso}.png`}
      srcSet={`https://flagcdn.com/w160/${iso}.png 2x`}
      width={tam}
      height={Math.round(tam * 0.67)}
      alt=""
      loading="lazy"
      className={"inline-block rounded-sm object-cover shadow-sm " + className}
      style={{ width: tam, height: Math.round(tam * 0.67) }}
    />
  );
}