import { useState } from 'react';
import { obtenerEquipo } from '../../servicios/almacen.js';
import { cotizacionesParaApartar, crearApartado, registrarAceptacionSimulada } from '../../servicios/operacion.js';

const fecha = (value) => value ? new Date(value + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha';

// Cotizaciones de Comercial que Operación puede convertir en apartados (una renta por unidad física).
export default function PorApartar({ data, onCreated, onOpenRental }) {
  const [error, setError] = useState('');
  const [, refrescar] = useState(0);
  const [verApartadas, setVerApartadas] = useState(false);
  const cotizaciones = cotizacionesParaApartar(data).filter((c) => verApartadas || !c.apartada);

  const ejecutar = (accion) => {
    setError('');
    try { accion(); } catch (e) { setError(e.message); }
  };
  const aceptar = (id) => ejecutar(() => { registrarAceptacionSimulada(id); refrescar((n) => n + 1); });
  const apartar = (id) => ejecutar(() => { const { data: next, rentals } = crearApartado(data, id); onCreated(next, rentals); });

  return <>
    <div className="page-heading"><div><p className="eyebrow">OPERACIONES / COMERCIAL</p><h1>Por apartar</h1><p>Cotizaciones aceptadas que todavía no tienen equipo asignado.</p></div></div>
    <section className="panel">
      <div className="panel-heading">
        <div><h2>Cotizaciones</h2><p>Al crear el apartado se asigna una unidad disponible por cada equipo cotizado.</p></div>
        <label className="checkbox-row"><input type="checkbox" checked={verApartadas} onChange={(e) => setVerApartadas(e.target.checked)} />Mostrar ya apartadas</label>
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
      <div className="overview-head" aria-hidden="true"><span>Cotización</span><span>Cliente</span><span>Periodo</span><span /></div>
      <div className="overview-list">
        {cotizaciones.map((c) => (
          <article className="overview-row" key={c.id}>
            <div className="overview-equipment">
              <strong>{c.id}</strong>
              <small>{(c.lineas || []).map((l) => `${l.cantidad} × ${obtenerEquipo(l.equipoId)?.nombre || l.equipoId}`).join(' · ')}</small>
              <span className={'badge ' + (c.apartada ? 'green' : c.aceptada ? 'blue' : 'amber')}><i />{c.apartada ? 'Apartada' : c.aceptada ? 'Aceptada' : 'Pendiente de aceptación'}</span>
            </div>
            <div className="overview-client"><span className="mobile-label">Cliente</span><span>{c.cliente?.nombreCompleto}</span></div>
            <div className="overview-date"><span className="mobile-label">Periodo</span><span>{fecha(c.fechaInicio)} al {fecha(c.fechaFin)}</span></div>
            {c.apartada
              ? <button className="button soft" onClick={() => onOpenRental(c.rentas[0].id)}>Ver {c.rentas.map((r) => r.id).join(', ')}</button>
              : c.aceptada
                ? <button className="button dark" onClick={() => apartar(c.id)}>Crear apartado</button>
                : <button className="button soft" onClick={() => aceptar(c.id)} title="No hay respuesta real del cliente; se registra una aceptación simulada">Simular aceptación</button>}
          </article>
        ))}
      </div>
      {!cotizaciones.length && <div className="empty"><h3>Todo al día</h3><p>No hay cotizaciones pendientes de apartar.</p></div>}
    </section>
  </>;
}
