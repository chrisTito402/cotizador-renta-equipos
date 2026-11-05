import { searchProject } from '../../logica/operacion/busqueda.js';

const dateText = value => value ? new Date(value + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

export default function SearchResults({ data, query, onOpenRental, onOpenUnit, onOpenClient }) {
  const results = searchProject(data, query);
  const hasResults = results.clients.length || results.rentals.length || results.units.length;
  const units = new Map(data.units.map(unit => [unit.id, unit]));
  return <>
    <div className="page-heading"><div><h1>Resultados de búsqueda</h1><p>Clientes, registros y equipos que coinciden con “{query.trim()}”.</p></div></div>
    {!hasResults && <section className="panel empty" role="status"><h2>No se encontraron coincidencias</h2><p>Prueba con parte del nombre, el teléfono, un folio o el identificador del equipo.</p></section>}
    {results.clients.length > 0 && <section className="panel search-result-group" aria-labelledby="search-clients-title">
      <div className="panel-heading"><h2 id="search-clients-title">Clientes</h2></div>
      {results.clients.map(client => <article className="search-result-row" key={client.id}>
        <div><h3>{client.name}</h3><p>{[client.contact, client.phone].filter(Boolean).join(' · ') || 'Sin contacto registrado'}</p></div>
        <button className="button soft" onClick={() => onOpenClient(client.id)} aria-label={'Ver cliente · ' + client.name}>Ver cliente<span aria-hidden="true">→</span></button>
      </article>)}
    </section>}
    {results.rentals.length > 0 && <section className="panel search-result-group" aria-labelledby="search-rentals-title">
      <div className="panel-heading"><h2 id="search-rentals-title">Registros</h2></div>
      {results.rentals.map(rental => <article className="search-result-row" key={rental.id}>
        <div><span className="search-result-id">{rental.id}{rental.commercial && ` · ${rental.commercial}`}</span><h3>{rental.client}</h3><p>{units.get(rental.unit)?.name || rental.unit} · {rental.unit}</p><p>{rental.status === 'Cerrada' ? 'Finalizada' : rental.status}{rental.start && ` · Inicio ${dateText(rental.delivery?.date || rental.start)}`}</p></div>
        <button className="button dark" onClick={() => onOpenRental(rental.id)} aria-label={'Abrir registro · ' + rental.id}>Abrir registro<span aria-hidden="true">→</span></button>
      </article>)}
    </section>}
    {results.units.length > 0 && <section className="panel search-result-group" aria-labelledby="search-units-title">
      <div className="panel-heading"><h2 id="search-units-title">Equipos</h2></div>
      {results.units.map(unit => <article className="search-result-row" key={unit.id}>
        <div><span className="search-result-id">{unit.id}</span><h3>{unit.name}</h3><p>{[unit.model, unit.serial].filter(Boolean).join(' · ')}</p><span className="search-result-state">{unit.state}</span></div>
        <button className="button soft" onClick={() => onOpenUnit(unit.id)} aria-label={'Ver equipo · ' + unit.id}>Ver equipo<span aria-hidden="true">→</span></button>
      </article>)}
    </section>}
  </>;
}
