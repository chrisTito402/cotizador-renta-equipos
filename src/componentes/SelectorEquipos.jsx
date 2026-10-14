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
// VERSIÓN FALSA: solo muestra las líneas como texto.
export default function SelectorEquipos({ equipos = [], lineas = [], onChange }) {
  return (
    <ul>
      {lineas.map((l, i) => (
        <li key={i}>{l.equipoId || '(sin equipo)'} × {l.cantidad}</li>
      ))}
    </ul>
  );
}
