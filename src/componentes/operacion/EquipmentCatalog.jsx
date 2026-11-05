import { useState } from 'react';
import { STATES } from '../../logica/operacion/operaciones.js';
import { normalizeText } from '../../logica/operacion/registros.js';

const dateText = value => value ? new Date(value.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha registrada';

function EquipmentImage({ type, maintenance }) {
  return <div className="catalog-photo" aria-label={'Equipo sin fotografía · ' + type}>
    <span className="catalog-photo-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 15V9h13l3 6H3Zm3-6V5h7l3 4M4 19h16"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></span><span>{maintenance ? 'Equipo en mantenimiento' : type}</span>
  </div>;
}

export default function EquipmentCatalog({ units, rentals, maintenance = false, onOpenUnit }) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [state, setState] = useState('');
  const types = [...new Set(units.map(unit => unit.type))].sort((a, b) => a.localeCompare(b, 'es'));
  const visible = units.filter(unit => (!maintenance || unit.state === 'En mantenimiento') && (!type || unit.type === type) && (!state || unit.state === state) && normalizeText(`${unit.id} ${unit.name} ${unit.model} ${unit.serial}`).includes(normalizeText(search)));
  return <>
    <header className="page-heading"><div><p className="eyebrow">{maintenance ? 'EQUIPOS / MANTENIMIENTO' : 'EQUIPOS / CATÁLOGO'}</p><h1>{maintenance ? 'Mantenimiento' : 'Catálogo de equipos'}</h1><p>{maintenance ? 'Consulta los equipos pendientes de atención.' : 'Consulta cada unidad y su calendario.'}</p></div></header>
    <section className="panel catalog-filter-panel" aria-label="Filtros de equipos"><div className="catalog-filters"><label>Nombre, modelo o identificador<input type="search" placeholder="Ej. Toyota o UN-001" value={search} onChange={event => setSearch(event.target.value)}/></label><label>Tipo de equipo<select value={type} onChange={event => setType(event.target.value)}><option value="">Todos los tipos</option>{types.map(type => <option key={type}>{type}</option>)}</select></label>{!maintenance && <label>Estado<select value={state} onChange={event => setState(event.target.value)}><option value="">Todos los estados</option>{STATES.map(state => <option key={state}>{state}</option>)}</select></label>}</div></section>
    <h2 className="catalog-section-title">{maintenance ? 'Equipos en taller' : 'Unidades físicas'}</h2>
    <div className="catalog-grid">{visible.map(unit => {
      const unitRentals = rentals.filter(rental => rental.unit === unit.id);
      const rental = unitRentals.find(rental => rental.status !== 'Cerrada') || [...unitRentals].sort((a, b) => b.start.localeCompare(a.start))[0];
      const tone = ['Disponible', 'En renta'].includes(unit.state) ? 'green' : ['En mantenimiento', 'Fuera de servicio'].includes(unit.state) ? 'red' : unit.state === 'Apartado' ? 'blue' : 'amber';
      return <article className="panel catalog-card" key={unit.id}><EquipmentImage type={unit.type} maintenance={maintenance}/><div className="catalog-card-body"><div className="catalog-meta"><span className="catalog-code">{unit.id}</span><span className={'badge ' + tone}><i/>{unit.state}</span></div><button className="row-open catalog-title-button" onClick={() => onOpenUnit(unit.id)} aria-label={'Abrir ' + unit.name + ' ' + unit.id}><h2>{unit.name}</h2></button><p className="catalog-model">{unit.type} · {unit.model}</p><dl className="catalog-dates">{maintenance ? <><div><dt>Ingreso</dt><dd>{dateText(unit.maintenanceStartedAt)}</dd></div><div><dt>Actualización</dt><dd>{dateText(unit.stateChangedAt)}</dd></div></> : rental ? <><div><dt>{rental.delivery ? 'Entrega' : 'Inicio previsto'}</dt><dd>{dateText(rental.delivery?.date || rental.start)}</dd></div><div><dt>{rental.return ? 'Devolución' : 'Regreso previsto'}</dt><dd>{dateText(rental.return?.date || rental.end)}</dd></div></> : <div className="catalog-no-dates"><dt>Programación</dt><dd>Sin rentas registradas</dd></div>}</dl><button className="catalog-card-action" onClick={() => onOpenUnit(unit.id)}>Ver equipo y calendario <span aria-hidden="true">→</span></button></div></article>;
    })}</div>
    {!visible.length && <section className="panel empty"><h3>No hay equipos con esos filtros</h3><p>Prueba con otro nombre, tipo o estado.</p><button className="button soft" onClick={() => { setSearch(''); setType(''); setState(''); }}>Limpiar filtros</button></section>}
  </>;
}
