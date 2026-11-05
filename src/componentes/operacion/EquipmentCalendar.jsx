import { useMemo, useState } from 'react';
import { equipmentSchedule, eventsForDay, localDay } from '../../logica/operacion/calendario.js';

const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const longDate = value => new Date(value + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

function eventType(rental, date) {
  if (rental.return?.date === date) return 'Devolución';
  if (rental.collection?.date === date) return 'Recolección';
  if (['Cerrada', 'En revisión'].includes(rental.status)) return 'Renta anterior';
  if (rental.status === 'Apartado') return 'Reservación';
  if (rental.status === 'En preparación') return 'Preparación';
  if (rental.status === 'En mantenimiento') return 'Entrega detenida';
  return 'Renta';
}

export default function EquipmentCalendar({ unit, rentals, onOpenRental }) {
  const today = localDay(new Date());
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12));
  const [selected, setSelected] = useState(today);
  const schedule = useMemo(() => equipmentSchedule(rentals, unit.id), [rentals, unit.id]);
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((offset + totalDays) / 7) * 7;
  const days = Array.from({ length: cellCount }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - offset + 1, 12));
  const selectedEvents = eventsForDay(schedule, selected);
  const changeMonth = amount => {
    const next = new Date(month.getFullYear(), month.getMonth() + amount, 1, 12);
    setMonth(next);
    setSelected(localDay(next));
  };

  return <section className="equipment-calendar" aria-label={'Calendario de ' + unit.id}>
    <div className="calendar-title"><h3>Calendario del equipo</h3><button className="button plain compact" onClick={() => { setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12)); setSelected(today); }}>Hoy</button></div>
    <div className="calendar-month-bar"><button className="icon-button" aria-label="Mes anterior" onClick={() => changeMonth(-1)}>‹</button><strong aria-live="polite">{month.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</strong><button className="icon-button" aria-label="Mes siguiente" onClick={() => changeMonth(1)}>›</button></div>
    <div className="calendar-weekdays" aria-hidden="true">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
    <div className="calendar-days">{days.map(date => {
      const key = localDay(date);
      const items = eventsForDay(schedule, key);
      const booked = items.some(({ rental }) => ['Apartado', 'En preparación', 'En mantenimiento'].includes(rental.status));
      return <button key={key} className={'calendar-day' + (date.getMonth() !== month.getMonth() ? ' outside-month' : '') + (key === today ? ' is-today' : '') + (items.length ? booked ? ' has-booking' : ' has-rental' : '') + (key === selected ? ' is-selected' : '')} onClick={() => { setSelected(key); if (date.getMonth() !== month.getMonth()) setMonth(new Date(date.getFullYear(), date.getMonth(), 1, 12)); }} aria-pressed={key === selected} aria-label={longDate(key) + (items.length ? ' · ' + items.map(({ rental }) => eventType(rental, key)).join(', ') : ' · Sin reservaciones registradas')}><span>{date.getDate()}</span>{items.length > 0 && <i aria-hidden="true"/>}</button>;
    })}</div>
    <div className="calendar-legend"><span><i className="booking-dot"/>Reservación o preparación</span><span><i className="rental-dot"/>Renta y movimientos</span></div>
    <div className="calendar-day-detail" key={selected}><h4>{longDate(selected)}</h4>{selectedEvents.length ? selectedEvents.map(({ rental }) => <button className="calendar-event" key={rental.id} onClick={() => onOpenRental(rental.id)}><div><span className="calendar-event-type">{eventType(rental, selected)}</span><strong>{rental.client}</strong><small>{rental.id} · {longDate(rental.start)} al {longDate(rental.return?.date || rental.end)}</small></div><span aria-hidden="true">→</span></button>) : <p>Sin reservaciones registradas para este día.</p>}</div>
    {['En mantenimiento', 'Fuera de servicio', 'En revisión'].includes(unit.state) && <p className="calendar-status-note">Estado actual <strong>{unit.state}</strong>. La ausencia de una reservación no confirma que esté disponible.</p>}
  </section>;
}
