import { useEffect, useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { obtenerCarrito } from '../servicios/almacen.js';

// Cuántos equipos lleva el cliente en "Mi cotización". Se actualiza con el evento 'carrito' de almacen.js.
function useCantidadCarrito() {
  const contar = () => obtenerCarrito().lineas.length;
  const [cantidad, setCantidad] = useState(contar);
  useEffect(() => {
    const actualizar = () => setCantidad(contar());
    window.addEventListener('carrito', actualizar);
    return () => window.removeEventListener('carrito', actualizar);
  }, []);
  return cantidad;
}

export default function LayoutCliente() {
  const enCarrito = useCantidadCarrito();
  return (
    <div className="cliente">
      <header className="cliente-header">
        <Link to="/" className="marca">
          <strong>SISTEMA DE RENTAS</strong>
          <span>Renta de maquinaria</span>
        </Link>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link to="/cotizar" className="boton boton-secundario">Mi cotización ({enCarrito})</Link>
          <Link to="/admin/cotizaciones" className="link-sutil">Panel administrativo →</Link>
        </div>
      </header>
      <main className="cliente-main"><Outlet /></main>
    </div>
  );
}
