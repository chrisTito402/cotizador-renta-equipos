// ============================================================
// DUEÑO: Cris  ·  RAMA: feature/calculo-envio
// Nadie más edita este archivo. Los demás solo lo importan.
// ============================================================
//
// Uso:
//   const desglose = calcularCotizacion({ lineas, fechaInicio, fechaFin, municipio });  // logica/calcularCotizacion.js
//   <DesgloseCostos desglose={desglose} />
//
// desglose = { dias, lineas: [{ nombre, cantidad, precioPorDia, importe }], subtotalRenta, costoEnvio, total }
//
// VERSIÓN FALSA: muestra solo los tres totales.
import { pesos } from '../utilidades/formato.js';

export default function DesgloseCostos({ desglose }) {
  if (!desglose) return null;
  return (
    <div className="desglose">
      <div><span>Subtotal renta</span><span>{pesos(desglose.subtotalRenta)}</span></div>
      <div><span>Envío</span><span>{pesos(desglose.costoEnvio)}</span></div>
      <div className="total"><span>Total estimado</span><span>{pesos(desglose.total)}</span></div>
    </div>
  );
}
