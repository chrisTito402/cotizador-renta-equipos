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
// Debe permitir: elegir equipo, cambiar cantidad (mínimo 1), agregar otra línea y quitar una línea.
//

export default function SelectorEquipos({ equipos = [], lineas = [], onChange }) {
  const cambiarLinea = (i, campo, valor) => {
    const nuevas = lineas.map((l, j) => (j === i ? { ...l, [campo]: valor } : l));
    onChange(nuevas);
  };

  const agregarLinea = () => {
    onChange([...lineas, { equipoId: '', cantidad: 1 }]);
  };

  const quitarLinea = (i) => {
    onChange(lineas.filter((l, j) => j !== i));
  };

  return (
    <div>
      {lineas.map((l, i) => (
        <div key={i} className="linea-equipo">
          <select value={l.equipoId} onChange={(e) => cambiarLinea(i, 'equipoId', e.target.value)}>
            <option value="">Selecciona...</option>
            {equipos.map((eq) => (
              <option
                key={eq.id}
                value={eq.id}
                disabled={!eq.disponible || lineas.some((otra, j) => j !== i && otra.equipoId === eq.id)}
              >
                {eq.nombre} · ${eq.precioPorDia}/día{eq.disponible ? '' : ' (no disponible)'}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={l.cantidad}
            onChange={(e) => cambiarLinea(i, 'cantidad', Math.max(1, Number(e.target.value) || 1))}
          />
          <button type="button" onClick={() => quitarLinea(i)} disabled={lineas.length === 1}>
            Quitar
          </button>
        </div>
      ))}
      <button type="button" onClick={agregarLinea}>+ Agregar equipo</button>
    </div>
  );
}
