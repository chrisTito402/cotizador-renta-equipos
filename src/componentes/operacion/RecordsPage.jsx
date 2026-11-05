import { useState } from 'react';
import { normalizeText } from '../../logica/operacion/registros.js';

const dateText = value => value ? new Date(value + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha';
const statuses = ['Apartado', 'En preparación', 'En renta', 'En revisión', 'En mantenimiento', 'Cerrada'];

export function RecordRows({ records, units, onOpenRental, historical = false, emptyText = 'No hay registros que coincidan.' }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(records.length / 5));
  const current = Math.min(page, pages);
  if (!records.length) return <div className="empty"><span className="empty-icon">—</span><h3>Sin registros</h3><p>{emptyText}</p></div>;
  return <>
    <div className="record-table-heading" aria-hidden="true"><span>Registro y equipo</span><span>Cliente</span><span>Fechas</span><span/></div>
    {records.slice((current - 1) * 5, current * 5).map(rental => {
      const unit = units.find(unit => unit.id === rental.unit);
      return <article className="overview-row record-table-row" key={rental.id}>
        <div className="overview-equipment"><button className="row-open" onClick={() => onOpenRental(rental.id)} aria-label={`Abrir registro ${rental.id}`}><strong>{unit?.name || rental.unit}</strong></button><small className="mono">{rental.id} · {rental.unit}</small><span className={'record-state'+(rental.status==='Cerrada'?' is-complete':'')}>{rental.status==='Cerrada'?'Finalizada':rental.status}</span></div>
        <div className="overview-client"><span className="mobile-label">Cliente</span><span>{rental.client}</span></div>
        <div className="overview-date record-dates"><span><small>{rental.delivery?'Entrega':'Inicio previsto'}</small>{dateText(rental.delivery?.date || rental.start)}</span><span><small>{rental.return?'Devolución':'Regreso previsto'}</small>{dateText(rental.return?.date || rental.end)}</span></div>
        <button className="button dark" onClick={() => onOpenRental(rental.id)}>{rental.status==='Cerrada' ? 'Consultar' : 'Abrir registro'}<span aria-hidden="true">→</span></button>
      </article>;
    })}
    {pages > 1 && <footer className="list-footer simple-footer"><span/><div><button className="button plain compact" disabled={current === 1} onClick={() => setPage(current - 1)}>Anterior</button><b>{current} de {pages}</b><button className="button plain compact" disabled={current === pages} onClick={() => setPage(current + 1)}>Siguiente</button></div></footer>}
  </>;
}

export default function RecordsPage({ rentals, units, query, onOpenRental }) {
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [order, setOrder] = useState('recent');
  const invalidRange = from && to && from > to;
  const records = rentals.filter(rental => {
    const unit = units.find(unit => unit.id === rental.unit);
    const start = rental.delivery?.date || rental.start;
    const end = rental.return?.date || rental.end;
    return (!status || rental.status === status)
      && (!from || end >= from)
      && (!to || start <= to)
      && normalizeText(`${rental.id} ${rental.commercial} ${rental.client} ${rental.unit} ${unit?.name || ''}`).includes(normalizeText(query));
  }).sort((a, b) => {
    const first = a.delivery?.date || a.start;
    const second = b.delivery?.date || b.start;
    return order === 'recent' ? second.localeCompare(first) || b.id.localeCompare(a.id) : first.localeCompare(second) || a.id.localeCompare(b.id);
  });
  const hasFilters = status || from || to || order !== 'recent';
  return <>
    <div className="page-heading"><div><h1>Registros</h1><p>Consulta las fechas y el estado de cada operación.</p></div></div>
    <section className="panel records-filter-panel" aria-label="Filtrar registros">
      <div className="records-filters">
        <label>Desde<input type="date" value={from} onChange={event => setFrom(event.target.value)}/></label>
        <label>Hasta<input type="date" value={to} min={from || undefined} onChange={event => setTo(event.target.value)}/></label>
        <label>Estado<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos los estados</option>{statuses.map(status => <option value={status} key={status}>{status === 'Cerrada' ? 'Finalizada' : status}</option>)}</select></label>
        <label>Ordenar<select value={order} onChange={event => setOrder(event.target.value)}><option value="recent">Más recientes primero</option><option value="oldest">Más antiguos primero</option></select></label>
      </div>
      {invalidRange && <p className="date-range-error" role="alert">La fecha final debe ser igual o posterior a la inicial.</p>}
      {hasFilters && <button className="records-clear" onClick={() => { setStatus(''); setFrom(''); setTo(''); setOrder('recent'); }}>Limpiar filtros</button>}
    </section>
    {!invalidRange && <section className="panel dissolve-panel"><RecordRows key={`${query}-${status}-${from}-${to}-${order}`} records={records} units={units} onOpenRental={onOpenRental} emptyText="No hay registros con esas fechas o estado."/></section>}
  </>;
}
