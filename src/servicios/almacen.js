// Única capa que sabe DÓNDE se guardan los datos. Hoy: arreglo en memoria + localStorage.
// Cuando haya backend, solo cambia este archivo (por llamadas fetch); las pantallas siguen igual.
// Las pantallas NUNCA usan localStorage directo: siempre pasan por aquí.
import { EQUIPOS } from '../datos/equipos.js';
import { COTIZACIONES_SEMILLA } from '../datos/cotizacionesSemilla.js';
import { ESTADOS, ORIGENES, MAX_NOTAS } from '../constantes.js';
import { calcularCotizacion } from '../logica/calcularCotizacion.js';
import { validarCliente } from '../logica/validarCliente.js';
import { validarLinea } from '../logica/disponibilidad.js';
import { hoyLocal } from '../utilidades/fechas.js';

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

// ---------- Líneas ----------
// Una línea: { id, equipoId, cantidad, fechaInicio, fechaFin }. Cada línea trae SUS fechas,
// así el mismo equipo puede ir dos veces en fechas distintas. El id distingue cuál es cuál.
let contadorLineas = 0;
export const nuevoIdLinea = () => `L-${Date.now().toString(36)}-${(contadorLineas++).toString(36)}`;

const mismaLinea = (a, b) => a.equipoId === b.equipoId && a.fechaInicio === b.fechaInicio && a.fechaFin === b.fechaFin;

// Mismo equipo + mismas fechas = una sola línea: se suma la cantidad y se queda el id de la primera.
export function juntarLineas(lineas) {
  return lineas.reduce((juntas, linea) => {
    const igual = juntas.find((j) => mismaLinea(j, linea));
    if (igual) igual.cantidad += Number(linea.cantidad);
    else juntas.push({ ...linea, cantidad: Number(linea.cantidad) });
    return juntas;
  }, []);
}

// Para avisar en pantalla antes de guardar: '' si la línea está bien, o el mensaje.
// Revisa cantidad, fechas pasadas y días ocupados (cotizaciones aprobadas).
export const revisarLinea = (linea) => validarLinea(linea, { cotizaciones: leer(), hoy: hoyLocal() });

function lanzarSiHayProblema(linea, cotizaciones) {
  const problema = validarLinea(linea, { cotizaciones, hoy: hoyLocal() });
  if (problema) {
    const error = new Error(problema);
    error.lineaId = linea.id; // para que la pantalla marque la línea
    throw error;
  }
}

// ---------- Cotizaciones ----------
export const obtenerCotizaciones = () => leer().slice().reverse(); // la más nueva primero
export const obtenerCotizacion = (id) => leer().find((c) => c.id === id) || null;

// datos: { origen: 'web' | 'panel', cliente, lineas, notas? }
// Valida, recalcula los costos (no confía en los que trae la pantalla) y guarda como "Pendiente".
// Lanza un Error si algo está mal; si es el cliente, el error trae .errores por campo;
// si es una línea, trae .lineaId.
export function guardarCotizacion({ origen, cliente, lineas, notas, fechaInicio, fechaFin }) {
  if (!Object.values(ORIGENES).includes(origen)) throw new Error('origen debe ser "web" o "panel"');
  const lista = leer();
  const validos = validarYCalcular({ cliente, lineas, notas, fechaInicio, fechaFin }, lista);
  const nueva = {
    id: `COT-${String(lista.length + 1).padStart(4, '0')}`,
    origen,
    estado: ESTADOS.PENDIENTE,
    fechaCreacion: new Date().toISOString(),
    cliente,
    ...validos,
  };
  escribir([...lista, nueva]);
  return nueva;
}

// ============================================================
// DUEÑO: Cris · RAMA: feature/cotizacion-web
// modificarCotizacion(id, cambios)
//   cambios: { cliente?, lineas?, notas? }  (lo que no venga se queda igual)
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

  const datos = { ...actual, ...cambios };
  const validos = validarYCalcular(datos, lista);
  // id, origen, estado y fechaCreacion no cambian
  const actualizada = { ...actual, cliente: datos.cliente, ...validos };
  lista[indice] = actualizada;
  escribir(lista);
  return actualizada;
}

// Validaciones compartidas por guardar y modificar. Lanza Error (ver guardarCotizacion).
// fechaInicio/fechaFin generales solo rellenan líneas viejas que no traen fechas.
// Regresa { lineas, notas, fechaInicio, fechaFin, desglose }; las fechas generales
// son la primera y la última de las líneas (las usan la lista del admin y el catálogo).
function validarYCalcular({ cliente, lineas, notas, fechaInicio, fechaFin }, cotizaciones) {
  const conEquipo = (lineas || []).filter((l) => l.equipoId);
  if (conEquipo.length === 0) throw new Error('Selecciona al menos un equipo');

  const validacion = validarCliente(cliente || {});
  if (!validacion.valido) {
    const error = new Error('Revisa los datos del cliente');
    error.errores = validacion.errores;
    throw error;
  }

  const lineasValidas = juntarLineas(conEquipo.map((l) => ({
    id: l.id || nuevoIdLinea(),
    equipoId: l.equipoId,
    cantidad: Number(l.cantidad),
    fechaInicio: l.fechaInicio || fechaInicio || '',
    fechaFin: l.fechaFin || fechaFin || '',
  })));
  lineasValidas.forEach((l) => lanzarSiHayProblema(l, cotizaciones));

  const notasLimpias = (notas || '').trim();
  if (notasLimpias.length > MAX_NOTAS) throw new Error(`Las notas no pueden pasar de ${MAX_NOTAS} caracteres`);

  const primera = lineasValidas.reduce((min, l) => (l.fechaInicio < min ? l.fechaInicio : min), lineasValidas[0].fechaInicio);
  const ultima = lineasValidas.reduce((max, l) => (l.fechaFin > max ? l.fechaFin : max), lineasValidas[0].fechaFin);

  return {
    lineas: lineasValidas,
    notas: notasLimpias,
    fechaInicio: primera,
    fechaFin: ultima,
    desglose: calcularCotizacion({ lineas: lineasValidas, municipio: cliente.municipio }),
  };
}

export function reiniciarDatos() {
  escribir(COTIZACIONES_SEMILLA);
}

// ---------- Mi cotización (carrito del cliente web) ----------
// El cliente junta varios equipos antes de pedir la cotización.
// Forma: { lineas: [{ id, equipoId, cantidad, fechaInicio, fechaFin }] }
// Cada equipo trae sus fechas (se eligen en el detalle). Mismo equipo + mismas fechas = una línea.
// Cada cambio avisa con el evento 'carrito' en window (lo usa el encabezado para el contador).
const CLAVE_CARRITO = 'cotizador:carrito';
const CARRITO_VACIO = { lineas: [] };

export function obtenerCarrito() {
  try {
    const guardado = localStorage.getItem(CLAVE_CARRITO);
    if (guardado) return normalizarCarrito(JSON.parse(guardado));
  } catch (e) { /* si está dañado, se regresa vacío */ }
  return structuredClone(CARRITO_VACIO);
}

// Carritos de antes (una sola fecha para todo y líneas sin id): cada línea toma
// las fechas generales y un id, y se guarda así para que el id no cambie.
function normalizarCarrito({ lineas = [], fechaInicio = '', fechaFin = '' }) {
  if (lineas.every((l) => l.id) && !fechaInicio && !fechaFin) return { lineas };
  const carrito = {
    lineas: lineas.map((l) => ({
      ...l,
      id: l.id || nuevoIdLinea(),
      fechaInicio: l.fechaInicio || fechaInicio,
      fechaFin: l.fechaFin || fechaFin,
    })),
  };
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  return carrito;
}

function guardarCarrito(carrito) {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  window.dispatchEvent(new Event('carrito'));
  return carrito;
}

// Valida la línea que quedó después del cambio (ya junta con su gemela, si la hay) y guarda.
function guardarLineasCarrito(lineas, cambiada) {
  const juntas = juntarLineas(lineas);
  lanzarSiHayProblema(juntas.find((l) => mismaLinea(l, cambiada)), leer());
  return guardarCarrito({ lineas: juntas });
}

// Si ya está el mismo equipo con las mismas fechas, suma la cantidad. Lanza Error si algo está mal.
export function agregarAlCarrito({ equipoId, cantidad = 1, fechaInicio, fechaFin }) {
  const nueva = { id: nuevoIdLinea(), equipoId, cantidad: Number(cantidad), fechaInicio, fechaFin };
  return guardarLineasCarrito([...obtenerCarrito().lineas, nueva], nueva);
}

// cambios: { cantidad?, fechaInicio?, fechaFin? } de la línea con ese id. Lanza Error si algo está mal.
export function actualizarLineaCarrito(idLinea, cambios) {
  const lineas = obtenerCarrito().lineas.map((l) => (l.id === idLinea ? { ...l, ...cambios } : l));
  const cambiada = lineas.find((l) => l.id === idLinea);
  if (!cambiada) throw new Error('Ese equipo ya no está en tu cotización');
  return guardarLineasCarrito(lineas, cambiada);
}

export function quitarDelCarrito(idLinea) {
  const carrito = obtenerCarrito();
  carrito.lineas = carrito.lineas.filter((l) => l.id !== idLinea);
  return guardarCarrito(carrito);
}

// Llamarla después de guardarCotizacion({ origen: 'web', ... }) cuando sí se guardó.
export function vaciarCarrito() {
  return guardarCarrito(structuredClone(CARRITO_VACIO));
}
