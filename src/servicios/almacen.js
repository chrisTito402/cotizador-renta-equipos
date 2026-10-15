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
  const { lineasValidas, desglose } = validarYCalcular({ cliente, lineas, fechaInicio, fechaFin });
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
// ============================================================
export function modificarCotizacion(id, cambios) {
  const lista = leer();
  const indice = lista.findIndex((c) => c.id === id);
  if (indice === -1) throw new Error(`No existe la cotización ${id}`);
  const actual = lista[indice];
  if (actual.estado !== ESTADOS.PENDIENTE) throw new Error('Solo se pueden modificar cotizaciones pendientes');

  const { cliente, lineas, fechaInicio, fechaFin } = { ...actual, ...cambios };
  const { lineasValidas, desglose } = validarYCalcular({ cliente, lineas, fechaInicio, fechaFin });
  // id, origen, estado y fechaCreacion no cambian
  const actualizada = { ...actual, cliente, lineas: lineasValidas, fechaInicio, fechaFin, desglose };
  lista[indice] = actualizada;
  escribir(lista);
  return actualizada;
}

// Validaciones compartidas por guardar y modificar. Lanza Error; si es el cliente, trae .errores por campo.
function validarYCalcular({ cliente, lineas, fechaInicio, fechaFin }) {
  const lineasValidas = (lineas || []).filter((l) => l.equipoId);
  if (lineasValidas.length === 0) throw new Error('Selecciona al menos un equipo');

  const validacion = validarCliente(cliente || {});
  if (!validacion.valido) {
    const error = new Error('Revisa los datos del cliente');
    error.errores = validacion.errores;
    throw error;
  }

  const desglose = calcularCotizacion({ lineas: lineasValidas, fechaInicio, fechaFin, municipio: cliente.municipio });
  return { lineasValidas, desglose };
}

export function reiniciarDatos() {
  escribir(COTIZACIONES_SEMILLA);
}

// ---------- Mi cotización (carrito del cliente web) ----------
// El cliente junta varios equipos antes de pedir la cotización.
// Forma: { lineas: [{ equipoId, cantidad }], fechaInicio: 'AAAA-MM-DD' | '', fechaFin: 'AAAA-MM-DD' | '' }
// Las fechas son UNA sola para toda la cotización.
// Cada cambio avisa con el evento 'carrito' en window (lo usa el encabezado para el contador).
const CLAVE_CARRITO = 'cotizador:carrito';
const CARRITO_VACIO = { lineas: [], fechaInicio: '', fechaFin: '' };

export function obtenerCarrito() {
  try {
    const guardado = localStorage.getItem(CLAVE_CARRITO);
    if (guardado) return { ...CARRITO_VACIO, ...JSON.parse(guardado) };
  } catch (e) { /* si está dañado, se regresa vacío */ }
  return structuredClone(CARRITO_VACIO);
}
function guardarCarrito(carrito) {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  window.dispatchEvent(new Event('carrito'));
  return carrito;
}

// Si el equipo ya está, suma la cantidad. Si vienen fechas, se vuelven las fechas de la cotización.
export function agregarAlCarrito({ equipoId, cantidad = 1, fechaInicio, fechaFin }) {
  if (!obtenerEquipo(equipoId)) throw new Error(`No existe el equipo ${equipoId}`);
  const carrito = obtenerCarrito();
  const existente = carrito.lineas.find((l) => l.equipoId === equipoId);
  if (existente) existente.cantidad += Number(cantidad);
  else carrito.lineas.push({ equipoId, cantidad: Number(cantidad) });
  if (fechaInicio) carrito.fechaInicio = fechaInicio;
  if (fechaFin) carrito.fechaFin = fechaFin;
  return guardarCarrito(carrito);
}

// cambios: { lineas?, fechaInicio?, fechaFin? }  (lo que no venga se queda igual)
export function actualizarCarrito(cambios) {
  return guardarCarrito({ ...obtenerCarrito(), ...cambios });
}

export function quitarDelCarrito(equipoId) {
  const carrito = obtenerCarrito();
  carrito.lineas = carrito.lineas.filter((l) => l.equipoId !== equipoId);
  return guardarCarrito(carrito);
}

// Llamarla después de guardarCotizacion({ origen: 'web', ... }) cuando sí se guardó.
export function vaciarCarrito() {
  return guardarCarrito(structuredClone(CARRITO_VACIO));
}
