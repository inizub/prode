// ============================================================
// CRUCES DEL BRACKET — Art. 12.6 a 12.11 (FIFA)
// Estructura fija del árbol de eliminatorias.
// Los partidos con tercero ("3rd") se rellenan con el Anexo C.
// ============================================================

// Qué columna del Anexo C corresponde a cada partido del Round de 32.
// (verificado: cada ganador de grupo enfrenta a un tercero permitido)
export const COLUMNA_A_PARTIDO = {
  "1A": "M79",
  "1B": "M85",
  "1D": "M81",
  "1E": "M74",
  "1G": "M82",
  "1I": "M77",
  "1K": "M87",
  "1L": "M80",
};

// ROUND DE 32 (M73–M88). "3rd" = casilla que llena el Anexo C.
export const R32 = {
  M73: ["2A", "2B"],
  M74: ["1E", "3rd"],
  M75: ["1F", "2C"],
  M76: ["1C", "2F"],
  M77: ["1I", "3rd"],
  M78: ["2E", "2I"],
  M79: ["1A", "3rd"],
  M80: ["1L", "3rd"],
  M81: ["1D", "3rd"],
  M82: ["1G", "3rd"],
  M83: ["2K", "2L"],
  M84: ["1H", "2J"],
  M85: ["1B", "3rd"],
  M86: ["1J", "2H"],
  M87: ["1K", "3rd"],
  M88: ["2D", "2G"],
};

// ROUND DE 16 (M89–M96): cada uno enfrenta a los ganadores de dos partidos del R32.
export const R16 = {
  M89: ["W74", "W77"],
  M90: ["W73", "W75"],
  M91: ["W76", "W78"],
  M92: ["W79", "W80"],
  M93: ["W83", "W84"],
  M94: ["W81", "W82"],
  M95: ["W86", "W88"],
  M96: ["W85", "W87"],
};

// CUARTOS (M97–M100)
export const CUARTOS = {
  M97: ["W89", "W90"],
  M98: ["W93", "W94"],
  M99: ["W91", "W92"],
  M100: ["W95", "W96"],
};

// SEMIFINALES (M101–M102)
export const SEMIS = {
  M101: ["W97", "W98"],
  M102: ["W99", "W100"],
};

// TERCER LUGAR (M103): los perdedores de las semis.
export const TERCER_LUGAR = {
  M103: ["L101", "L102"],
};

// FINAL (M104): los ganadores de las semis.
export const FINAL = {
  M104: ["W101", "W102"],
};

// Orden de rondas y a qué fase pertenece cada partido (útil para puntaje y UI).
export const RONDAS = [
  { clave: "R32", nombre: "Dieciseisavos", partidos: Object.keys(R32) },
  { clave: "R16", nombre: "Octavos", partidos: Object.keys(R16) },
  { clave: "CUARTOS", nombre: "Cuartos", partidos: Object.keys(CUARTOS) },
  { clave: "SEMIS", nombre: "Semifinales", partidos: Object.keys(SEMIS) },
  { clave: "TERCER_LUGAR", nombre: "Tercer lugar", partidos: Object.keys(TERCER_LUGAR) },
  { clave: "FINAL", nombre: "Final", partidos: Object.keys(FINAL) },
];

// Todos los cruces juntos (para buscar fácil los dos lados de un partido).
export const TODOS_LOS_CRUCES = {
  ...R32, ...R16, ...CUARTOS, ...SEMIS, ...TERCER_LUGAR, ...FINAL,
};