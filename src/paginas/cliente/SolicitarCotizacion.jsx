// DUEÑO: Cris · RAMA: feature/cotizacion-web
import { Link } from 'react-router-dom';
import Pendiente from '../../componentes/Pendiente.jsx';
import { obtenerCarrito } from '../../servicios/almacen.js';

export default function SolicitarCotizacion() {
  const carrito = obtenerCarrito();
  return (
    <Pendiente titulo="Mi cotización" duenio="Cris" rama="feature/cotizacion-web">
      <p>Llega con los equipos que el cliente fue agregando (<code>obtenerCarrito()</code> de servicios/almacen.js):</p>
      <ul>
        {carrito.lineas.map((l) => <li key={l.equipoId}><code>{l.equipoId}</code> × {l.cantidad}</li>)}
        {carrito.lineas.length === 0 && <li>(vacía) · <Link to="/equipos/EQ-003">agrega uno desde un detalle</Link></li>}
      </ul>
      <p>Fechas: del <code>{carrito.fechaInicio || '—'}</code> al <code>{carrito.fechaFin || '—'}</code>.</p>
      <p>Cambiar cantidades, quitar equipos y cambiar fechas con <code>actualizarCarrito</code> / <code>quitarDelCarrito</code>. Costo estimado automático, FormularioCliente, DesgloseCostos, enviar con <code>guardarCotizacion({'{'} origen: 'web', … {'}'})</code>, luego <code>vaciarCarrito()</code> y mostrar confirmación.</p>
    </Pendiente>
  );
}
