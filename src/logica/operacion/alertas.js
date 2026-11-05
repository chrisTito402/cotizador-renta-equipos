export const ALERT_KINDS = {
  documentos: 'Documentos', entregas: 'Entregas', rentas: 'Rentas',
  recolecciones: 'Recolecciones', revision: 'Revisión de devolución',
  fallas: 'Fallas', mantenimiento: 'Mantenimiento',
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ZONE = 'America/Hermosillo';
const priorities = { alta: 0, media: 1, baja: 2 };
const stamp = value => {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : null;
};
const validDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && stamp(value + 'T00:00:00-07:00') !== null;
export function businessDay(date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function daysBetween(day, today) {
  return validDay(day) ? (Date.parse(day + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / DAY : null;
}
// Older records store only a date. For those, the reminder starts the next day.
function activityTime(record, events, eventText) {
  if (!validDay(record?.date)) return null;
  const recordedAt = stamp(record.at);
  if (recordedAt !== null && businessDay(new Date(recordedAt)) === record.date) return recordedAt;
  const eventAt = [...(events || [])].reverse().find(event => event.text === eventText && stamp(event.at) !== null);
  if (eventAt && businessDay(new Date(eventAt.at)) === record.date) return stamp(eventAt.at);
  return stamp(record.date + 'T00:00:00-07:00');
}

export function buildAlerts(data, now = new Date()) {
  const nowTime = now.getTime();
  const today = businessDay(now);
  const alerts = [];
  const units = new Map(data.units.map(unit => [unit.id, unit]));
  for (const rental of data.rentals) {
    const unit = units.get(rental.unit);
    if (!unit) continue;
    const add = (kind, suffix, priority, title, detail, action, label, date, dueAt = null, tab = 'resumen') => {
      alerts.push({ id: `${rental.id}-${suffix}`, kind, priority, title, detail, action, label, date,
        dueAt, tab, rentalId: rental.id, unitId: unit.id, unitName: unit.name, client: rental.client });
    };
    const delivered = activityTime(rental.delivery, rental.events, 'Entrega registrada. Equipo en renta');
    const deliveryAge = delivered === null ? null : nowTime - delivered;
    const hasDocument = !!(rental.document || rental.documentPhoto);
    if (['En renta', 'En revisión', 'Cerrada'].includes(rental.status) && deliveryAge !== null && deliveryAge >= DAY && !hasDocument) {
      add('documentos', 'responsiva', 'alta', 'Falta adjuntar la responsiva',
        'La entrega está registrada y todavía no se ha adjuntado la hoja.', 'photo', 'Adjuntar responsiva', rental.delivery.date, delivered + DAY, 'documentos');
    } else if (rental.status === 'En renta' && hasDocument && !rental.signature && deliveryAge !== null && deliveryAge >= DAY) {
      add('documentos', 'firma', 'media', 'Confirmar recepción de la hoja firmada',
        'El documento está guardado. Falta registrar si recibiste la hoja firmada.', 'signature', 'Registrar recepción', rental.delivery.date, delivered + DAY);
    }

    if (['Apartado', 'En preparación'].includes(rental.status)) {
      const remaining = daysBetween(rental.start, today);
      if (remaining !== null && remaining <= 1) {
        const ready = rental.status === 'En preparación' && rental.ready;
        add('entregas', 'entrega', remaining < 0 ? 'alta' : 'media',
          ready ? 'Entrega pendiente de registrar' : 'Preparación pendiente',
          remaining < 0 ? 'La fecha prevista ya pasó. Revisa qué ocurrió con esta entrega.' : remaining === 0 ? 'La entrega está prevista para hoy.' : 'La entrega está prevista para mañana.',
          ready ? 'deliver' : 'prepare', ready ? 'Registrar entrega' : 'Registrar preparación', rental.start, stamp(rental.start + 'T00:00:00-07:00'));
      }
    }

    if (rental.status === 'En renta' && !rental.return) {
      const remaining = daysBetween(rental.end, today);
      if (remaining !== null && remaining <= 3) {
        const title = remaining < 0 ? 'Renta vencida sin devolución registrada' : remaining === 0 ? 'La renta vence hoy' : remaining === 1 ? 'La renta vence mañana' : 'Renta próxima a vencer';
        const collectionPending = !rental.collection;
        add('rentas', 'vencimiento', remaining < 0 ? 'alta' : 'media', title,
          collectionPending ? 'Revisa la fecha de regreso y registra la recolección cuando la acuerdes.' : 'Consulta el regreso previsto y la recolección acordada.',
          collectionPending ? 'collection' : null, collectionPending ? 'Registrar recolección' : 'Ver renta', rental.end, stamp(rental.end + 'T23:59:59-07:00'));
      }
      if (validDay(rental.collection?.date)) {
        const collection = rental.collection;
        const hasTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(collection.time || '');
        const due = stamp(`${collection.date}T${hasTime ? collection.time : '23:59'}:00-07:00`);
        if (due <= nowTime + DAY) {
          const past = due < nowTime;
          add('recolecciones', 'recoleccion', past ? 'alta' : 'media', past ? 'Revisar recolección pendiente' : 'Recolección próxima',
            past ? 'La fecha acordada pasó y no hay devolución registrada. Confirma si el equipo ya regresó.' : 'Revisa la fecha, el contacto y las indicaciones acordadas.',
            null, 'Ver recolección', collection.date, due);
        }
      }
      const issueTimes = (rental.issues || []).map(issue => stamp(issue.at)).filter(time => time !== null);
      const latestIssue = issueTimes.length ? Math.max(...issueTimes) : null;
      const reviewedAfter = latestIssue !== null && (rental.reviews || []).some(review => stamp(review.at) !== null && stamp(review.at) >= latestIssue);
      if ((rental.issues || []).length && !reviewedAfter) {
        add('fallas', 'falla', 'alta', 'Falla sin revisión registrada',
          'Hay una falla reportada. Registra lo que informe el mecánico cuando la revise.', 'review', 'Registrar revisión', latestIssue === null ? null : businessDay(new Date(latestIssue)), latestIssue);
      }
    }

    if (rental.status === 'En revisión') {
      const returned = activityTime(rental.return, rental.events, 'Devolución registrada. Equipo en revisión');
      if (returned !== null && nowTime - returned >= DAY) {
        add('revision', 'revision', 'media', 'Revisión de devolución pendiente',
          'El equipo ya regresó. Falta registrar el resultado de la revisión del mecánico.', 'close', 'Registrar estado final', rental.return.date, returned + DAY);
      }
    }
  }
  for (const unit of data.units) {
    if (unit.state !== 'En mantenimiento') continue;
    const started = stamp(unit.maintenanceStartedAt);
    alerts.push({ id: `${unit.id}-mantenimiento`, kind: 'mantenimiento', priority: 'baja',
      title: 'Equipo pendiente de atención en taller', detail: 'Consulta el equipo y el seguimiento con el mecánico.',
      label: 'Ver equipo', unitId: unit.id, unitName: unit.name, dueAt: started,
      date: started === null ? null : businessDay(new Date(started)), action: 'equipment' });
  }
  return alerts.sort((a, b) => priorities[a.priority] - priorities[b.priority] || (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity) || a.id.localeCompare(b.id));
}
