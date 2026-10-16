// ============================================================
// DUEÑO: Cris  ·  RAMA: feature/fechas-por-equipo
// Funciones PURAS: qué días tiene apartados un equipo y si una línea se puede cotizar.
// ============================================================
//
// rangosOcupados(equipoId, cotizaciones)  →  [{ inicio, fin }]
//   Rangos de las líneas de ese equipo en cotizaciones "Aprobada".
//   (Mismo criterio que filtrarEquipos: solo una aprobada aparta el equipo.)
//
// validarLinea(linea, { cotizaciones, hoy })  →  '' si está bien, o el mensaje de error
//   Revisa equipo, cantidad (1 a MAX_CANTIDAD), fechas completas y en orden,
//   que no empiece antes de hoy y que no choque con días ocupados.
import { ESTADOS, MAX_CANTIDAD } from '../constantes.js';
import { EQUIPOS } from '../datos/equipos.js';
import { rangoFechas } from '../utilidades/formato.js';

export function rangosOcupados(equipoId, cotizaciones) {
  return cotizaciones
    .filter((c) => c.estado === ESTADOS.APROBADA)
    .flatMap((c) => c.lineas
      .filter((l) => l.equipoId === equipoId)
      .map((l) => ({ inicio: l.fechaInicio || c.fechaInicio, fin: l.fechaFin || c.fechaFin })))
    .filter((r) => r.inicio && r.fin);
}

// Las fechas son texto AAAA-MM-DD: se comparan directo
export const diaOcupado = (dia, rangos) => rangos.some((r) => r.inicio <= dia && dia <= r.fin);
export const rangoChoca = (inicio, fin, rangos) => rangos.some((r) => r.inicio <= fin && inicio <= r.fin);

export function validarLinea(linea, { cotizaciones = [], hoy } = {}) {
  const equipo = EQUIPOS.find((e) => e.id === linea.equipoId);
  if (!equipo) return 'Elige un equipo';
  if (!equipo.disponible) return `${equipo.nombre} no está disponible para renta`;

  const cantidad = Number(linea.cantidad);
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_CANTIDAD) {
    return `${equipo.nombre}: la cantidad debe ser de 1 a ${MAX_CANTIDAD}`;
  }

  const { fechaInicio, fechaFin } = linea;
  if (!fechaInicio || !fechaFin) return `${equipo.nombre}: elige las fechas de renta`;
  if (fechaFin < fechaInicio) return `${equipo.nombre}: la fecha de fin no puede ser antes del inicio`;
  if (hoy && fechaInicio < hoy) return `${equipo.nombre}: la fecha de inicio ya pasó, elige del día de hoy en adelante`;

  const choque = rangosOcupados(equipo.id, cotizaciones).find((r) => r.inicio <= fechaFin && fechaInicio <= r.fin);
  if (choque) return `${equipo.nombre} ya está rentado del ${rangoFechas(choque.inicio, choque.fin)}`;
  return '';
}
