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
//     (cada línea trae sus fechas; si no trae, se usan las de la cotización)
//
import { ESTADOS } from '../constantes.js';

export function filtrarEquipos(equipos, cotizaciones, { busqueda = '', tipo = '', disponible = '', fechaInicio = '', fechaFin = '' } = {}) {
  const texto = busqueda.trim().toLowerCase();
  const ocupados = new Set();

  if (fechaInicio && fechaFin) {
    cotizaciones
      .filter((cotizacion) => cotizacion.estado === ESTADOS.APROBADA)
      .forEach((cotizacion) => {
        cotizacion.lineas.forEach((linea) => {
          const inicio = linea.fechaInicio || cotizacion.fechaInicio;
          const fin = linea.fechaFin || cotizacion.fechaFin;
          if (inicio <= fechaFin && fechaInicio <= fin) ocupados.add(linea.equipoId);
        });
      });
  }

  return equipos.filter((equipo) =>
    (!texto || `${equipo.nombre} ${equipo.modelo}`.toLowerCase().includes(texto)) &&
    (!tipo || equipo.tipo === tipo) &&
    (disponible !== 'true' || equipo.disponible) &&
    !ocupados.has(equipo.id)
  );
}
