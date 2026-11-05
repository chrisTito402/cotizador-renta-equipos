// Puente Comercial → Operación. Función PURA: recibe datos y regresa datos.
// Una cotización aceptada genera una renta (estado Apartado) por cada unidad física asignada.

const rentalNumber = (id) => Number(String(id).match(/^R-(\d+)$/)?.[1] || 0);

export function reservedQuoteIds(data) {
  return new Set(data.rentals.map(rental => rental.commercial));
}

// Cada línea trae sus fechas (lineas[].fechaInicio/fechaFin); las generales de la cotización
// solo cubren líneas viejas que no las traen.
export const lineDates = (line, quote) => ({
  start: line.fechaInicio || quote.fechaInicio || '',
  end: line.fechaFin || quote.fechaFin || '',
});

// quote: cotización de servicios/almacen.js ({ id, cliente, lineas, fechaInicio?, fechaFin? })
export function createReservation(data, quote, now = new Date()) {
  if (!quote) throw Error('No se encontró la cotización.');
  if (reservedQuoteIds(data).has(quote.id)) throw Error(`La cotización ${quote.id} ya tiene apartado.`);
  const lines = (quote.lineas || []).filter(line => Number(line.cantidad) > 0);
  if (!lines.length) throw Error('La cotización no tiene equipos para apartar.');
  if (lines.some(line => { const { start, end } = lineDates(line, quote); return !start || !end; })) {
    throw Error('La cotización tiene equipos sin fechas de renta.');
  }

  const next = JSON.parse(JSON.stringify(data));
  const chosen = [];
  for (const line of lines) {
    const needed = Number(line.cantidad);
    const free = next.units.filter(unit => unit.modelId === line.equipoId && unit.state === 'Disponible' && !chosen.some(c => c.unit === unit));
    if (free.length < needed) {
      const name = next.units.find(unit => unit.modelId === line.equipoId)?.name || line.equipoId;
      throw Error(`No hay unidades disponibles de ${name}: se necesitan ${needed} y hay ${free.length}.`);
    }
    chosen.push(...free.slice(0, needed).map(unit => ({ unit, ...lineDates(line, quote) })));
  }

  const client = quote.cliente || {};
  const at = now.toISOString();
  let number = Math.max(0, ...next.rentals.map(rental => rentalNumber(rental.id)));
  const created = chosen.map(({ unit, start, end }) => {
    unit.state = 'Apartado';
    unit.stateChangedAt = at;
    number += 1;
    return {
      id: `R-${String(number).padStart(3, '0')}`, commercial: quote.id, unit: unit.id,
      client: client.nombreCompleto || 'Cliente sin nombre', contact: client.nombreCompleto || '',
      phone: client.telefono || '', email: client.correo || '',
      address: client.municipio || '', site: '',
      start, end,
      status: 'Apartado', ready: false, preparedBy: '', preparation: '',
      document: null, signature: null, installation: null, collection: null,
      issues: [], reviews: [],
      events: [{ at, text: `Apartado confirmado recibido de Comercial (${quote.id})`, by: 'Administrador' }],
    };
  });
  next.rentals.push(...created);
  return { data: next, rentals: created };
}
