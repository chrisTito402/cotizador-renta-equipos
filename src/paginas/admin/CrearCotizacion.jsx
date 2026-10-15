// DUEÑA: Katia · RAMA: feature/cotizacion-panel
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormularioCliente, { CLIENTE_VACIO, validarFormularioCliente } from '../../componentes/FormularioCliente.jsx';
import SelectorEquipos from '../../componentes/SelectorEquipos.jsx';
import DesgloseCostos from '../../componentes/DesgloseCostos.jsx';
import { obtenerEquipos, guardarCotizacion } from '../../servicios/almacen.js';
import { calcularCotizacion } from '../../logica/calcularCotizacion.js';

export default function CrearCotizacion() {
  const navigate = useNavigate();
  const [lineas, setLineas] = useState([{ equipoId: '', cantidad: 1 }]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [cliente, setCliente] = useState(CLIENTE_VACIO);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');

  // Desglose en vivo: solo si hay equipo elegido y las dos fechas
  const lineasConEquipo = lineas.filter((l) => l.equipoId);
  let desglose = null;
  let errorCalculo = '';
  if (lineasConEquipo.length > 0 && fechaInicio && fechaFin) {
    try {
      desglose = calcularCotizacion({ lineas: lineasConEquipo, fechaInicio, fechaFin, municipio: cliente.municipio });
    } catch (e) {
      errorCalculo = e.message;
    }
  }

  const guardar = () => {
    setMensaje('');
    const validacion = validarFormularioCliente(cliente);
    setErrores(validacion.errores);
    if (!validacion.valido) return;

    try {
      guardarCotizacion({ origen: 'panel', cliente, lineas, fechaInicio, fechaFin });
      navigate('/admin/cotizaciones');
    } catch (e) {
      if (e.errores) setErrores(e.errores);
      else setMensaje(e.message);
    }
  };

  return (
    <section>
      <div className="encabezado">
        <div>
          <h1>Nueva cotización</h1>
          <p className="sutil">Crea una cotización desde el panel</p>
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
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
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

      {mensaje && <p className="error">{mensaje}</p>}
      <button className="boton" onClick={guardar}>Guardar cotización</button>
    </section>
  );
}