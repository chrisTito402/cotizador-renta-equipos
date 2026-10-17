import { obtenerCotizaciones, obtenerCotizacion, obtenerEquipo } from './almacen.js';

const CLAVE_APARTADOS = 'cotizador:apartados';
const CLAVE_ACEPTACIONES = 'cotizador:aceptaciones-simuladas';
const ESTADOS_RENTA = [
  'Apartado',
  'Preparación pendiente',
  'Listo para entrega',
  'Pendiente de confirmación',
  'Entregado',
  'En renta',
  'Pendiente de devolución',
  'Devuelto',
  'Cerrado',
];
const ESTADOS_CERRADOS_ENTREGA = ['Entregado', 'En renta', 'Pendiente de devolución', 'Devuelto', 'Cerrado'];
const DB_NOMBRE = 'cotizador-apartados';
const DB_VERSION = 2;
const DB_CARTAS = 'cartasFirmadas';
const CONDICIONES_EQUIPO = ['Excelente', 'Moderado', 'Bajo'];
export const EVENTO_APARTADOS_ACTUALIZADOS = 'apartados-actualizados';

function notificarApartadosActualizados() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENTO_APARTADOS_ACTUALIZADOS));
  }
}

function leerLista(clave, etiqueta) {
  try {
    const valor = localStorage.getItem(clave);
    if (!valor) return [];
    const lista = JSON.parse(valor);
    if (!Array.isArray(lista)) throw new Error('El contenido guardado no es una lista');
    return lista;
  } catch (error) {
    throw new Error(`No fue posible leer ${etiqueta} del almacenamiento local.`, { cause: error });
  }
}

function guardarLista(clave, lista, etiqueta) {
  try {
    localStorage.setItem(clave, JSON.stringify(lista));
    if (clave === CLAVE_APARTADOS) notificarApartadosActualizados();
  } catch (error) {
    throw new Error(`No fue posible guardar ${etiqueta} en este navegador.`, { cause: error });
  }
}

export function obtenerEstadosRenta() {
  return ESTADOS_RENTA.slice();
}

export function obtenerCotizacionesParaApartado() {
  const aceptaciones = leerLista(CLAVE_ACEPTACIONES, 'las aceptaciones simuladas');
  const apartados = leerLista(CLAVE_APARTADOS, 'los apartados');
  return obtenerCotizaciones().map((cotizacion) => {
    const aceptada = cotizacion.estado === 'Aprobada' || aceptaciones.includes(cotizacion.id);
    const apartado = apartados.find((item) => item.cotizacionId === cotizacion.id);
    const equipos = (cotizacion.lineas || []).map((linea) => ({
      equipoId: linea.equipoId,
      nombre: obtenerEquipo(linea.equipoId)?.nombre || `Equipo pendiente (${linea.equipoId})`,
    }));
    return { ...cotizacion, aceptada, apartadoId: apartado?.id || null, equipos };
  });
}

export function registrarAceptacionSimulada(cotizacionId) {
  const cotizacion = obtenerCotizacion(cotizacionId);
  if (!cotizacion) throw new Error(`No existe la cotización ${cotizacionId}.`);
  if (cotizacion.estado !== 'Pendiente') {
    throw new Error('Solo se puede simular la aceptación de una cotización pendiente.');
  }
  if (obtenerApartados().some((item) => item.cotizacionId === cotizacionId)) {
    throw new Error('Esta cotización ya tiene un apartado.');
  }
  const aceptaciones = leerLista(CLAVE_ACEPTACIONES, 'las aceptaciones simuladas');
  if (!aceptaciones.includes(cotizacionId)) {
    guardarLista(CLAVE_ACEPTACIONES, [...aceptaciones, cotizacionId], 'la aceptación simulada');
  }
}

export function obtenerApartados() {
  return leerLista(CLAVE_APARTADOS, 'los apartados');
}

export function obtenerApartado(apartadoId) {
  return obtenerApartados().find((item) => item.id === apartadoId) || null;
}

export function crearApartado(cotizacionId) {
  const cotizacion = obtenerCotizacion(cotizacionId);
  if (!cotizacion) throw new Error(`No existe la cotización ${cotizacionId}.`);
  const cotizaciones = obtenerCotizacionesParaApartado();
  const seleccionada = cotizaciones.find((item) => item.id === cotizacionId);
  if (!seleccionada?.aceptada) throw new Error('Simula o confirma la aceptación antes de crear el apartado.');

  const apartados = obtenerApartados();
  if (apartados.some((item) => item.cotizacionId === cotizacionId)) {
    throw new Error('Esta cotización ya tiene un apartado.');
  }

  const numero = apartados.reduce((mayor, item) => {
    const coincidencia = item.id?.match(/^APT-(\d+)$/);
    return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
  }, 0) + 1;
  const equipos = (cotizacion.lineas || []).map((linea) => {
    const equipo = obtenerEquipo(linea.equipoId);
    return {
      equipoId: linea.equipoId,
      nombre: equipo?.nombre || `Equipo pendiente (${linea.equipoId})`,
      modelo: equipo?.modelo || 'Pendiente',
      cantidad: Number(linea.cantidad) || 1,
    };
  });
  if (!equipos.length) throw new Error('La cotización no tiene equipos para apartar.');

  const apartado = {
    id: `APT-${String(numero).padStart(4, '0')}`,
    cotizacionId: cotizacion.id,
    fechaCreacion: new Date().toISOString(),
    cliente: { ...(cotizacion.cliente || {}) },
    equipos,
    fechaInicio: cotizacion.fechaInicio || '',
    fechaFin: cotizacion.fechaFin || '',
    municipio: cotizacion.cliente?.municipio || '',
    estado: ESTADOS_RENTA[0],
    montoCotizado: cotizacion.desglose?.total ?? null,
    preparacionCompletada: false,
    cartaGeneradaEn: '',
    cartaEnviadaEn: '',
    entrega: null,
  };
  guardarLista(CLAVE_APARTADOS, [...apartados, apartado], 'el apartado');
  return apartado;
}

export async function actualizarEstadoApartado(apartadoId, nuevoEstado) {
  const apartados = obtenerApartados();
  const indice = apartados.findIndex((item) => item.id === apartadoId);
  if (indice === -1) throw new Error(`No existe el apartado ${apartadoId}.`);
  const actual = apartados[indice];
  const transicionesAdministrativas = {
    'En renta': 'Pendiente de devolución',
    'Pendiente de devolución': 'Devuelto',
    Devuelto: 'Cerrado',
  };
  if (transicionesAdministrativas[actual.estado] !== nuevoEstado) {
    throw new Error('Solo se permite avanzar al siguiente estado del proceso.');
  }
  const actualizado = { ...actual, estado: nuevoEstado };
  apartados[indice] = actualizado;
  guardarLista(CLAVE_APARTADOS, apartados, 'el estado del apartado');
  return actualizado;
}

function guardarCambiosApartado(apartadoId, cambios) {
  const apartados = obtenerApartados();
  const indice = apartados.findIndex((item) => item.id === apartadoId);
  if (indice === -1) throw new Error(`No existe el apartado ${apartadoId}.`);
  apartados[indice] = { ...apartados[indice], ...cambios };
  guardarLista(CLAVE_APARTADOS, apartados, 'el apartado');
  return apartados[indice];
}

async function sincronizarEstadoEntrega(apartadoId) {
  const apartado = obtenerApartado(apartadoId);
  if (!apartado || ESTADOS_CERRADOS_ENTREGA.includes(apartado.estado)) return apartado;
  const documentos = await obtenerEstadoDocumental(apartadoId);
  const listo = Boolean(apartado.preparacionCompletada && documentos.puedeConfirmar);
  const estado = listo ? 'Pendiente de confirmación'
    : apartado.preparacionCompletada ? 'Listo para entrega'
      : apartado.estado;
  return estado === apartado.estado ? apartado : guardarCambiosApartado(apartadoId, { estado });
}

export function listarRentasCliente(correo) {
  const normalizado = String(correo || '').trim().toLocaleLowerCase();
  if (!normalizado) throw new Error('Escribe el correo usado en la cotización para consultar las rentas.');
  return obtenerApartados().filter(
    (apartado) => String(apartado.cliente?.correo || '').trim().toLocaleLowerCase() === normalizado,
  );
}

export async function obtenerEstadoDocumental(apartadoId) {
  const apartado = obtenerApartado(apartadoId);
  if (!apartado) throw new Error(`No existe el apartado ${apartadoId}.`);
  const carta = await obtenerCartaFirmada(apartadoId);
  const cartaGenerada = Boolean(apartado.cartaGeneradaEn);
  const cartaEnviada = Boolean(apartado.cartaEnviadaEn);
  const cartaFirmada = Boolean(carta);
  return {
    preparacionCompletada: Boolean(apartado.preparacionCompletada),
    cartaGenerada,
    cartaEnviada,
    cartaFirmada,
    cartaNombre: carta?.nombre || '',
    cartaFechaSubida: carta?.fechaSubida || '',
    puedeConfirmar: Boolean(apartado.preparacionCompletada && cartaGenerada && cartaEnviada && cartaFirmada),
  };
}

export async function registrarGeneracionCarta(apartadoId) {
  const apartado = obtenerApartado(apartadoId);
  if (!apartado) throw new Error(`No existe el apartado ${apartadoId}.`);
  if (!apartado.cartaGeneradaEn) {
    guardarCambiosApartado(apartadoId, { cartaGeneradaEn: new Date().toISOString() });
  }
}

export async function registrarEnvioCarta(apartadoId) {
  const apartado = obtenerApartado(apartadoId);
  if (!apartado) throw new Error(`No existe el apartado ${apartadoId}.`);
  if (!apartado.cartaGeneradaEn) throw new Error('Genera la carta responsiva antes de registrar su envío.');
  if (apartado.cartaEnviadaEn) throw new Error('El envío de la carta ya fue registrado.');
  guardarCambiosApartado(apartadoId, { cartaEnviadaEn: new Date().toISOString() });
  await sincronizarEstadoEntrega(apartadoId);
}

export async function marcarPreparacionCompletada(apartadoId) {
  const apartado = obtenerApartado(apartadoId);
  if (!apartado) throw new Error(`No existe el apartado ${apartadoId}.`);
  if (apartado.preparacionCompletada) throw new Error('La preparación ya fue marcada como completada.');
  if (ESTADOS_CERRADOS_ENTREGA.includes(apartado.estado)) {
    throw new Error('No se puede modificar la preparación de una renta ya entregada o cerrada.');
  }
  guardarCambiosApartado(apartadoId, { preparacionCompletada: true, estado: 'Listo para entrega' });
  await sincronizarEstadoEntrega(apartadoId);
}

export function iniciarPreparacion(apartadoId) {
  const apartado = obtenerApartado(apartadoId);
  if (!apartado) throw new Error(`No existe el apartado ${apartadoId}.`);
  if (apartado.estado === 'Apartado') {
    return guardarCambiosApartado(apartadoId, { estado: 'Preparación pendiente' });
  }
  return apartado;
}

export async function confirmarEntregaCliente(apartadoId, correo, condicion, observaciones = '') {
  const apartado = obtenerApartado(apartadoId);
  if (!apartado) throw new Error(`No existe el apartado ${apartadoId}.`);
  const correoCliente = String(apartado.cliente?.correo || '').trim().toLocaleLowerCase();
  if (!correoCliente || correoCliente !== String(correo || '').trim().toLocaleLowerCase()) {
    throw new Error('El apartado no corresponde al correo indicado.');
  }
  if (!CONDICIONES_EQUIPO.includes(condicion)) {
    throw new Error('Selecciona una condición válida para el equipo recibido.');
  }
  if (apartado.entrega || apartado.estado === 'Entregado') {
    throw new Error('La entrega ya fue confirmada y no puede registrarse nuevamente.');
  }
  const documentos = await obtenerEstadoDocumental(apartadoId);
  if (!documentos.puedeConfirmar) {
    throw new Error('La confirmación se habilita cuando la preparación y la documentación están completas.');
  }
  const actualizado = obtenerApartado(apartadoId);
  if (actualizado.entrega || actualizado.estado === 'Entregado') {
    throw new Error('La entrega ya fue confirmada y no puede registrarse nuevamente.');
  }
  const entrega = {
    condicion,
    observaciones: String(observaciones || '').trim(),
    confirmadoEn: new Date().toISOString(),
    clienteCorreo: actualizado.cliente.correo,
  };
  return guardarCambiosApartado(apartadoId, { entrega, estado: 'Entregado' });
}

function abrirBaseCartas() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este navegador; la carta firmada no se puede guardar.'));
      return;
    }
    const solicitud = indexedDB.open(DB_NOMBRE, DB_VERSION);
    solicitud.onerror = () => reject(new Error('No fue posible abrir el almacenamiento de cartas firmadas.', { cause: solicitud.error }));
    solicitud.onupgradeneeded = () => {
      const base = solicitud.result;
      if (!base.objectStoreNames.contains(DB_CARTAS)) {
        base.createObjectStore(DB_CARTAS, { keyPath: 'apartadoId' });
      }
    };
    solicitud.onsuccess = () => resolve(solicitud.result);
  });
}

export async function guardarCartaFirmada(apartadoId, archivo) {
  if (!obtenerApartado(apartadoId)) throw new Error(`No existe el apartado ${apartadoId}.`);
  if (!archivo || archivo.size === 0) throw new Error('Selecciona un archivo válido.');
  if (archivo.type !== 'application/pdf' && !archivo.name?.toLowerCase().endsWith('.pdf')) {
    throw new Error('El archivo de la carta firmada debe ser un PDF.');
  }

  const base = await abrirBaseCartas();
  try {
    await new Promise((resolve, reject) => {
      const transaccion = base.transaction(DB_CARTAS, 'readwrite');
      transaccion.objectStore(DB_CARTAS).put({
        apartadoId,
        nombre: archivo.name || 'carta-firmada.pdf',
        tipo: archivo.type || 'application/pdf',
        fechaSubida: new Date().toISOString(),
        archivo,
      });
      transaccion.oncomplete = resolve;
      transaccion.onerror = () => reject(new Error('No fue posible guardar la carta firmada.', { cause: transaccion.error }));
      transaccion.onabort = () => reject(new Error('Se canceló el guardado de la carta firmada.', { cause: transaccion.error }));
    });
  } finally {
    base.close();
  }
  notificarApartadosActualizados();
  await sincronizarEstadoEntrega(apartadoId);
}

export async function obtenerCartaFirmada(apartadoId) {
  const base = await abrirBaseCartas();
  try {
    return await new Promise((resolve, reject) => {
      const solicitud = base.transaction(DB_CARTAS, 'readonly').objectStore(DB_CARTAS).get(apartadoId);
      solicitud.onsuccess = () => resolve(solicitud.result || null);
      solicitud.onerror = () => reject(new Error('No fue posible consultar la carta firmada.', { cause: solicitud.error }));
    });
  } finally {
    base.close();
  }
}

export async function obtenerMetadatosCartasFirmadas() {
  const base = await abrirBaseCartas();
  try {
    return await new Promise((resolve, reject) => {
      const solicitud = base.transaction(DB_CARTAS, 'readonly').objectStore(DB_CARTAS).getAll();
      solicitud.onsuccess = () => resolve(solicitud.result.map(({ apartadoId, nombre, fechaSubida }) => ({
        apartadoId,
        nombre,
        fechaSubida,
      })));
      solicitud.onerror = () => reject(new Error('No fue posible consultar el estado de las cartas firmadas.', { cause: solicitud.error }));
    });
  } finally {
    base.close();
  }
}
