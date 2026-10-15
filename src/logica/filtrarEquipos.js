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
import { ESTADOS } from '../constantes.js';

export function filtrarEquipos(equipos, cotizaciones, { busqueda = '', tipo = '', disponible = '', fechaInicio = '', fechaFin = '' } = {}) {
  const texto = busqueda.trim().toLowerCase();
  const ocupados = new Set();

  if (fechaInicio && fechaFin) {
    cotizaciones.forEach((cotizacion) => {
      if (cotizacion.estado === ESTADOS.APROBADA &&
          cotizacion.fechaInicio <= fechaFin && fechaInicio <= cotizacion.fechaFin) {
        cotizacion.lineas.forEach(({ equipoId }) => ocupados.add(equipoId));
      }
    });
  }

  return equipos.filter((equipo) =>
    (!texto || `${equipo.nombre} ${equipo.modelo}`.toLowerCase().includes(texto)) &&
    (!tipo || equipo.tipo === tipo) &&
    (disponible !== 'true' || equipo.disponible) &&
    !ocupados.has(equipo.id)
  );
}
