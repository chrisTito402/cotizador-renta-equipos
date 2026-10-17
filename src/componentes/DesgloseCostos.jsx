// ============================================================
// DUEÑO: Cris  ·  RAMA: feature/calculo-envio
// Nadie más edita este archivo. Los demás solo lo importan.
// ============================================================
//
// SOLO PANEL ADMIN: muestra renta, envío y total. Al cliente se le muestra el total (con envío)
// pero sin la fila ni el monto del envío.
//
// Uso:
//   const desglose = calcularCotizacion({ lineas, municipio });  // logica/calcularCotizacion.js
//   <DesgloseCostos desglose={desglose} />
//
// desglose = { lineas: [{ id, nombre, cantidad, precioPorDia, fechaInicio, fechaFin, dias, importe }],
//              subtotalRenta, costoEnvio, total }
// Si desglose es null no pinta nada.
import { pesos, rangoFechas, textoDias } from '../utilidades/formato.js';

const derecha = { textAlign: 'right', whiteSpace: 'nowrap' };

export default function DesgloseCostos({ desglose }) {
  if (!desglose) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="tabla-wrap">
        <table>
          <thead>
            <tr>
              <th>Equipo</th>
              <th style={derecha}>Cant.</th>
              <th style={derecha}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {desglose.lineas.map((l) => (
              <tr key={l.id || `${l.equipoId}-${l.fechaInicio}-${l.fechaFin}`}>
                <td>
                  {l.nombre}
                  <br /><small className="sutil">
                    {rangoFechas(l.fechaInicio, l.fechaFin)} · {textoDias(l.dias)} · {pesos(l.precioPorDia)}/día
                  </small>
                </td>
                <td style={derecha}>{l.cantidad}</td>
                <td style={derecha}>{pesos(l.importe)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="desglose">
        <div><span>Subtotal renta</span><span>{pesos(desglose.subtotalRenta)}</span></div>
        <div><span>Envío</span><span>{pesos(desglose.costoEnvio)}</span></div>
        <div className="total"><span>Total estimado</span><span>{pesos(desglose.total)}</span></div>
      </div>
      <p className="sutil">El cliente ve este total, pero no la fila del envío.</p>
    </div>
  );
}
