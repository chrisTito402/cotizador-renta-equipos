// DUEÑA: Katia · RAMA: feature/cotizacion-panel
import Pendiente from '../../componentes/Pendiente.jsx';

export default function CrearCotizacion() {
  return (
    <Pendiente titulo="Nueva cotización" duenio="Katia" rama="feature/cotizacion-panel">
      <p>Seleccionar uno o varios equipos con cantidad, fechas de renta, FormularioCliente, DesgloseCostos y guardar con <code>guardarCotizacion({'{'} origen: 'panel', … {'}'})</code>.</p>
    </Pendiente>
  );
}
