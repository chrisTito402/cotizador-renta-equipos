// ============================================================
// DUEÑO: Cris  ·  RAMA: feature/calculo-envio
// Nadie más edita este archivo. Función PURA: no usa document ni localStorage.
// ============================================================
//
// calcularEnvio(municipio)  →  número en pesos
// Regla: por RADIO desde el patio (Cd. Obregón): distancia del municipio → zona → costo.
// Fuera de zona o municipio desconocido: lanza Error con mensaje claro.

// Kilómetros aproximados desde el patio.
const DISTANCIAS_KM = {
  'Cajeme': 0,
  'Bácum': 25,
  'San Ignacio Río Muerto': 50,
  'Navojoa': 67,
  'Etchojoa': 85,
  'Huatabampo': 100,
  'Empalme': 115,
  'Guaymas': 125,
  'Hermosillo': 250,
};

// Ordenadas de menor a mayor: gana la primera cuyo radio alcance.
const ZONAS = [
  { zona: 1, hastaKm: 30, costo: 500 },
  { zona: 2, hastaKm: 80, costo: 1200 },
  { zona: 3, hastaKm: 150, costo: 2000 },
];

export function calcularEnvio(municipio) {
  const km = DISTANCIAS_KM[municipio];
  if (km === undefined) throw new Error(`No hacemos envíos a "${municipio}": municipio desconocido`);

  const zona = ZONAS.find((z) => km <= z.hastaKm);
  if (!zona) {
    const maximo = ZONAS[ZONAS.length - 1].hastaKm;
    throw new Error(`${municipio} está fuera de zona de envío (${km} km; máximo ${maximo} km desde el patio)`);
  }
  return zona.costo;
}
