// Única capa que sabe DÓNDE se guardan los datos. Hoy: arreglo en memoria + localStorage.
// Cuando haya backend, solo cambia este archivo (por llamadas fetch); las pantallas siguen igual.
// Las pantallas NUNCA usan localStorage directo: siempre pasan por aquí.
import { EQUIPOS } from '../datos/equipos.js';
import { COTIZACIONES_SEMILLA } from '../datos/cotizacionesSemilla.js';
import { ESTADOS, ORIGENES } from '../constantes.js';
import { calcularCotizacion } from '../logica/calcularCotizacion.js';
import { validarCliente } from '../logica/validarCliente.js';

const CLAVE = 'cotizador:cotizaciones';

function leer() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) return JSON.parse(guardado);
  } catch (e) { /* si está dañado, se reinicia abajo */ }
  escribir(COTIZACIONES_SEMILLA);
  return structuredClone(COTIZACIONES_SEMILLA);
}
function escribir(lista) {
  localStorage.setItem(CLAVE, JSON.stringify(lista));
}

// ---------- Equipos ----------
export const obtenerEquipos = () => EQUIPOS;
export const obtenerEquipo = (id) => EQUIPOS.find((e) => e.id === id) || null;

// ---------- Cotizaciones ----------
export const obtenerCotizaciones = () => leer().slice().reverse(); // la más nueva primero
export const obtenerCotizacion = (id) => leer().find((c) => c.id === id) || null;

// datos: { origen: 'web' | 'panel', cliente, lineas, fechaInicio, fechaFin }
// Valida, recalcula los costos (no confía en los que trae la pantalla) y guarda como "Pendiente".
// Lanza un Error si algo está mal; si es el cliente, el error trae .errores por campo.
export function guardarCotizacion({ origen, cliente, lineas, fechaInicio, fechaFin }) {
  if (!Object.values(ORIGENES).includes(origen)) throw new Error('origen debe ser "web" o "panel"');
  const lineasValidas = (lineas || []).filter((l) => l.equipoId);
  if (lineasValidas.length === 0) throw new Error('Selecciona al menos un equipo');

  const validacion = validarCliente(cliente || {});
  if (!validacion.valido) {
    const error = new Error('Revisa los datos del cliente');
    error.errores = validacion.errores;
    throw error;
  }

  const desglose = calcularCotizacion({ lineas: lineasValidas, fechaInicio, fechaFin, municipio: cliente.municipio });
  const lista = leer();
  const nueva = {
    id: `COT-${String(lista.length + 1).padStart(4, '0')}`,
    origen,
    estado: ESTADOS.PENDIENTE,
    fechaCreacion: new Date().toISOString(),
    cliente,
    lineas: lineasValidas,
    fechaInicio,
    fechaFin,
    desglose,
  };
  escribir([...lista, nueva]);
  return nueva;
}

// ============================================================
// DUEÑO: Cris · RAMA: feature/cotizacion-web
// modificarCotizacion(id, cambios)
//   cambios: { cliente?, lineas?, fechaInicio?, fechaFin? }  (lo que no venga se queda igual)
//   - Solo si estado === 'Pendiente'; si no, lanzar Error.
//   - Mismas validaciones que guardarCotizacion, recalcular desglose y guardar.
//   - Regresa la cotización actualizada.
// VERSIÓN FALSA: lanza error.
// ============================================================
export function modificarCotizacion(id, cambios) {
  throw new Error('Modificar cotización: pendiente (Cris)');
}

export function reiniciarDatos() {
  escribir(COTIZACIONES_SEMILLA);
}
