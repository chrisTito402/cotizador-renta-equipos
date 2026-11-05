import assert from 'node:assert/strict';
import { initialData } from '../src/logica/operacion/operaciones.js';
import { createReservation, reservedQuoteIds } from '../src/logica/operacion/apartados.js';
import { searchProject } from '../src/logica/operacion/busqueda.js';
import { EQUIPOS } from '../src/datos/equipos.js';

const data = initialData();
const snapshot = JSON.stringify(data);

// Cada modelo del catálogo comercial tiene al menos una unidad física y todas apuntan a un modelo real.
for (const model of EQUIPOS) assert.ok(data.units.some(unit => unit.modelId === model.id), `Falta unidad de ${model.id}`);
assert.ok(data.units.every(unit => EQUIPOS.some(model => model.id === unit.modelId)));
assert.equal(new Set(data.units.map(unit => unit.id)).size, data.units.length, 'Identificadores de unidad únicos');

const quote = {
  id: 'COT-0001', cliente: { nombreCompleto: 'Martín Robles Ibarra', telefono: '6441234567', correo: 'martin@ejemplo.com', municipio: 'Cajeme' },
  lineas: [{ equipoId: 'EQ-005', cantidad: 1 }, { equipoId: 'EQ-003', cantidad: 1 }], fechaInicio: '2026-10-20', fechaFin: '2026-10-22',
};
const { data: next, rentals } = createReservation(data, quote, new Date('2026-10-10T12:00:00Z'));
assert.equal(rentals.length, 2, 'Una renta por unidad física');
assert.ok(rentals.every(rental => rental.status === 'Apartado' && rental.commercial === 'COT-0001'));
assert.equal(new Set(rentals.map(rental => rental.id)).size, 2);
assert.ok(rentals.every(rental => next.units.find(unit => unit.id === rental.unit).state === 'Apartado'));
assert.equal(rentals[0].client, 'Martín Robles Ibarra');
assert.equal(rentals[0].phone, '6441234567');
assert.ok(reservedQuoteIds(next).has('COT-0001'));
assert.equal(JSON.stringify(data), snapshot, 'No modifica los datos de entrada');

assert.throws(() => createReservation(next, quote), /ya tiene apartado/);
assert.throws(() => createReservation(data, { ...quote, id: 'COT-0099', lineas: [{ equipoId: 'EQ-001', cantidad: 5 }] }), /No hay unidades disponibles/);
assert.equal(JSON.stringify(data), snapshot, 'Un error no deja apartados parciales');

assert.equal(searchProject(next, 'COT-0001').rentals.length, 2, 'Se encuentra por folio de cotización');
assert.ok(searchProject(next, 'EQ-005').units.every(unit => unit.modelId === 'EQ-005'), 'Se encuentran unidades por modelo del catálogo');
console.log('Apartado desde cotización verificado: unidades por modelo, una renta por unidad, sin duplicados ni apartados parciales.');
