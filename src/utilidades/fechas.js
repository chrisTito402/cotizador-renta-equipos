// Fechas como texto 'AAAA-MM-DD' (lo que da un <input type="date">).
// Como texto se pueden comparar directo: '2026-10-12' < '2026-10-15'.

const dosDigitos = (n) => String(n).padStart(2, '0');

// Date (hora local) → 'AAAA-MM-DD'
export const aTexto = (d) => `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;

// 'AAAA-MM-DD' → Date a medio día local (así un cambio de horario no la mueve de día)
export function desdeTexto(texto) {
  const [anio, mes, dia] = texto.split('-').map(Number);
  return new Date(anio, mes - 1, dia, 12);
}

// Hoy en hora local (toISOString usa UTC y en la tarde ya da mañana)
export const hoyLocal = () => aTexto(new Date());

export function sumarDias(texto, dias) {
  const d = desdeTexto(texto);
  d.setDate(d.getDate() + dias);
  return aTexto(d);
}

// Días de renta: se cuentan inicio y fin (del 12 al 15 son 4)
export const diasEntre = (inicio, fin) => Math.round((desdeTexto(fin) - desdeTexto(inicio)) / 86400000) + 1;
