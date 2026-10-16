// BASE (sin dueño): junta renta + envío. No hace falta editarlo:
// cuando Héctor y Cris reemplacen sus funciones, esto ya da los números reales.
import { calcularRenta } from './calculoRenta.js';
import { calcularEnvio } from './calculoEnvio.js';

export function calcularCotizacion({ lineas, fechaInicio, fechaFin, municipio }) {
  const renta = calcularRenta(lineas, fechaInicio, fechaFin);
  const costoEnvio = municipio ? calcularEnvio(municipio) : 0;
  return {
    dias: renta.dias,
    lineas: renta.lineas,
    subtotalRenta: renta.subtotalRenta,
    costoEnvio,
    total: renta.subtotalRenta + costoEnvio,
  };
}

// Para mostrar en vivo mientras el usuario escribe: no lanza, regresa el mensaje.
// Sin equipos o sin fechas regresa { desglose: null, error: '' }.
export function calcularCotizacionSegura({ lineas, fechaInicio, fechaFin, municipio }) {
  const conEquipo = (lineas || []).filter((l) => l.equipoId);
  if (conEquipo.length === 0 || !fechaInicio || !fechaFin) return { desglose: null, error: '' };
  try {
    return { desglose: calcularCotizacion({ lineas: conEquipo, fechaInicio, fechaFin, municipio }), error: '' };
  } catch (e) {
    return { desglose: null, error: e.message };
  }
}
