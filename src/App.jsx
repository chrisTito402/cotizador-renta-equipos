import { Routes, Route } from 'react-router-dom';
import LayoutCliente from './componentes/LayoutCliente.jsx';
import LayoutAdmin from './componentes/LayoutAdmin.jsx';

import Catalogo from './paginas/cliente/Catalogo.jsx';
import DetalleEquipo from './paginas/cliente/DetalleEquipo.jsx';
import SolicitarCotizacion from './paginas/cliente/SolicitarCotizacion.jsx';
import MisRentas from './paginas/cliente/MisRentas.jsx';

import Cotizaciones from './paginas/admin/Cotizaciones.jsx';
import CrearCotizacion from './paginas/admin/CrearCotizacion.jsx';
import EditarCotizacion from './paginas/admin/EditarCotizacion.jsx';
import Apartados from './paginas/admin/Apartados.jsx';
import DetalleApartado from './paginas/admin/DetalleApartado.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<LayoutCliente />}>
        <Route path="/" element={<Catalogo />} />
        <Route path="/equipos/:id" element={<DetalleEquipo />} />
        <Route path="/cotizar" element={<SolicitarCotizacion />} />
        <Route path="/mis-rentas" element={<MisRentas />} />
      </Route>
      <Route path="/admin" element={<LayoutAdmin />}>
        <Route path="cotizaciones" element={<Cotizaciones />} />
        <Route path="cotizaciones/nueva" element={<CrearCotizacion />} />
        <Route path="cotizaciones/:id/editar" element={<EditarCotizacion />} />
        <Route path="apartados" element={<Apartados />} />
        <Route path="apartados/:id" element={<DetalleApartado />} />
      </Route>
    </Routes>
  );
}
