// DUEÑA: Katia · RAMA: feature/cotizacion-panel
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormularioCliente, { CLIENTE_VACIO, validarFormularioCliente } from '../../componentes/FormularioCliente.jsx';
import SelectorEquipos from '../../componentes/SelectorEquipos.jsx';
import DesgloseCostos from '../../componentes/DesgloseCostos.jsx';
import { obtenerEquipos, guardarCotizacion } from '../../servicios/almacen.js';
import { calcularCotizacion } from '../../logica/calcularCotizacion.js';
import './crearCotizacion.css';

// Fecha de hoy en hora local como 'AAAA-MM-DD' (toISOString usa UTC y en la tarde ya da mañana)
function hoyLocal() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Equipos y fechas. Las fechas 'AAAA-MM-DD' se pueden comparar como texto.
function validarRenta(lineas, fechaInicio, fechaFin) {
  const errores = {};
  if (lineas.some((l) => !l.equipoId)) {
    errores.equipos = 'Elige un equipo en cada fila o quita la fila vacía';
  }
  if (!fechaInicio) {
    errores.fechaInicio = 'Elige la fecha de inicio';
  } else if (fechaInicio < hoyLocal()) {
    errores.fechaInicio = 'La fecha de inicio no puede ser antes de hoy';
  }
  if (!fechaFin) {
    errores.fechaFin = 'Elige la fecha de fin';
  } else if (fechaInicio && fechaFin < fechaInicio) {
    errores.fechaFin = 'La fecha de fin no puede ser antes del inicio';
  }
  return errores;
}

export default function CrearCotizacion() {
  const navigate = useNavigate();
  const [lineas, setLineas] = useState([{ equipoId: '', cantidad: 1 }]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [cliente, setCliente] = useState(CLIENTE_VACIO);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');

  const hoy = hoyLocal();
  const fechasAlReves = fechaInicio && fechaFin && fechaFin < fechaInicio;

  // Desglose en vivo: solo si hay equipo elegido y las dos fechas en orden
  const lineasConEquipo = lineas.filter((l) => l.equipoId);
  let desglose = null;
  let errorCalculo = '';
  if (lineasConEquipo.length > 0 && fechaInicio && fechaFin && !fechasAlReves) {
    try {
      desglose = calcularCotizacion({ lineas: lineasConEquipo, fechaInicio, fechaFin, municipio: cliente.municipio });
    } catch (e) {
      errorCalculo = e.message;
    }
  }

  const guardar = () => {
    setMensaje('');
    const validacion = validarFormularioCliente(cliente);
    const todos = { ...validacion.errores, ...validarRenta(lineas, fechaInicio, fechaFin) };
    setErrores(todos);
    if (Object.keys(todos).length > 0) {
      setMensaje('Revisa los campos marcados en rojo');
      return;
    }

    try {
      guardarCotizacion({ origen: 'panel', cliente, lineas, fechaInicio, fechaFin });
      navigate('/admin/cotizaciones');
    } catch (e) {
      if (e.errores) setErrores(e.errores);
      setMensaje(e.message);
    }
  };

  return (
    <section className="nueva-cotizacion">
      <Link to="/admin/cotizaciones" className="volver">← Volver a cotizaciones</Link>
      <div className="encabezado">
        <div>
          <h1>Nueva cotización</h1>
          <p className="sutil">Crea una cotización desde el panel. Queda como Pendiente hasta que se apruebe.</p>
        </div>
      </div>

      <div className="columnas">
        <div className="columna-principal">
          <div className="tarjeta">
            <h2 className="etiqueta">Equipos</h2>
            <SelectorEquipos equipos={obtenerEquipos()} lineas={lineas} onChange={setLineas} />
            {errores.equipos && <p className="msg-error">{errores.equipos}</p>}
          </div>

          <div className="tarjeta">
            <h2 className="etiqueta">Fechas de renta</h2>
            <div className="fechas">
              <label>Fecha de inicio
                <input
                  type="date"
                  min={hoy}
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className={errores.fechaInicio ? 'invalido' : ''}
                />
                {errores.fechaInicio && <span className="msg-error">{errores.fechaInicio}</span>}
              </label>
              <label>Fecha de fin
                <input
                  type="date"
                  min={fechaInicio || hoy}
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className={errores.fechaFin ? 'invalido' : ''}
                />
                {errores.fechaFin && <span className="msg-error">{errores.fechaFin}</span>}
              </label>
            </div>
          </div>

          <div className="tarjeta">
            <h2 className="etiqueta">Cliente</h2>
            <FormularioCliente valor={cliente} onChange={setCliente} errores={errores} />
          </div>
        </div>

        <aside className="columna-resumen">
          <div className="tarjeta">
            <h2 className="etiqueta">Desglose de costos</h2>
            {desglose && <DesgloseCostos desglose={desglose} />}
            {errorCalculo && <p className="msg-error">{errorCalculo}</p>}
            {fechasAlReves && <p className="msg-error">La fecha de fin no puede ser antes del inicio</p>}
            {!desglose && !errorCalculo && !fechasAlReves && (
              <p className="sutil">Elige al menos un equipo y las fechas para ver el costo.</p>
            )}
          </div>
          {mensaje && <p className="msg-error mensaje-general">{mensaje}</p>}
          <button className="boton boton-guardar" onClick={guardar}>Guardar cotización</button>
        </aside>
      </div>
    </section>
  );
}
