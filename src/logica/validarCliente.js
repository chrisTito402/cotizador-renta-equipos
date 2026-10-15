// ============================================================
// DUEÑA: Katia  ·  RAMA: feature/formulario-cliente
// Nadie más edita este archivo. Función PURA: no usa document ni localStorage.
// ============================================================
//
// validarCliente({ nombreCompleto, telefono, correo, municipio })
//   →  { valido: true/false, errores: { campo: 'mensaje' } }
//
// Reglas: los 4 obligatorios; teléfono de 10 dígitos; correo con formato válido;
// municipio dentro de MUNICIPIOS (constantes.js).
// La usan FormularioCliente (para pintar errores) y almacen.js (antes de guardar).
//

import { MUNICIPIOS } from '../constantes.js';

export function validarCliente(cliente) {
  const nombre = (cliente.nombreCompleto || '').trim();
  const telefono = (cliente.telefono || '').replace(/[\s-]/g, '');
  const correo = (cliente.correo || '').trim();
  const municipio = cliente.municipio || '';

  const errores = {};

  if (nombre === '') {
    errores.nombreCompleto = 'Escribe tu nombre completo';
  }

  if (telefono === '') {
    errores.telefono = 'Escribe tu teléfono';
  } else if (!/^\d{10}$/.test(telefono)) {
    errores.telefono = 'El teléfono debe tener 10 dígitos';
  }

  if (correo === '') {
    errores.correo = 'Escribe tu correo';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    errores.correo = 'Escribe un correo válido, ej. tu@correo.com';
  }

  if (municipio === '') {
    errores.municipio = 'Elige un municipio';
  } else if (!MUNICIPIOS.includes(municipio)) {
    errores.municipio = 'No hacemos envíos a ese municipio';
  }

  return { valido: Object.keys(errores).length === 0, errores };
}
