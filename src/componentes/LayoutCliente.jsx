import { Link, Outlet } from 'react-router-dom';

export default function LayoutCliente() {
  return (
    <div className="cliente">
      <header className="cliente-header">
        <Link to="/" className="marca">
          <strong>SISTEMA DE RENTAS</strong>
          <span>Renta de maquinaria</span>
        </Link>
        <Link to="/admin/cotizaciones" className="link-sutil">Panel administrativo →</Link>
      </header>
      <main className="cliente-main"><Outlet /></main>
    </div>
  );
}
