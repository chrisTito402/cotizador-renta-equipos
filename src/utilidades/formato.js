export const pesos = (n) =>
  (Number(n) || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

// '2026-10-14' → '14/10/2026'
export const fechaCorta = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// ('2026-10-12', '2026-10-15') → '12 – 15 de octubre'
// ('2026-10-30', '2026-11-02') → '30 de octubre – 2 de noviembre'
// Si cruza de año, lleva el año en las dos fechas.
export function rangoFechas(inicio, fin) {
  if (!inicio || !fin) return '';
  const [a1, m1, d1] = inicio.split('-').map(Number);
  const [a2, m2, d2] = fin.split('-').map(Number);
  const mes1 = MESES[m1 - 1];
  const mes2 = MESES[m2 - 1];
  if (a1 !== a2) return `${d1} de ${mes1} de ${a1} – ${d2} de ${mes2} de ${a2}`;
  if (m1 !== m2) return `${d1} de ${mes1} – ${d2} de ${mes2}`;
  if (d1 === d2) return `${d1} de ${mes1}`;
  return `${d1} – ${d2} de ${mes1}`;
}

export const textoDias = (dias) => (dias === 1 ? '1 día' : `${dias} días`);
