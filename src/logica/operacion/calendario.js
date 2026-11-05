export function localDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function equipmentSchedule(rentals, unitId, now = new Date()) {
  const today = localDay(now);
  return rentals.filter(rental => rental.unit === unitId).map(rental => {
    const start = rental.delivery?.date || rental.start;
    let end = rental.return?.date || rental.end;
    if (rental.status === 'En renta' && !rental.return && end < today) end = today;
    return { rental, start, end };
  });
}

export function eventsForDay(schedule, date) {
  return schedule.filter(({ rental, start, end }) =>
    (date >= start && date <= end) || rental.collection?.date === date
  );
}
