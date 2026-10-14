// BASE: lista de cotizaciones para navegar a editar. No tiene dueño.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerCotizaciones, reiniciarDatos } from '../../servicios/almacen.js';
import { fechaCorta, pesos } from '../../utilidades/formato.js';

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState(() => obtenerCotizaciones());

  const reiniciar = () => {
    reiniciarDatos();
    setCotizaciones(obtenerCotizaciones());
  };

  return (
    <section>
      <div className="encabezado">
        <div>
          <h1>Cotizaciones</h1>
          <p className="sutil">Solicitadas desde la web o creadas en el panel</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="boton boton-secundario" onClick={reiniciar}>Reiniciar datos de prueba</button>
          <Link className="boton" to="/admin/cotizaciones/nueva">Nueva cotización</Link>
        </div>
      </div>
      <div className="tarjeta tabla-wrap">
        <table>
          <thead><tr><th>Folio</th><th>Cliente</th><th>Origen</th><th>Fechas</th><th>Total</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {cotizaciones.map((c) => (
              <tr key={c.id}>
                <td className="folio">{c.id}</td>
                <td>{c.cliente?.nombreCompleto}</td>
                <td>{c.origen}</td>
                <td>{fechaCorta(c.fechaInicio)} – {fechaCorta(c.fechaFin)}</td>
                <td>{c.desglose ? pesos(c.desglose.total) : '—'}</td>
                <td><span className={`estado estado-${c.estado?.toLowerCase()}`}>{c.estado}</span></td>
                <td><Link to={`/admin/cotizaciones/${c.id}/editar`}>Editar</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
