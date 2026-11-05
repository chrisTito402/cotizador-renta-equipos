// DUEÑA: Katia · RAMA: feature/cotizacion-panel
// (fechas por equipo y notas: rama feature/fechas-por-equipo, con aviso en el grupo)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormularioCliente, { CLIENTE_VACIO, validarFormularioCliente } from '../../componentes/FormularioCliente.jsx';
import SelectorEquipos, { lineaVacia } from '../../componentes/SelectorEquipos.jsx';
import DesgloseCostos from '../../componentes/DesgloseCostos.jsx';
import { CampoNotas } from '../../componentes/CamposCotizacion.jsx';
import { obtenerEquipos, guardarCotizacion } from '../../servicios/almacen.js';
import { calcularCotizacionSegura } from '../../logica/calcularCotizacion.js';
import './crearCotizacion.css';

// Cada línea necesita equipo y fechas. Las fechas pasadas, la cantidad y los días ocupados
// los revisa el calendario y otra vez guardarCotizacion (almacen.js).
function validarRenta(lineas) {
  const errores = {};
  if (lineas.length === 0) {
    errores.equipos = 'Agrega al menos un equipo';
  } else if (lineas.some((l) => !l.equipoId)) {
    errores.equipos = 'Elige un equipo en cada línea o quita la línea vacía';
  } else if (lineas.some((l) => !l.fechaInicio || !l.fechaFin)) {
    errores.equipos = 'Elige las fechas de cada equipo (toca “Cambiar”)';
  }
  return errores;
}

export default function CrearCotizacion() {
  const navigate = useNavigate();
  const [lineas, setLineas] = useState(() => [lineaVacia()]);
  const [cliente, setCliente] = useState(CLIENTE_VACIO);
  const [notas, setNotas] = useState('');
  const [errores, setErrores] = useState({});
  const [errorLinea, setErrorLinea] = useState(null);
  const [mensaje, setMensaje] = useState('');

  // Desglose en vivo con las líneas que ya tienen equipo y fechas
  const { desglose, error: errorCalculo } = calcularCotizacionSegura({ lineas, municipio: cliente.municipio });

  const guardar = () => {
    setMensaje('');
    setErrorLinea(null);
    const validacion = validarFormularioCliente(cliente);
    const todos = { ...validacion.errores, ...validarRenta(lineas) };
    setErrores(todos);
    if (Object.keys(todos).length > 0) {
      setMensaje('Revisa los campos marcados en rojo');
      return;
    }

    try {
      guardarCotizacion({ origen: 'panel', cliente, lineas, notas });
      navigate('/admin/cotizaciones');
    } catch (e) {
      if (e.errores) setErrores(e.errores);
      if (e.lineaId) setErrorLinea({ id: e.lineaId, mensaje: e.message });
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
            <h2 className="etiqueta">Equipos y fechas</h2>
            <SelectorEquipos equipos={obtenerEquipos()} lineas={lineas} onChange={setLineas} errorLinea={errorLinea} />
            {errores.equipos && <p className="msg-error">{errores.equipos}</p>}
          </div>

          <div className="tarjeta">
            <h2 className="etiqueta">Cliente</h2>
            <FormularioCliente valor={cliente} onChange={setCliente} errores={errores} />
          </div>

          <div className="tarjeta">
            <CampoNotas valor={notas} onChange={setNotas} />
          </div>
        </div>

        <aside className="columna-resumen">
          <div className="tarjeta">
            <h2 className="etiqueta">Desglose de costos</h2>
            {desglose && <DesgloseCostos desglose={desglose} />}
            {errorCalculo && <p className="msg-error">{errorCalculo}</p>}
            {!desglose && !errorCalculo && (
              <p className="sutil">Elige al menos un equipo con sus fechas para ver el costo.</p>
            )}
          </div>
          {mensaje && <p className="msg-error mensaje-general">{mensaje}</p>}
          <button className="boton boton-guardar" onClick={guardar}>Guardar cotización</button>
        </aside>
      </div>
    </section>
  );
}
