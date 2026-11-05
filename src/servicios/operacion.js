// Única capa que sabe dónde se guardan los datos operativos (unidades físicas y rentas).
// Las pantallas de /operacion pasan por aquí; la lógica pura vive en src/logica/operacion/.
import { STORAGE_KEY, initialData, loadData } from '../logica/operacion/operaciones.js';
import { createReservation, reservedQuoteIds } from '../logica/operacion/apartados.js';
import { obtenerCotizaciones, obtenerCotizacion } from './almacen.js';
import { ESTADOS } from '../constantes.js';

const CLAVE_ACEPTACIONES = 'cotizador:aceptaciones-simuladas';

export function cargarOperacion() {
  return loadData(window.localStorage);
}

// Lanza un Error si el navegador no permite guardar (por ejemplo, sin espacio para una foto).
export function guardarOperacion(data) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function reiniciarOperacion() {
  const data = initialData();
  guardarOperacion(data);
  return data;
}

function leerAceptaciones() {
  try {
    const lista = JSON.parse(window.localStorage.getItem(CLAVE_ACEPTACIONES) || '[]');
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

// Cotizaciones vistas desde Operación: aceptada = Aprobada en Comercial o aceptación simulada.
export function cotizacionesParaApartar(data) {
  const aceptaciones = leerAceptaciones();
  const apartadas = reservedQuoteIds(data);
  return obtenerCotizaciones()
    .filter((c) => c.estado !== ESTADOS.RECHAZADA)
    .map((c) => ({
      ...c,
      aceptada: c.estado === ESTADOS.APROBADA || aceptaciones.includes(c.id),
      apartada: apartadas.has(c.id),
      rentas: data.rentals.filter((r) => r.commercial === c.id),
    }));
}

// La cotización no se modifica: la aceptación simulada se guarda aparte (no hay respuesta real del cliente).
export function registrarAceptacionSimulada(cotizacionId) {
  const cotizacion = obtenerCotizacion(cotizacionId);
  if (!cotizacion) throw new Error(`No existe la cotización ${cotizacionId}.`);
  if (cotizacion.estado !== ESTADOS.PENDIENTE) throw new Error('Solo se simula la aceptación de cotizaciones pendientes.');
  const aceptaciones = leerAceptaciones();
  if (!aceptaciones.includes(cotizacionId)) {
    window.localStorage.setItem(CLAVE_ACEPTACIONES, JSON.stringify([...aceptaciones, cotizacionId]));
  }
}

// Datos para utilidades/generarDocumentoCobro.js. El cobro es por cotización (puede abarcar varias unidades).
// Regresa null si la renta no viene de una cotización existente (p. ej. datos de demostración).
export function datosDocumentoCobro(data, rental) {
  const cotizacion = obtenerCotizacion(rental.commercial);
  if (!cotizacion) return null;
  const rentas = data.rentals.filter((r) => r.commercial === cotizacion.id);
  const equipos = rentas.map((r) => {
    const unidad = data.units.find((u) => u.id === r.unit);
    return { nombre: unidad?.name, modelo: `${unidad?.model || ''} · Unidad ${r.unit}`, cantidad: 1 };
  });
  return {
    id: rentas.map((r) => r.id).join(', '),
    cotizacionId: cotizacion.id,
    cliente: cotizacion.cliente,
    municipio: cotizacion.cliente?.municipio,
    fechaInicio: cotizacion.fechaInicio,
    fechaFin: cotizacion.fechaFin,
    equipos,
    montoCotizado: cotizacion.desglose?.total ?? null,
  };
}

// Regresa { data, rentals } con el nuevo estado ya guardado.
export function crearApartado(data, cotizacionId) {
  const cotizacion = cotizacionesParaApartar(data).find((c) => c.id === cotizacionId);
  if (!cotizacion) throw new Error(`No existe la cotización ${cotizacionId}.`);
  if (!cotizacion.aceptada) throw new Error('Simula o confirma la aceptación antes de crear el apartado.');
  const resultado = createReservation(data, obtenerCotizacion(cotizacionId));
  guardarOperacion(resultado.data);
  return resultado;
}
