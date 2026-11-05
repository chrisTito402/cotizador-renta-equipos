// BASE (sin dueño): junta renta + envío.
// Cada línea trae sus fechas; fechaInicio/fechaFin generales son opcionales
// (solo rellenan líneas viejas que no traen fechas).
//
// Regresa: { lineas, subtotalRenta, costoEnvio, total }   con total = subtotalRenta + costoEnvio
// Al cliente se le muestra el total (ya con envío) pero no la fila ni el monto del envío;
// el panel admin sí ve el envío.
import { calcularRenta } from './calculoRenta.js';
import { calcularEnvio } from './calculoEnvio.js';

export function calcularCotizacion({ lineas, fechaInicio, fechaFin, municipio }) {
  const renta = calcularRenta(lineas, fechaInicio, fechaFin);
  const costoEnvio = municipio ? calcularEnvio(municipio) : 0;
  return {
    lineas: renta.lineas,
    subtotalRenta: renta.subtotalRenta,
    costoEnvio,
    total: renta.subtotalRenta + costoEnvio,
  };
}

// Para mostrar en vivo mientras el usuario escribe: no lanza, regresa el mensaje.
// Solo cuenta las líneas completas (con equipo y fechas); sin ninguna regresa { desglose: null, error: '' }.
export function calcularCotizacionSegura({ lineas, fechaInicio, fechaFin, municipio }) {
  const completas = (lineas || []).filter((l) =>
    l.equipoId && (l.fechaInicio || fechaInicio) && (l.fechaFin || fechaFin));
  if (completas.length === 0) return { desglose: null, error: '' };
  try {
    return { desglose: calcularCotizacion({ lineas: completas, fechaInicio, fechaFin, municipio }), error: '' };
  } catch (e) {
    return { desglose: null, error: e.message };
  }
}
