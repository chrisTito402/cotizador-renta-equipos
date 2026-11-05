import { clientDirectory, normalizeText } from './registros.js';

const compact = value => normalizeText(value).replace(/[^a-z0-9]/g, '');
const idKey = value => normalizeText(value).replace(/\d+/g, digits => String(Number(digits))).replace(/[^a-z0-9]/g, '');
const looksLikeId = query => /^(un|eq|r|ser|resp|ap|cot)[\s-]*\d+(?:[\s-]+\d+)*$/i.test(query);

const containsPhrase = (value, query) => normalizeText(value).replace(/\s+/g, ' ').includes(query) || compact(value).includes(compact(query));

function matches(query, fields, identifiers, phraseOnly) {
  if (looksLikeId(query)) return identifiers.some(value => value && (compact(value) === compact(query) || idKey(value) === idKey(query)));
  if (phraseOnly) return fields.filter(Boolean).some(value => containsPhrase(value, query));
  const haystack = normalizeText(fields.filter(value => value !== null && value !== undefined).join(' '));
  const compactFields = fields.filter(Boolean).map(compact);
  return normalizeText(query).split(/\s+/).every(term => haystack.includes(term) || compactFields.some(value => value.includes(compact(term))));
}

export function searchProject(data, query) {
  const text = normalizeText(query).replace(/\s+/g, ' ');
  if (!text || !compact(text)) return { clients: [], rentals: [], units: [] };
  const units = new Map(data.units.map(unit => [unit.id, unit]));
  const rentalFields = rental => {
    const unit = units.get(rental.unit);
    return [rental.id, rental.commercial, rental.client, rental.contact, rental.phone, rental.address,
      rental.site, rental.document?.folio, rental.unit, unit?.name, unit?.brand, unit?.model, unit?.serial, unit?.type];
  };
  const rentalIds = rental => [rental.id, rental.commercial, rental.document?.folio, rental.unit, units.get(rental.unit)?.serial];
  const phraseOnly = text.includes(' ') && [...data.rentals.flatMap(rentalFields), ...data.units.flatMap(unit => [unit.name, unit.brand, unit.model, unit.serial, unit.type])].filter(Boolean).some(value => containsPhrase(value, text));
  return {
    clients: clientDirectory(data.rentals).filter(client => matches(text,
      [client.name, client.contact, client.phone, ...client.addresses, ...client.rentals.flatMap(rentalFields)],
      client.rentals.flatMap(rentalIds), phraseOnly)),
    rentals: data.rentals.filter(rental => matches(text, rentalFields(rental), rentalIds(rental), phraseOnly)),
    units: data.units.filter(unit => {
      const related = data.rentals.filter(rental => rental.unit === unit.id);
      return matches(text, [unit.id, unit.modelId, unit.name, unit.brand, unit.model, unit.serial, unit.type, ...related.flatMap(rentalFields)],
        [unit.id, unit.modelId, unit.serial, ...related.flatMap(rentalIds)], phraseOnly);
    }),
  };
}
