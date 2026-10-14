// DUEÑO: Héctor · RAMA: feature/catalogo
import { useParams, Link } from 'react-router-dom';
import Pendiente from '../../componentes/Pendiente.jsx';

export default function DetalleEquipo() {
  const { id } = useParams();
  return (
    <Pendiente titulo={`Detalle del equipo ${id}`} duenio="Héctor" rama="feature/catalogo">
      <p>Fotos, características, precio, disponibilidad, fechas de renta, subtotal estimado y botón “Continuar con la cotización”.</p>
      <p>El botón debe navegar a: <code>/cotizar?equipo={id}&amp;cantidad=1&amp;inicio=AAAA-MM-DD&amp;fin=AAAA-MM-DD</code></p>
      <p><Link to={`/cotizar?equipo=${id}&cantidad=1&inicio=2026-10-20&fin=2026-10-22`}>Simular el botón</Link></p>
    </Pendiente>
  );
}
