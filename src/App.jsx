import { Routes, Route, Navigate } from 'react-router-dom';
import LayoutCliente from './componentes/LayoutCliente.jsx';

import Catalogo from './paginas/cliente/Catalogo.jsx';
import DetalleEquipo from './paginas/cliente/DetalleEquipo.jsx';
import SolicitarCotizacion from './paginas/cliente/SolicitarCotizacion.jsx';

import Cotizaciones from './paginas/admin/Cotizaciones.jsx';
import CrearCotizacion from './paginas/admin/CrearCotizacion.jsx';
import EditarCotizacion from './paginas/admin/EditarCotizacion.jsx';

import PanelAdmin from './paginas/operacion/Operacion.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<LayoutCliente />}>
        <Route path="/" element={<Catalogo />} />
        <Route path="/equipos/:id" element={<DetalleEquipo />} />
        <Route path="/cotizar" element={<SolicitarCotizacion />} />
      </Route>
      {/* Panel administrativo único: Comercial (cotizaciones) + Operaciones (apartados, rentas, equipos). */}
      <Route path="/admin" element={<PanelAdmin />}>
        <Route index element={<Navigate to="inicio" replace />} />
        <Route path="cotizaciones" element={<Cotizaciones />} />
        <Route path="cotizaciones/nueva" element={<CrearCotizacion />} />
        <Route path="cotizaciones/:id/editar" element={<EditarCotizacion />} />
        <Route path="apartados/*" element={<Navigate to="/admin/apartar" replace />} />
        {/* inicio, apartar, alertas, registros, equipos, mantenimiento, clientes: las resuelve PanelAdmin */}
        <Route path=":seccion" element={null} />
      </Route>
      <Route path="/operacion/*" element={<Navigate to="/admin/inicio" replace />} />
    </Routes>
  );
}
