export const pesos = (n) =>
  (Number(n) || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

// '2026-10-14' → '14/10/2026'
export const fechaCorta = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');
