// ============================================================
// DUEÑA: Katia  ·  RAMA: feature/formulario-cliente
// Nadie más edita este archivo. Los demás solo lo importan.
// ============================================================
//
// Uso (así lo usan el panel y la web):
//
//   const [cliente, setCliente] = useState(CLIENTE_VACIO);
//   const [errores, setErrores] = useState({});
//   <FormularioCliente valor={cliente} onChange={setCliente} errores={errores} />
//
//   // Antes de enviar:
//   const { valido, errores } = validarFormularioCliente(cliente);
//   setErrores(errores);
//   if (!valido) return;
//
// Props:
//   valor:    { nombreCompleto, telefono, correo, municipio }
//   onChange: función que recibe el objeto completo actualizado
//   errores:  { campo: 'mensaje' } para pintar cada campo en rojo
//
// La validación vive en logica/validarCliente.js (también de Katia). Aquí se reexporta con este nombre.
// VERSIÓN FALSA: muestra los campos sin pintar errores.
import { MUNICIPIOS } from '../constantes.js';
import { validarCliente } from '../logica/validarCliente.js';

export const CLIENTE_VACIO = { nombreCompleto: '', telefono: '', correo: '', municipio: '' };
export const validarFormularioCliente = validarCliente;

export default function FormularioCliente({ valor, onChange, errores = {} }) {
  const cambiar = (campo) => (e) => onChange({ ...valor, [campo]: e.target.value });

  return (
    <div className="form-grid">
      <label>Nombre completo
        <input value={valor.nombreCompleto} onChange={cambiar('nombreCompleto')} />
      </label>
      <label>Teléfono
        <input value={valor.telefono} onChange={cambiar('telefono')} />
      </label>
      <label>Correo
        <input value={valor.correo} onChange={cambiar('correo')} />
      </label>
      <label>Municipio de entrega
        <select value={valor.municipio} onChange={cambiar('municipio')}>
          <option value="">Selecciona…</option>
          {MUNICIPIOS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </label>
    </div>
  );
}
