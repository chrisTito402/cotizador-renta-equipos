import assert from 'node:assert/strict';
import { buildAlerts, businessDay } from '../src/logica/operacion/alertas.js';
import { initialData, applyOperation } from '../src/logica/operacion/operaciones.js';

const now = new Date('2026-10-23T18:00:00Z');
const unit = { id: 'EQ-A', name: 'Montacargas Toyota', state: 'En renta' };
const rental = { id: 'R-A', unit: unit.id, client: 'Cliente de ejemplo', status: 'En renta',
  delivery: { date: '2026-10-22', at: '2026-10-22T18:00:00Z' }, start: '2026-10-22', end: '2026-11-10',
  document: null, documentPhoto: null, signature: null, issues: [], reviews: [], events: [] };
const get = (overrides = {}, date = now) => buildAlerts({ units: [unit], rentals: [{ ...rental, ...overrides }] }, date);
const kinds = alerts => alerts.map(alert => alert.kind);
const photo = { image: 'data:image/png;base64,YQ==', name: 'hoja.png' };

assert.equal(businessDay(new Date('2026-10-24T02:00:00Z')), '2026-10-23');
assert.equal(get({}, new Date(now.getTime() - 1)).length, 0, 'No recordar la hoja antes de 24 horas');
assert.equal(get()[0].id, 'R-A-responsiva', 'Recordar al cumplir 24 horas');
assert.equal(get({ documentPhoto: photo, signature: { name: 'Cliente' } }).length, 0);
assert.equal(get({ documentPhoto: photo })[0].action, 'signature');
assert.equal(get({ delivery: null }).length, 0, 'No inventar una fecha de entrega');
assert.equal(get({ delivery: { date: '2026-10-22' } })[0].kind, 'documentos');
assert.equal(get({ status: 'Cerrada' })[0].kind, 'documentos', 'La hoja no deja de faltar al cerrar la renta');
assert.equal(get({ status: 'Cerrada', documentPhoto: photo }).length, 0, 'No vencimientos ni firmas en rentas cerradas');

assert.ok(kinds(get({ end: '2026-10-26' })).includes('rentas'));
assert.ok(!kinds(get({ end: '2026-10-27' })).includes('rentas'));
assert.equal(get({ end: '2026-10-22' }).find(a => a.kind === 'rentas').priority, 'alta');
assert.equal(get({ end: '2026-10-23' }).find(a => a.kind === 'rentas').title, 'La renta vence hoy');
assert.ok(kinds(get({ collection: { date: '2026-10-24', time: '11:00' } })).includes('recolecciones'));
assert.ok(!kinds(get({ collection: { date: '2026-10-24', time: '11:01' } })).includes('recolecciones'));
assert.equal(get({ collection: { date: '2026-10-23', time: '10:00' } }).find(a => a.kind === 'recolecciones').priority, 'alta');
assert.ok(!kinds(get({ return: { date: '2026-10-23' } })).includes('recolecciones'));

assert.equal(get({ status: 'Apartado', start: '2026-10-24' })[0].action, 'prepare');
assert.equal(get({ status: 'En preparación', start: '2026-10-23', ready: true })[0].action, 'deliver');
assert.equal(get({ status: 'Apartado', start: '2026-10-25' }).length, 0);
assert.equal(get({ status: 'En revisión', document: {}, return: { date: '2026-10-22', at: '2026-10-22T18:00:00Z' } })[0].action, 'close');
assert.equal(get({ status: 'En revisión', document: {}, return: { date: '2026-10-23', at: '2026-10-23T17:00:00Z' } }).length, 0);
assert.ok(kinds(get({ issues: [{ at: '2026-10-23T16:00:00Z' }] })).includes('fallas'));
assert.ok(!kinds(get({ issues: [{ at: '2026-10-23T16:00:00Z' }], reviews: [{ at: '2026-10-23T17:00:00Z' }] })).includes('fallas'));
assert.ok(kinds(get({ issues: [{ at: '2026-10-23T18:00:00Z' }], reviews: [{ at: '2026-10-23T17:00:00Z' }] })).includes('fallas'));

const maintenance = buildAlerts({ units: [{ ...unit, state: 'En mantenimiento' }], rentals: [] }, now);
assert.equal(maintenance[0].action, 'equipment');
assert.equal(maintenance[0].date, null, 'No inventar fecha de ingreso');
assert.equal(buildAlerts({ units: [], rentals: [rental] }, now).length, 0);
const invalidDates = get({ delivery: { date: 'sin-fecha' }, end: '', collection: { date: '' } });
assert.equal(invalidDates.length, 0);
const original = initialData();
const snapshot = JSON.stringify(original);
const alerts = buildAlerts(original, now);
assert.equal(JSON.stringify(original), snapshot, 'Consultar alertas no cambia los datos');
assert.equal(new Set(alerts.map(a => a.id)).size, alerts.length);
assert.ok(alerts.every((a, i) => i === 0 || ({ alta: 0, media: 1, baja: 2 }[alerts[i - 1].priority] <= { alta: 0, media: 1, baja: 2 }[a.priority])));

const data = { version: 1, units: [unit], rentals: [{ ...rental }] };
const attached = applyOperation(data, 'R-A', 'photo', photo);
assert.ok(!buildAlerts(attached, now).some(a => a.id === 'R-A-responsiva'));
assert.ok(buildAlerts(attached, now).some(a => a.id === 'R-A-firma'));
const signed = applyOperation(attached, 'R-A', 'signature', { name: 'Cliente', date: '2026-10-23' });
assert.equal(buildAlerts(signed, now).length, 0);
console.log('Alertas verificadas con límites de tiempo, fechas de Hermosillo y resolución por actividad.');
