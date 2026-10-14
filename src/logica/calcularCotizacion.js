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
