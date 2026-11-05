// DUEÑO: Cris · RAMA: feature/fechas-por-equipo
// Selector − 1 + para la cantidad de unidades (entero de 1 a MAX_CANTIDAD).
//   <SelectorCantidad valor={2} onChange={(n) => ...} etiqueta="Cantidad de Montacargas" />
import { MAX_CANTIDAD } from '../constantes.js';

export default function SelectorCantidad({ valor, onChange, etiqueta = 'Cantidad' }) {
  const numero = Number(valor) || 1;
  // parseInt quita decimales ("1.5" → 1); si no es número se queda en 1
  const fijar = (n) => onChange(Math.min(MAX_CANTIDAD, Math.max(1, Number.parseInt(n, 10) || 1)));

  return (
    <div className="selector-cantidad">
      <button type="button" onClick={() => fijar(numero - 1)} disabled={numero <= 1} aria-label="Quitar una unidad">−</button>
      <input
        type="number"
        min="1"
        max={MAX_CANTIDAD}
        step="1"
        value={valor}
        aria-label={etiqueta}
        onChange={(e) => fijar(e.target.value)}
      />
      <button type="button" onClick={() => fijar(numero + 1)} disabled={numero >= MAX_CANTIDAD} aria-label="Agregar una unidad">+</button>
    </div>
  );
}
