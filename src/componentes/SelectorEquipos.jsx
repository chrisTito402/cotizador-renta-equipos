// ============================================================
// DUEÑA: Katia  ·  RAMA: feature/formulario-cliente
// (va en la misma rama que el formulario porque Cris lo necesita
//  para "Modificar cotización" desde el miércoles en la noche)
// Nadie más edita este archivo. Los demás solo lo importan.
// ============================================================
//
// Uso (panel y modificar):
//
//   const equipos = obtenerEquipos();   // servicios/almacen.js
//   const [lineas, setLineas] = useState([{ equipoId: '', cantidad: 1 }]);
//   <SelectorEquipos equipos={equipos} lineas={lineas} onChange={setLineas} />
//
// Props:
//   equipos:  lista que regresa obtenerEquipos()
//   lineas:   [{ equipoId, cantidad }]
//   onChange: recibe la lista completa de líneas actualizada
//
// Permite elegir equipo, cambiar cantidad (entero de 1 a MAX_CANTIDAD), agregar y quitar líneas.
// Un equipo no se puede elegir en dos filas.
import { pesos } from '../utilidades/formato.js';
import './selectorEquipos.css';

export const MAX_CANTIDAD = 20;

export default function SelectorEquipos({ equipos = [], lineas = [], onChange }) {
  const cambiarLinea = (i, campo, valor) => {
    const nuevas = lineas.map((l, j) => (j === i ? { ...l, [campo]: valor } : l));
    onChange(nuevas);
  };

  // parseInt quita decimales ("1.5" → 1); si no es número se queda en 1
  const cambiarCantidad = (i, texto) => {
    const numero = parseInt(texto, 10) || 1;
    cambiarLinea(i, 'cantidad', Math.min(MAX_CANTIDAD, Math.max(1, numero)));
  };

  const agregarLinea = () => {
    onChange([...lineas, { equipoId: '', cantidad: 1 }]);
  };

  const quitarLinea = (i) => {
    onChange(lineas.filter((l, j) => j !== i));
  };

  const totalDisponibles = equipos.filter((eq) => eq.disponible).length;

  return (
    <div className="selector-equipos">
      {lineas.map((l, i) => (
        <div key={i} className="fila-equipo">
          <label className="campo-equipo">Equipo
            <select value={l.equipoId} onChange={(e) => cambiarLinea(i, 'equipoId', e.target.value)}>
              <option value="">Selecciona…</option>
              {equipos.map((eq) => (
                <option
                  key={eq.id}
                  value={eq.id}
                  disabled={!eq.disponible || lineas.some((otra, j) => j !== i && otra.equipoId === eq.id)}
                >
                  {eq.nombre} · {pesos(eq.precioPorDia)}/día{eq.disponible ? '' : ' (no disponible)'}
                </option>
              ))}
            </select>
          </label>
          <label className="campo-cantidad">Cantidad
            <input
              type="number"
              min="1"
              max={MAX_CANTIDAD}
              step="1"
              value={l.cantidad}
              onChange={(e) => cambiarCantidad(i, e.target.value)}
            />
          </label>
          <button type="button" className="boton-quitar" onClick={() => quitarLinea(i)} disabled={lineas.length === 1}>
            Quitar
          </button>
        </div>
      ))}
      <button
        type="button"
        className="boton-agregar"
        onClick={agregarLinea}
        disabled={lineas.length >= totalDisponibles}
      >
        + Agregar equipo
      </button>
    </div>
  );
}
