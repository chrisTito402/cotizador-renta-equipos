// ============================================================
// DUEÑA: Katia  ·  RAMA: feature/formulario-cliente
// (fechas por equipo: rama feature/fechas-por-equipo, con aviso en el grupo)
// Nadie más edita este archivo. Los demás solo lo importan.
// ============================================================
//
// Uso (panel y modificar):
//
//   const equipos = obtenerEquipos();   // servicios/almacen.js
//   const [lineas, setLineas] = useState([lineaVacia()]);
//   <SelectorEquipos equipos={equipos} lineas={lineas} onChange={setLineas} />
//
// Props:
//   equipos:    lista que regresa obtenerEquipos()
//   lineas:     [{ id, equipoId, cantidad, fechaInicio, fechaFin }]  (cada equipo con SUS fechas)
//   onChange:   recibe la lista completa de líneas actualizada
//   errorLinea: (opcional) { id, mensaje } para marcar la línea que no se pudo guardar
//
// Cada línea es una tarjeta (LineaCotizacion). "Cambiar" abre su calendario con los días
// ocupados de ese equipo; así, si hay dos del mismo equipo en fechas distintas, se elige cuál.
// El mismo equipo puede ir en dos líneas si las fechas son distintas; con las mismas fechas se juntan.
// Cantidad: entero de 1 a MAX_CANTIDAD (constantes.js).
import { useState } from 'react';
import LineaCotizacion from './LineaCotizacion.jsx';
import { juntarLineas, nuevoIdLinea } from '../servicios/almacen.js';
import './selectorEquipos.css';

export const lineaVacia = () => ({ id: nuevoIdLinea(), equipoId: '', cantidad: 1, fechaInicio: '', fechaFin: '' });

export default function SelectorEquipos({ equipos = [], lineas = [], onChange, errorLinea = null }) {
  // Una línea nueva (sin equipo) arranca abierta
  const [abierta, setAbierta] = useState(() => lineas.find((l) => !l.equipoId)?.id ?? null);

  const guardarLinea = (linea) => {
    onChange(juntarLineas(lineas.map((l) => (l.id === linea.id ? linea : l))));
  };

  const quitarLinea = (id) => {
    onChange(lineas.filter((l) => l.id !== id));
  };

  // Si se cancela una línea que nunca tuvo equipo, se quita
  const cancelar = (id) => {
    setAbierta(null);
    if (lineas.some((l) => l.id === id && !l.equipoId)) quitarLinea(id);
  };

  const agregarLinea = () => {
    const nueva = lineaVacia();
    onChange([...lineas.filter((l) => l.equipoId), nueva]);
    setAbierta(nueva.id);
  };

  return (
    <div className="selector-equipos">
      {lineas.length === 0 && <p className="sutil">Todavía no hay equipos. Agrega uno.</p>}
      {lineas.map((l) => (
        <LineaCotizacion
          key={l.id}
          linea={l}
          equipos={equipos}
          abierta={abierta === l.id}
          onAbrir={() => setAbierta(l.id)}
          onCerrar={() => setAbierta(null)}
          onCancelar={() => cancelar(l.id)}
          onGuardar={guardarLinea}
          onQuitar={() => quitarLinea(l.id)}
          error={errorLinea?.id === l.id ? errorLinea.mensaje : ''}
        />
      ))}
      <button type="button" className="boton-agregar" onClick={agregarLinea} disabled={abierta !== null}>
        + Agregar equipo
      </button>
    </div>
  );
}
