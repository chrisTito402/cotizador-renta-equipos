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
// Si desglose es null no pinta nada.
import { pesos } from '../utilidades/formato.js';

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
              <th style={derecha}>Cantidad</th>
              <th style={derecha}>Precio por día</th>
              <th style={derecha}>Días</th>
              <th style={derecha}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {desglose.lineas.map((l) => (
              <tr key={l.equipoId}>
                <td>{l.nombre}</td>
                <td style={derecha}>{l.cantidad}</td>
                <td style={derecha}>{pesos(l.precioPorDia)}</td>
                <td style={derecha}>{desglose.dias}</td>
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
      <p className="sutil">Precio estimado. El total final lo confirma el área comercial.</p>
    </div>
  );
}
