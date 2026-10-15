// DUEÑA: Katia · RAMA: feature/cotizacion-panel
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CLIENTE_VACIO, validarFormularioCliente } from '../../componentes/FormularioCliente.jsx';
import CamposCotizacion from '../../componentes/CamposCotizacion.jsx';
import { guardarCotizacion } from '../../servicios/almacen.js';

export default function CrearCotizacion() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState({ lineas: [{ equipoId: '', cantidad: 1 }], fechaInicio: '', fechaFin: '', cliente: CLIENTE_VACIO });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');

  const guardar = () => {
    setMensaje('');
    const validacion = validarFormularioCliente(datos.cliente);
    setErrores(validacion.errores);
    if (!validacion.valido) return;

    try {
      guardarCotizacion({ origen: 'panel', ...datos });
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

      <CamposCotizacion valor={datos} onChange={(cambios) => setDatos((d) => ({ ...d, ...cambios }))} errores={errores} />

      {mensaje && <p className="error">{mensaje}</p>}
      <button className="boton" onClick={guardar}>Guardar cotización</button>
    </section>
  );
}
