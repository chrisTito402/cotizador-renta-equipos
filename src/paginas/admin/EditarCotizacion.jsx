// DUEÑO: Cris · RAMA: feature/cotizacion-web
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import FormularioCliente, { CLIENTE_VACIO, validarFormularioCliente } from '../../componentes/FormularioCliente.jsx';
import SelectorEquipos from '../../componentes/SelectorEquipos.jsx';
import DesgloseCostos from '../../componentes/DesgloseCostos.jsx';
import { calcularCotizacion } from '../../logica/calcularCotizacion.js';
import { ESTADOS } from '../../constantes.js';
import { obtenerCotizacion, obtenerEquipo, obtenerEquipos, modificarCotizacion } from '../../servicios/almacen.js';
import { fechaCorta } from '../../utilidades/formato.js';

const separado = { display: 'flex', flexDirection: 'column', gap: 16 };

// Recalcula para mostrar; si algo está mal regresa el mensaje en vez de tronar.
function desgloseSeguro({ lineas, fechaInicio, fechaFin, municipio }) {
  const conEquipo = lineas.filter((l) => l.equipoId);
  if (conEquipo.length === 0 || !fechaInicio || !fechaFin) return { desglose: null, error: '' };
  try {
    return { desglose: calcularCotizacion({ lineas: conEquipo, fechaInicio, fechaFin, municipio }), error: '' };
  } catch (e) {
    return { desglose: null, error: e.message };
  }
}

export default function EditarCotizacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cotizacion] = useState(() => obtenerCotizacion(id));
  const [lineas, setLineas] = useState(cotizacion ? cotizacion.lineas : []);
  const [fechaInicio, setFechaInicio] = useState(cotizacion ? cotizacion.fechaInicio : '');
  const [fechaFin, setFechaFin] = useState(cotizacion ? cotizacion.fechaFin : '');
  const [cliente, setCliente] = useState(cotizacion ? cotizacion.cliente : CLIENTE_VACIO);
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

  const { desglose, error: errorCalculo } = desgloseSeguro({ lineas, fechaInicio, fechaFin, municipio: cliente.municipio });

  if (cotizacion.estado !== ESTADOS.PENDIENTE) {
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
          <p style={{ margin: 0 }}>
            {cotizacion.cliente.nombreCompleto} · {cotizacion.cliente.telefono} · {cotizacion.cliente.correo} · {cotizacion.cliente.municipio}
          </p>
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
          <DesgloseCostos desglose={cotizacion.desglose || desglose} />
        </div>
      </section>
    );
  }

  const guardar = () => {
    setMensaje('');
    const validacion = validarFormularioCliente(cliente);
    setErrores(validacion.errores);
    if (!validacion.valido) return;

    try {
      modificarCotizacion(id, { cliente, lineas, fechaInicio, fechaFin });
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

      <div className="tarjeta">
        <h2>Equipos</h2>
        <SelectorEquipos equipos={obtenerEquipos()} lineas={lineas} onChange={setLineas} />
      </div>

      <div className="tarjeta">
        <h2>Fechas de renta</h2>
        <div className="form-grid">
          <label>Fecha de inicio
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </label>
          <label>Fecha de fin
            <input type="date" min={fechaInicio || undefined} value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="tarjeta">
        <h2>Cliente</h2>
        <FormularioCliente valor={cliente} onChange={setCliente} errores={errores} />
      </div>

      <div className="tarjeta">
        <h2>Costos</h2>
        {desglose && <DesgloseCostos desglose={desglose} />}
        {errorCalculo && <p className="error">{errorCalculo}</p>}
        {!desglose && !errorCalculo && <p className="sutil">Elige al menos un equipo y las fechas para ver el costo.</p>}
      </div>

      {mensaje && <p className="error" role="alert">{mensaje}</p>}
      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" className="boton" onClick={guardar}>Guardar cambios</button>
        <button type="button" className="boton boton-secundario" onClick={() => navigate('/admin/cotizaciones')}>Cancelar</button>
      </div>
    </section>
  );
}
