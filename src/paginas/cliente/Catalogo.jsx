// DUEÑO: Héctor · RAMA: feature/catalogo
import { Link } from 'react-router-dom';
import Pendiente from '../../componentes/Pendiente.jsx';

export default function Catalogo() {
  return (
    <Pendiente titulo="Catálogo de equipos" duenio="Héctor" rama="feature/catalogo">
      <p>Búsqueda por nombre o modelo, filtros por tipo, disponibilidad y fechas, y tarjetas de equipo que llevan a <code>/equipos/:id</code>.</p>
      <p>Enlaces temporales para que los demás prueben mientras tanto:</p>
      <p><Link to="/equipos/EQ-003">Detalle de EQ-003</Link> · <Link to="/cotizar?equipo=EQ-003&cantidad=1&inicio=2026-10-20&fin=2026-10-22">Cotizar EQ-003</Link></p>
    </Pendiente>
  );
}
