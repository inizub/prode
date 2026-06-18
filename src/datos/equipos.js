// ============================================================
// EQUIPOS Y GRUPOS DEL MUNDIAL 2026
// Confirmado contra los archivos oficiales del proyecto.
// codigo = posición FIFA (A1, A2...) usada luego para armar el bracket.
// abrev  = código FIFA de 3 letras (coincide con el calendario oficial).
// iso    = código de país para las banderas (flagcdn). Para naciones del
//          Reino Unido usamos los códigos especiales gb-eng / gb-sct.
// ============================================================

export const GRUPOS = {
  A: [
    { codigo: "A1", nombre: "México",            abrev: "MEX", bandera: "🇲🇽", iso: "mx" },
    { codigo: "A2", nombre: "Sudáfrica",         abrev: "RSA", bandera: "🇿🇦", iso: "za" },
    { codigo: "A3", nombre: "Corea del Sur",     abrev: "KOR", bandera: "🇰🇷", iso: "kr" },
    { codigo: "A4", nombre: "Chequia",           abrev: "CZE", bandera: "🇨🇿", iso: "cz" },
  ],
  B: [
    { codigo: "B1", nombre: "Canadá",            abrev: "CAN", bandera: "🇨🇦", iso: "ca" },
    { codigo: "B2", nombre: "Bosnia y Herzeg.",  abrev: "BIH", bandera: "🇧🇦", iso: "ba" },
    { codigo: "B3", nombre: "Catar",             abrev: "QAT", bandera: "🇶🇦", iso: "qa" },
    { codigo: "B4", nombre: "Suiza",             abrev: "SUI", bandera: "🇨🇭", iso: "ch" },
  ],
  C: [
    { codigo: "C1", nombre: "Brasil",            abrev: "BRA", bandera: "🇧🇷", iso: "br" },
    { codigo: "C2", nombre: "Marruecos",         abrev: "MAR", bandera: "🇲🇦", iso: "ma" },
    { codigo: "C3", nombre: "Haití",             abrev: "HAI", bandera: "🇭🇹", iso: "ht" },
    { codigo: "C4", nombre: "Escocia",           abrev: "SCO", bandera: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", iso: "gb-sct" },
  ],
  D: [
    { codigo: "D1", nombre: "Estados Unidos",    abrev: "USA", bandera: "🇺🇸", iso: "us" },
    { codigo: "D2", nombre: "Paraguay",          abrev: "PAR", bandera: "🇵🇾", iso: "py" },
    { codigo: "D3", nombre: "Australia",         abrev: "AUS", bandera: "🇦🇺", iso: "au" },
    { codigo: "D4", nombre: "Turquía",           abrev: "TUR", bandera: "🇹🇷", iso: "tr" },
  ],
  E: [
    { codigo: "E1", nombre: "Alemania",          abrev: "GER", bandera: "🇩🇪", iso: "de" },
    { codigo: "E2", nombre: "Curazao",           abrev: "CUW", bandera: "🇨🇼", iso: "cw" },
    { codigo: "E3", nombre: "Costa de Marfil",   abrev: "CIV", bandera: "🇨🇮", iso: "ci" },
    { codigo: "E4", nombre: "Ecuador",           abrev: "ECU", bandera: "🇪🇨", iso: "ec" },
  ],
  F: [
    { codigo: "F1", nombre: "Países Bajos",      abrev: "NED", bandera: "🇳🇱", iso: "nl" },
    { codigo: "F2", nombre: "Japón",             abrev: "JPN", bandera: "🇯🇵", iso: "jp" },
    { codigo: "F3", nombre: "Suecia",            abrev: "SWE", bandera: "🇸🇪", iso: "se" },
    { codigo: "F4", nombre: "Túnez",             abrev: "TUN", bandera: "🇹🇳", iso: "tn" },
  ],
  G: [
    { codigo: "G1", nombre: "Bélgica",           abrev: "BEL", bandera: "🇧🇪", iso: "be" },
    { codigo: "G2", nombre: "Egipto",            abrev: "EGY", bandera: "🇪🇬", iso: "eg" },
    { codigo: "G3", nombre: "Irán",              abrev: "IRN", bandera: "🇮🇷", iso: "ir" },
    { codigo: "G4", nombre: "Nueva Zelanda",     abrev: "NZL", bandera: "🇳🇿", iso: "nz" },
  ],
  H: [
    { codigo: "H1", nombre: "España",            abrev: "ESP", bandera: "🇪🇸", iso: "es" },
    { codigo: "H2", nombre: "Cabo Verde",        abrev: "CPV", bandera: "🇨🇻", iso: "cv" },
    { codigo: "H3", nombre: "Arabia Saudita",    abrev: "KSA", bandera: "🇸🇦", iso: "sa" },
    { codigo: "H4", nombre: "Uruguay",           abrev: "URU", bandera: "🇺🇾", iso: "uy" },
  ],
  I: [
    { codigo: "I1", nombre: "Francia",           abrev: "FRA", bandera: "🇫🇷", iso: "fr" },
    { codigo: "I2", nombre: "Senegal",           abrev: "SEN", bandera: "🇸🇳", iso: "sn" },
    { codigo: "I3", nombre: "Irak",              abrev: "IRQ", bandera: "🇮🇶", iso: "iq" },
    { codigo: "I4", nombre: "Noruega",           abrev: "NOR", bandera: "🇳🇴", iso: "no" },
  ],
  J: [
    { codigo: "J1", nombre: "Argentina",         abrev: "ARG", bandera: "🇦🇷", iso: "ar" },
    { codigo: "J2", nombre: "Argelia",           abrev: "ALG", bandera: "🇩🇿", iso: "dz" },
    { codigo: "J3", nombre: "Austria",           abrev: "AUT", bandera: "🇦🇹", iso: "at" },
    { codigo: "J4", nombre: "Jordania",          abrev: "JOR", bandera: "🇯🇴", iso: "jo" },
  ],
  K: [
    { codigo: "K1", nombre: "Portugal",          abrev: "POR", bandera: "🇵🇹", iso: "pt" },
    { codigo: "K2", nombre: "RD Congo",          abrev: "COD", bandera: "🇨🇩", iso: "cd" },
    { codigo: "K3", nombre: "Uzbekistán",        abrev: "UZB", bandera: "🇺🇿", iso: "uz" },
    { codigo: "K4", nombre: "Colombia",          abrev: "COL", bandera: "🇨🇴", iso: "co" },
  ],
  L: [
    { codigo: "L1", nombre: "Inglaterra",        abrev: "ENG", bandera: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", iso: "gb-eng" },
    { codigo: "L2", nombre: "Croacia",           abrev: "CRO", bandera: "🇭🇷", iso: "hr" },
    { codigo: "L3", nombre: "Ghana",             abrev: "GHA", bandera: "🇬🇭", iso: "gh" },
    { codigo: "L4", nombre: "Panamá",            abrev: "PAN", bandera: "🇵🇦", iso: "pa" },
  ],
};

export const LETRAS_GRUPOS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

export const EQUIPO_POR_CODIGO = Object.values(GRUPOS)
  .flat()
  .reduce((mapa, eq) => { mapa[eq.codigo] = eq; return mapa; }, {});