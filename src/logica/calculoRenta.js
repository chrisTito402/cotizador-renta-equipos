// ============================================================
// DUEÑO: Héctor  ·  RAMA: feature/calculo-renta
// Nadie más edita este archivo. Función PURA: no usa document ni localStorage.
// ============================================================
//
// calcularRenta(lineas, fechaInicio, fechaFin)
//
// Recibe:
//   lineas:      [{ equipoId: 'EQ-003', cantidad: 2 }, ...]
//   fechaInicio: '2026-10-14'   (texto AAAA-MM-DD, como lo da un <input type="date">)
//   fechaFin:    '2026-10-16'
//
// Regresa:
//   { dias: 3, lineas: [{ equipoId, nombre, cantidad, precioPorDia, importe }], subtotalRenta: 10800 }
//
// Reglas acordadas:
//   - Se cuentan inicio y fin: del 14 al 16 son 3 días. Mismo día = 1 día.
//   - importe = cantidad × precioPorDia × dias ;  subtotalRenta = suma de importes
//   - Equipo inexistente, cantidad no numérica o < 1, fechas ausentes o invertidas → lanzar Error.
//   - Los precios salen de EQUIPOS (import { EQUIPOS } from '../datos/equipos.js').

import { EQUIPOS } from '../datos/equipos.js';

function fechaUTC(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    throw new Error('Las fechas deben tener el formato AAAA-MM-DD');
  }

  const [anio, mes, dia] = texto.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (anio < 100) fecha.setUTCFullYear(anio);

  if (anio < 1 || fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() + 1 !== mes || fecha.getUTCDate() !== dia) {
    throw new Error(`Fecha inválida: ${texto}`);
  }

  return fecha.getTime();
}

export function calcularRenta(lineas, fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    throw new Error('Indica la fecha de inicio y la fecha de fin');
  }

  const inicioUTC = fechaUTC(fechaInicio);
  const finUTC = fechaUTC(fechaFin);
  if (finUTC < inicioUTC) {
    throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
  }

  const dias = (finUTC - inicioUTC) / 86400000 + 1;
  const detalle = lineas.map(({ equipoId, cantidad: cantidadOriginal }) => {
    const equipo = EQUIPOS.find((e) => e.id === equipoId);
    if (!equipo) throw new Error(`No existe el equipo ${equipoId}`);

    const cantidad = Number(cantidadOriginal);
    if ((typeof cantidadOriginal !== 'number' && typeof cantidadOriginal !== 'string') || !Number.isFinite(cantidad) || cantidad < 1) {
      throw new Error(`La cantidad del equipo ${equipoId} debe ser un número de al menos 1`);
    }

    return {
      equipoId,
      nombre: equipo.nombre,
      cantidad,
      precioPorDia: equipo.precioPorDia,
      importe: cantidad * equipo.precioPorDia * dias,
    };
  });

  return {
    dias,
    lineas: detalle,
    subtotalRenta: detalle.reduce((subtotal, linea) => subtotal + linea.importe, 0),
  };
}
