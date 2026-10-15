// ============================================================
// DUEÑA: Katia  ·  RAMA: feature/formulario-cliente
// Nadie más edita este archivo. Función PURA: no usa document ni localStorage.
// ============================================================
//
// validarCliente({ nombreCompleto, telefono, correo, municipio })
//   →  { valido: true/false, errores: { campo: 'mensaje' } }
//
// Reglas:
//   nombre:    solo letras (con acentos y ñ), espacios, punto, guion y apóstrofo;
//              al menos nombre y apellido; máximo 150 caracteres.
//   teléfono:  10 dígitos (se ignoran espacios y guiones); no empieza con 0 ni 1.
//   correo:    formato nombre@dominio.ext, sin espacios ni puntos seguidos; máximo 100.
//   municipio: dentro de MUNICIPIOS (constantes.js).
// La usan FormularioCliente (para pintar errores) y almacen.js (antes de guardar).

import { MUNICIPIOS } from '../constantes.js';

export const MAX_NOMBRE = 150;
export const MAX_CORREO = 100;

const LETRAS_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'-]+$/;
const FORMATO_CORREO = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function validarCliente(cliente) {
  const nombre = (cliente.nombreCompleto || '').trim().replace(/\s+/g, ' ');
  const telefono = (cliente.telefono || '').replace(/[\s-]/g, '');
  const correo = (cliente.correo || '').trim();
  const municipio = cliente.municipio || '';

  const errores = {};

  // Palabras con al menos 2 letras (así "J." o "-" no cuentan como apellido)
  const palabras = nombre.split(' ').filter((p) => p.replace(/[.'-]/g, '').length >= 2);

  if (nombre === '') {
    errores.nombreCompleto = 'Escribe tu nombre completo';
  } else if (nombre.length > MAX_NOMBRE) {
    errores.nombreCompleto = `El nombre no puede pasar de ${MAX_NOMBRE} caracteres`;
  } else if (!LETRAS_NOMBRE.test(nombre)) {
    errores.nombreCompleto = 'El nombre solo puede llevar letras y espacios';
  } else if (palabras.length < 2) {
    errores.nombreCompleto = 'Escribe nombre y apellido';
  }

  if (telefono === '') {
    errores.telefono = 'Escribe tu teléfono';
  } else if (!/^\d{10}$/.test(telefono)) {
    errores.telefono = 'El teléfono debe tener 10 dígitos, solo números';
  } else if (/^[01]/.test(telefono)) {
    errores.telefono = 'El teléfono no puede empezar con 0 ni con 1';
  }

  if (correo === '') {
    errores.correo = 'Escribe tu correo';
  } else if (correo.length > MAX_CORREO) {
    errores.correo = `El correo no puede pasar de ${MAX_CORREO} caracteres`;
  } else if (!FORMATO_CORREO.test(correo) || /\.\.|^\.|\.@/.test(correo)) {
    errores.correo = 'Escribe un correo válido, ej. tu@correo.com';
  }

  if (municipio === '') {
    errores.municipio = 'Elige un municipio';
  } else if (!MUNICIPIOS.includes(municipio)) {
    errores.municipio = 'No hacemos envíos a ese municipio';
  }

  return { valido: Object.keys(errores).length === 0, errores };
}
