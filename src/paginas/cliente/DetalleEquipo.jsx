// DUEÑO: Héctor · RAMA: feature/catalogo
import { useParams, useNavigate } from 'react-router-dom';
import Pendiente from '../../componentes/Pendiente.jsx';
import { agregarAlCarrito } from '../../servicios/almacen.js';

export default function DetalleEquipo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const simularAgregar = () => {
    agregarAlCarrito({ equipoId: id, cantidad: 1, fechaInicio: '2026-10-20', fechaFin: '2026-10-22' });
    navigate('/cotizar');
  };

  return (
    <Pendiente titulo={`Detalle del equipo ${id}`} duenio="Héctor" rama="feature/catalogo">
      <p>Fotos, características, precio, disponibilidad, cantidad, fechas de renta, subtotal estimado y botón “Agregar a mi cotización”.</p>
      <p>El botón llama a <code>agregarAlCarrito({'{'} equipoId, cantidad, fechaInicio, fechaFin {'}'})</code> de servicios/almacen.js y luego deja elegir entre “Ver mi cotización” (<code>/cotizar</code>) o “Seguir viendo equipos” (<code>/</code>).</p>
      <p><button className="boton" onClick={simularAgregar}>Simular: agregar {id} y ver mi cotización</button></p>
    </Pendiente>
  );
}
