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
//   - Equipo inexistente, cantidad < 1, o fechaFin antes que fechaInicio → lanzar Error con mensaje claro.
//   - Los precios salen de EQUIPOS (import { EQUIPOS } from '../datos/equipos.js').
//
// VERSIÓN FALSA: valores fijos con la forma correcta.

export function calcularRenta(lineas, fechaInicio, fechaFin) {
  return {
    dias: 3,
    lineas: lineas.map((l) => ({
      equipoId: l.equipoId, nombre: 'Equipo de prueba', cantidad: l.cantidad, precioPorDia: 1000, importe: 3000 * l.cantidad,
    })),
    subtotalRenta: 3000 * lineas.reduce((s, l) => s + Number(l.cantidad), 0),
  };
}
