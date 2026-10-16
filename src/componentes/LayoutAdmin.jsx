import { NavLink, Outlet } from 'react-router-dom';

export default function LayoutAdmin() {
  return (
    <div className="admin">
      <aside className="sidebar">
        <div className="marca">
          <strong>SISTEMA DE RENTAS</strong>
          <span>Renta de maquinaria</span>
        </div>
        <nav>
          <NavLink to="/admin/cotizaciones" end>Cotizaciones</NavLink>
          <NavLink to="/admin/cotizaciones/nueva">Nueva cotización</NavLink>
          <NavLink to="/admin/apartados">Apartados y rentas</NavLink>
          <NavLink to="/">Ver sitio del cliente</NavLink>
        </nav>
        <div className="sidebar-pie"><strong>Área comercial</strong><span>Administrador</span></div>
      </aside>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
}
