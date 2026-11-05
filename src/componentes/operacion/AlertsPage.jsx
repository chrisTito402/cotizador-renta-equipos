import { useState } from 'react';
import { ALERT_KINDS } from '../../logica/operacion/alertas.js';
import { normalizeText } from '../../logica/operacion/registros.js';

const priorityNames = { alta: 'Atender primero', media: 'Por atender', baja: 'Seguimiento' };
const dateText = day => new Date(day + 'T12:00:00-07:00').toLocaleDateString('es-MX', {
  timeZone: 'America/Hermosillo', day: 'numeric', month: 'short', year: 'numeric',
});

export default function AlertsPage({ alerts, query, onOpenAlert, onDemo, demoWaiting }) {
  const [kind, setKind] = useState('');
  const [priority, setPriority] = useState('');
  const visible = alerts.filter(alert => (!kind || alert.kind === kind) && (!priority || alert.priority === priority)
    && normalizeText(`${alert.title} ${alert.rentalId || ''} ${alert.unitId} ${alert.unitName} ${alert.client || ''}`).includes(normalizeText(query)));
  const filtered = !!(kind || priority || query.trim());
  return <>
    <div className="page-heading"><div><h1>Alertas</h1><p>Revisa lo que requiere atención. Los avisos se actualizan al registrar cada actividad.</p></div><button className="button soft" onClick={onDemo} disabled={demoWaiting}>{demoWaiting?'Vuelve a Inicio para ver el aviso':'Probar aviso'}</button></div>
    <section className="panel alerts-filter-panel" aria-label="Filtrar alertas">
      <div className="alerts-filters">
        <label>Tipo de pendiente<select value={kind} onChange={event => setKind(event.target.value)}><option value="">Todos los pendientes</option>{Object.entries(ALERT_KINDS).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
        <label>Atención<select value={priority} onChange={event => setPriority(event.target.value)}><option value="">Todas las alertas</option>{Object.entries(priorityNames).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
      </div>
      {(kind || priority) && <button className="records-clear" onClick={() => { setKind(''); setPriority(''); }}>Limpiar filtros</button>}
    </section>
    <section className="alerts-list" aria-label="Pendientes por atender">
      {visible.map(alert => <article className={'panel alert-card'+(alert.example?' is-example':'')} key={alert.id}>
        <div className="alert-card-content"><span className={'alert-priority ' + alert.priority}>{alert.example?'Ejemplo':priorityNames[alert.priority]}</span><h2>{alert.title}</h2><p>{alert.detail}</p>
          <div className="alert-record"><strong>{alert.unitName}</strong><span>{alert.unitId}{alert.rentalId && ` · ${alert.rentalId}`}</span>{alert.client && <span>{alert.client}</span>}{alert.date && <span>Fecha de referencia · {dateText(alert.date)}</span>}</div>
        </div>
        <button className="button dark" onClick={() => onOpenAlert(alert)} aria-label={`${alert.label} · ${alert.unitId}${alert.rentalId ? ' · ' + alert.rentalId : ''}`}>{alert.label}<span aria-hidden="true">→</span></button>
      </article>)}
      {!visible.length && <div className="panel empty"><h2>{filtered ? 'No hay alertas con esos filtros' : 'No hay alertas pendientes'}</h2><p>{filtered ? 'Prueba con otro filtro o limpia la búsqueda de arriba.' : 'Los nuevos pendientes aparecerán aquí cuando corresponda.'}</p></div>}
    </section>
  </>;
}
