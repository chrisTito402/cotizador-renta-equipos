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
// VERSIÓN FALSA: todo es válido.

export function validarCliente(cliente) {
  return { valido: true, errores: {} };
}
