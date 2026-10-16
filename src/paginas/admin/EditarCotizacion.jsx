// DUEÑO: Cris · RAMA: feature/cotizacion-web
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { validarFormularioCliente } from '../../componentes/FormularioCliente.jsx';
import CamposCotizacion from '../../componentes/CamposCotizacion.jsx';
import DesgloseCostos from '../../componentes/DesgloseCostos.jsx';
import { calcularCotizacionSegura } from '../../logica/calcularCotizacion.js';
import { ESTADOS } from '../../constantes.js';
import { obtenerCotizacion, obtenerEquipo, modificarCotizacion } from '../../servicios/almacen.js';
import { fechaCorta } from '../../utilidades/formato.js';

const separado = { display: 'flex', flexDirection: 'column', gap: 16 };

function SoloLectura({ cotizacion }) {
  const { cliente } = cotizacion;
  const desglose = cotizacion.desglose
    || calcularCotizacionSegura({ ...cotizacion, municipio: cliente.municipio }).desglose;
  return (
    <section style={separado}>
      <div className="encabezado">
        <div>
          <h1>Cotización <span className="folio">{cotizacion.id}</span></h1>
          <p className="sutil">Solo lectura</p>
        </div>
        <Link className="boton boton-secundario" to="/admin/cotizaciones">Volver a la lista</Link>
      </div>
      <p className="tarjeta" role="alert" style={{ background: 'var(--ambar-suave)', color: 'var(--ambar)', margin: 0 }}>
        Esta cotización ya está {cotizacion.estado} y no se puede modificar.
      </p>
      <div className="tarjeta" style={separado}>
        <h2>Cliente</h2>
        <p style={{ margin: 0 }}>{cliente.nombreCompleto} · {cliente.telefono} · {cliente.correo} · {cliente.municipio}</p>
        <h2>Equipos</h2>
        <ul style={{ margin: 0 }}>
          {cotizacion.lineas.map((l) => (
            <li key={l.equipoId}>{obtenerEquipo(l.equipoId)?.nombre || l.equipoId} × {l.cantidad}</li>
          ))}
        </ul>
        <h2>Fechas</h2>
        <p style={{ margin: 0 }}>Del {fechaCorta(cotizacion.fechaInicio)} al {fechaCorta(cotizacion.fechaFin)}</p>
      </div>
      <div className="tarjeta">
        <h2>Costos</h2>
        <DesgloseCostos desglose={desglose} />
      </div>
    </section>
  );
}

export default function EditarCotizacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cotizacion] = useState(() => obtenerCotizacion(id));
  const [datos, setDatos] = useState(() => (cotizacion
    ? { lineas: cotizacion.lineas, fechaInicio: cotizacion.fechaInicio, fechaFin: cotizacion.fechaFin, cliente: cotizacion.cliente }
    : null));
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');

  if (!cotizacion) {
    return (
      <section style={separado}>
        <h1>Cotización no encontrada</h1>
        <p className="sutil">No existe una cotización con el folio {id}.</p>
        <Link className="boton boton-secundario" to="/admin/cotizaciones" style={{ alignSelf: 'flex-start' }}>Volver a la lista</Link>
      </section>
    );
  }
  if (cotizacion.estado !== ESTADOS.PENDIENTE) return <SoloLectura cotizacion={cotizacion} />;

  const guardar = () => {
    setMensaje('');
    const validacion = validarFormularioCliente(datos.cliente);
    setErrores(validacion.errores);
    if (!validacion.valido) return;

    try {
      modificarCotizacion(id, datos);
      navigate('/admin/cotizaciones');
    } catch (e) {
      if (e.errores) setErrores(e.errores);
      else setMensaje(e.message);
    }
  };

  return (
    <section style={separado}>
      <div className="encabezado">
        <div>
          <h1>Modificar cotización <span className="folio">{cotizacion.id}</span></h1>
          <p className="sutil">Cambia equipos, fechas o datos del cliente. El costo se recalcula al guardar.</p>
        </div>
      </div>

      <CamposCotizacion valor={datos} onChange={(cambios) => setDatos((d) => ({ ...d, ...cambios }))} errores={errores} />

      {mensaje && <p className="error" role="alert">{mensaje}</p>}
      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" className="boton" onClick={guardar}>Guardar cambios</button>
        <button type="button" className="boton boton-secundario" onClick={() => navigate('/admin/cotizaciones')}>Cancelar</button>
      </div>
    </section>
  );
}
