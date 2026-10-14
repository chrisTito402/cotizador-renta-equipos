// DUEÑO: Cris · RAMA: feature/cotizacion-web
import { useParams } from 'react-router-dom';
import Pendiente from '../../componentes/Pendiente.jsx';

export default function EditarCotizacion() {
  const { id } = useParams();
  return (
    <Pendiente titulo={`Modificar cotización ${id}`} duenio="Cris" rama="feature/cotizacion-web">
      <p>Cargar con <code>obtenerCotizacion(id)</code> de servicios/almacen.js, editar equipos, cantidades, fechas y cliente, recalcular y guardar con <code>modificarCotizacion(id, cambios)</code>. Solo si está “Pendiente”.</p>
    </Pendiente>
  );
}
