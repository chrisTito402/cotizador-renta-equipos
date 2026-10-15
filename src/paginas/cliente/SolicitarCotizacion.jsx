// DUEÑO: Cris · RAMA: feature/cotizacion-web
import { useState } from 'react';
import { Link } from 'react-router-dom';
import FormularioCliente, { CLIENTE_VACIO, validarFormularioCliente } from '../../componentes/FormularioCliente.jsx';
import DesgloseCostos from '../../componentes/DesgloseCostos.jsx';
import { calcularCotizacion } from '../../logica/calcularCotizacion.js';
import {
  obtenerCarrito, obtenerEquipo, actualizarCarrito, quitarDelCarrito, vaciarCarrito, guardarCotizacion,
} from '../../servicios/almacen.js';
import { pesos } from '../../utilidades/formato.js';

const separado = { display: 'flex', flexDirection: 'column', gap: 16 };

export default function SolicitarCotizacion() {
  const [carrito, setCarrito] = useState(obtenerCarrito);
  const [cliente, setCliente] = useState(CLIENTE_VACIO);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [guardada, setGuardada] = useState(null);

  if (guardada) {
    return (
      <div className="tarjeta" style={{ ...separado, maxWidth: 560 }} role="status">
        <h1>Recibimos tu solicitud</h1>
        <p>Tu folio es <span className="folio">{guardada.id}</span>.</p>
        <p>Total estimado: <strong>{pesos(guardada.desglose.total)}</strong></p>
        <p className="sutil">El área comercial te contactará para confirmar tu renta.</p>
        <Link className="boton" to="/" style={{ alignSelf: 'flex-start' }}>Volver al catálogo</Link>
      </div>
    );
  }

  if (carrito.lineas.length === 0) {
    return (
      <div className="tarjeta" style={{ ...separado, maxWidth: 560 }}>
        <h1>Mi cotización</h1>
        <p>Todavía no agregas equipos.</p>
        <Link className="boton" to="/" style={{ alignSelf: 'flex-start' }}>Ver el catálogo</Link>
      </div>
    );
  }

  const cambiarCantidad = (equipoId, valor) => {
    const cantidad = Math.max(1, Math.floor(Number(valor)) || 1);
    const lineas = carrito.lineas.map((l) => (l.equipoId === equipoId ? { ...l, cantidad } : l));
    setCarrito(actualizarCarrito({ lineas }));
  };
  const cambiarFecha = (campo, valor) => setCarrito(actualizarCarrito({ [campo]: valor }));
  const quitar = (equipoId) => setCarrito(quitarDelCarrito(equipoId));

  const { lineas, fechaInicio, fechaFin } = carrito;
  let desglose = null;
  let errorCalculo = '';
  if (fechaInicio && fechaFin) {
    try {
      desglose = calcularCotizacion({ lineas, fechaInicio, fechaFin, municipio: cliente.municipio });
    } catch (e) {
      errorCalculo = e.message;
    }
  }

  const enviar = () => {
    setMensaje('');
    const validacion = validarFormularioCliente(cliente);
    setErrores(validacion.errores);
    if (!validacion.valido) return;

    try {
      const nueva = guardarCotizacion({ origen: 'web', cliente, lineas, fechaInicio, fechaFin });
      vaciarCarrito();
      setGuardada(nueva);
    } catch (e) {
      if (e.errores) setErrores(e.errores);
      else setMensaje(e.message);
    }
  };

  return (
    <section style={separado}>
      <div className="encabezado">
        <div>
          <h1>Mi cotización</h1>
          <p className="sutil">Revisa tus equipos, elige las fechas y envía tu solicitud.</p>
        </div>
        <Link className="boton boton-secundario" to="/">+ Agregar más equipos</Link>
      </div>

      <div className="tarjeta tabla-wrap">
        <table>
          <thead>
            <tr><th>Equipo</th><th>Precio por día</th><th>Cantidad</th><th aria-label="Acciones" /></tr>
          </thead>
          <tbody>
            {lineas.map((l) => {
              const equipo = obtenerEquipo(l.equipoId);
              return (
                <tr key={l.equipoId}>
                  <td>{equipo ? equipo.nombre : l.equipoId}</td>
                  <td>{equipo ? pesos(equipo.precioPorDia) : '—'}</td>
                  <td>
                    <input type="number" min="1" step="1" value={l.cantidad} style={{ width: 90 }}
                      aria-label={`Cantidad de ${equipo ? equipo.nombre : l.equipoId}`}
                      onChange={(e) => cambiarCantidad(l.equipoId, e.target.value)} />
                  </td>
                  <td>
                    <button type="button" className="boton boton-secundario" onClick={() => quitar(l.equipoId)}>Quitar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="tarjeta">
        <h2>Fechas de renta</h2>
        <p className="sutil" style={{ marginBottom: 12 }}>
          Estas fechas aplican a todos los equipos de la cotización. Si necesitas equipos en fechas distintas,
          envía una solicitud por cada periodo.
        </p>
        <div className="form-grid">
          <label>Fecha de inicio
            <input type="date" value={fechaInicio} onChange={(e) => cambiarFecha('fechaInicio', e.target.value)} />
          </label>
          <label>Fecha de fin
            <input type="date" min={fechaInicio || undefined} value={fechaFin}
              onChange={(e) => cambiarFecha('fechaFin', e.target.value)} />
          </label>
        </div>
      </div>

      <div className="tarjeta">
        <h2>Tus datos</h2>
        <FormularioCliente valor={cliente} onChange={setCliente} errores={errores} />
      </div>

      <div className="tarjeta">
        <h2>Costo estimado</h2>
        {desglose && <DesgloseCostos desglose={desglose} />}
        {errorCalculo && <p className="error">{errorCalculo}</p>}
        {!desglose && !errorCalculo && <p className="sutil">Elige las fechas para ver el costo.</p>}
      </div>

      {mensaje && <p className="error" role="alert">{mensaje}</p>}
      <button type="button" className="boton" style={{ alignSelf: 'flex-start' }} onClick={enviar}>Enviar solicitud</button>
    </section>
  );
}
