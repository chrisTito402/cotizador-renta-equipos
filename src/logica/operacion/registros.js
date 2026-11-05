export const normalizeText = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();

export function rentalRecords(rentals, historical = false) {
  return rentals.filter(rental => (rental.status === 'Cerrada') === historical);
}

export function clientDirectory(rentals) {
  const clients = new Map();
  for (const rental of rentals) {
    const key = normalizeText(rental.client);
    if (!clients.has(key)) clients.set(key, { id: key, name: rental.client, contact: rental.contact, phone: rental.phone, addresses: [], rentals: [] });
    const client = clients.get(key);
    if (rental.address && !client.addresses.includes(rental.address)) client.addresses.push(rental.address);
    client.rentals.push(rental);
  }
  return [...clients.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
