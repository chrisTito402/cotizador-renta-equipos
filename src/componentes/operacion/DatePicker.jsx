import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { localDay } from '../../logica/operacion/calendario.js';

const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const formatDate = date => date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const date = new Date(value + 'T12:00:00');
  return !Number.isNaN(date.getTime()) && localDay(date) === value ? date : null;
}
function moveMonth(date, amount) {
  const target = new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0, 12).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), last), 12);
}

export default function DatePicker({ name, label, defaultValue }) {
  const id = useId();
  const root = useRef(null);
  const trigger = useRef(null);
  const popup = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0, visibility: 'hidden' });
  const dayButtons = useRef(new Map());
  const [value, setValue] = useState(() => localDay(parseDate(defaultValue) || new Date()));
  const [focusedDate, setFocusedDate] = useState(() => parseDate(defaultValue) || new Date());
  const [open, setOpen] = useState(false);
  const focusedKey = localDay(focusedDate);
  const year = focusedDate.getFullYear();
  const month = focusedDate.getMonth();
  const selected = parseDate(value);
  const today = localDay(new Date());
  const first = new Date(year, month, 1, 12);
  const offset = (first.getDay() + 6) % 7;
  const count = Math.ceil((offset + new Date(year, month + 1, 0).getDate()) / 7) * 7;
  const days = Array.from({ length: count }, (_, index) => new Date(year, month, index - offset + 1, 12));

  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const anchor = trigger.current?.getBoundingClientRect();
      const panel = popup.current?.getBoundingClientRect();
      if (!anchor || !panel) return;
      const below = anchor.bottom + 8;
      const above = anchor.top - panel.height - 8;
      const preferred = below + panel.height <= window.innerHeight - 16 ? below : above >= 16 ? above : below;
      setPosition({ top: Math.max(16, Math.min(preferred, window.innerHeight - panel.height - 16)), left: Math.max(16, Math.min(anchor.left, window.innerWidth - panel.width - 16)), visibility: 'visible' });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open, year, month]);
  useEffect(() => { if (open) dayButtons.current.get(focusedKey)?.focus(); }, [open, focusedKey, position.visibility]);

  const close = () => { setOpen(false); trigger.current?.focus(); };
  const select = date => { setValue(localDay(date)); close(); };
  const keyDown = (event, date) => {
    const amounts = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next;
    if (event.key in amounts) next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + amounts[event.key], 12);
    if (event.key === 'Home') next = new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getDay() + 6) % 7, 12);
    if (event.key === 'End') next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 6 - (date.getDay() + 6) % 7, 12);
    if (event.key === 'PageUp') next = moveMonth(date, -1);
    if (event.key === 'PageDown') next = moveMonth(date, 1);
    if (next) { event.preventDefault(); event.stopPropagation(); setFocusedDate(next); }
  };

  return <div className="field date-picker" ref={root} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); }
  }}>
    <span id={id + '-label'}>{label}</span>
    <input name={name} type="hidden" value={value}/>
    <button ref={trigger} type="button" className="date-picker-trigger" aria-labelledby={id + '-label ' + id + '-value'} aria-expanded={open} aria-haspopup="dialog" aria-controls={open ? id + '-calendar' : undefined} onClick={() => {
      if (open) close(); else { setFocusedDate(parseDate(value) || new Date()); setOpen(true); }
    }}><span id={id + '-value'}>{formatDate(selected)}</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16"/></svg></button>
    {open && <section ref={popup} style={position} className="date-picker-popover" id={id + '-calendar'} role="dialog" aria-label={'Elegir ' + label.toLowerCase()}>
      <div className="date-picker-heading">
        <button type="button" className="icon-button" aria-label="Mes anterior" onClick={() => setFocusedDate(moveMonth(focusedDate, -1))}>‹</button>
        <div className="date-picker-month"><select aria-label="Mes" value={month} onChange={event => setFocusedDate(moveMonth(focusedDate, Number(event.target.value) - month))}>{months.map((name, index) => <option value={index} key={name}>{name}</option>)}</select><select aria-label="Año" value={year} onChange={event => setFocusedDate(moveMonth(focusedDate, (Number(event.target.value) - year) * 12))}>{Array.from({ length: 21 }, (_, index) => year - 10 + index).map(value => <option key={value}>{value}</option>)}</select></div>
        <button type="button" className="icon-button" aria-label="Mes siguiente" onClick={() => setFocusedDate(moveMonth(focusedDate, 1))}>›</button>
      </div>
      <div className="date-picker-weekdays" aria-hidden="true">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
      <div className="date-picker-days" role="group" aria-label={months[month] + ' de ' + year}>
        {days.map(date => {
          const key = localDay(date);
          return <button key={key} ref={element => { if (element) dayButtons.current.set(key, element); else dayButtons.current.delete(key); }} type="button" tabIndex={key === focusedKey ? 0 : -1} className={'date-picker-day' + (date.getMonth() !== month ? ' is-outside' : '') + (key === value ? ' is-selected' : '') + (key === today ? ' is-today' : '')} aria-label={formatDate(date)} aria-pressed={key === value} aria-current={key === today ? 'date' : undefined} onKeyDown={event => keyDown(event, date)} onClick={() => select(date)}>{date.getDate()}</button>;
        })}
      </div>
      <div className="date-picker-footer"><button type="button" onClick={() => select(new Date())}>Hoy</button><button type="button" onClick={close}>Cerrar calendario</button></div>
    </section>}
  </div>;
}
