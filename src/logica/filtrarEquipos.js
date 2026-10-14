// ============================================================
// DUEÑO: Héctor  ·  RAMA: feature/catalogo
// Función PURA.
// ============================================================
//
// filtrarEquipos(equipos, cotizaciones, { busqueda, tipo, disponible, fechaInicio, fechaFin })
//   - busqueda: contiene en nombre o modelo (sin importar mayúsculas)
//   - tipo: igual a e.tipo
//   - disponible === 'true': solo e.disponible
//   - fechaInicio y fechaFin: quitar equipos que estén en una cotización "Aprobada" cuyas fechas se empalmen
//
// VERSIÓN FALSA: regresa todos.

export function filtrarEquipos(equipos, cotizaciones, filtros) {
  return equipos;
}
