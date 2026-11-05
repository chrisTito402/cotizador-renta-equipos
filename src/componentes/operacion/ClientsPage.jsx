import { useState } from 'react';
import { clientDirectory, normalizeText, rentalRecords } from '../../logica/operacion/registros.js';
import { RecordRows } from './RecordsPage.jsx';

export default function ClientsPage({ rentals, units, query, onOpenRental, onClearSearch, initialClientId = null, onBackToResults }) {
  const [clientId, setClientId] = useState(initialClientId);
  const [historical, setHistorical] = useState(false);
  const [page, setPage] = useState(1);
  const clients = clientDirectory(rentals);
  const selected = clients.find(client => client.id === clientId);
  const matches = clients.filter(client => normalizeText(`${client.name} ${client.contact} ${client.phone}`).includes(normalizeText(query)));
  const pages = Math.max(1, Math.ceil(matches.length / 6));
  const current = Math.min(page, pages);
  const openClient = id => { setClientId(id); setHistorical(false); onClearSearch(); };
  if (selected && !query.trim()) return <>
    <div className="breadcrumbs"><button onClick={() => onBackToResults ? onBackToResults() : setClientId(null)}>← Volver a {onBackToResults ? 'resultados' : 'clientes'}</button></div>
    <div className="page-heading"><div><h1>{selected.name}</h1><p>Información y registros del cliente.</p></div></div>
    <section className="panel client-summary"><dl className="summary-facts"><div><dt>Contacto</dt><dd>{selected.contact || 'Sin contacto registrado'}</dd></div><div><dt>Teléfono</dt><dd>{selected.phone || 'Sin teléfono registrado'}</dd></div></dl><details className="additional-details"><summary>Direcciones de entrega<span aria-hidden="true">›</span></summary><div className="additional-body">{selected.addresses.map(address => <p key={address}>{address}</p>)}</div></details></section>
    <div className="tabs"><button className={!historical ? 'selected' : ''} onClick={() => setHistorical(false)}>Registros actuales</button><button className={historical ? 'selected' : ''} onClick={() => setHistorical(true)}>Anteriores</button></div>
    <section className="panel dissolve-panel" key={String(historical)}><RecordRows records={rentalRecords(selected.rentals, historical)} units={units} historical={historical} onOpenRental={onOpenRental} emptyText={historical ? 'Este cliente todavía no tiene rentas finalizadas.' : 'Este cliente no tiene operaciones en curso.'}/></section>
  </>;
  return <>
    <div className="page-heading"><div><h1>Clientes</h1><p>Consulta sus datos y registros de renta.</p></div></div>
    <section className="panel"><div className="client-table-heading" aria-hidden="true"><span>Cliente</span><span>Contacto</span><span>Última renta</span><span/></div>
      {matches.slice((current - 1) * 6, current * 6).map(client => <article className="overview-row client-table-row" key={client.id}><div className="overview-equipment"><button className="row-open" onClick={() => openClient(client.id)}><strong>{client.name}</strong></button></div><div className="overview-client"><span className="mobile-label">Contacto</span>{client.contact}</div><div className="overview-date"><span className="mobile-label">Última renta</span>{new Date([...client.rentals].sort((a,b)=>b.start.localeCompare(a.start))[0].start+'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'})}</div><button className="button dark" onClick={() => openClient(client.id)}>Ver cliente<span aria-hidden="true">→</span></button></article>)}
      {!matches.length && <div className="empty"><h3>Sin coincidencias</h3><p>Busca por nombre, contacto o teléfono.</p></div>}
      {pages > 1 && <footer className="list-footer simple-footer"><span/><div><button className="button plain compact" disabled={current === 1} onClick={() => setPage(current - 1)}>Anterior</button><b>{current} de {pages}</b><button className="button plain compact" disabled={current === pages} onClick={() => setPage(current + 1)}>Siguiente</button></div></footer>}
    </section>
  </>;
}
