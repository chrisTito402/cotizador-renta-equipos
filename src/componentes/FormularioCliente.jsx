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
// Pinta en rojo los campos que traen error.
import { MUNICIPIOS } from '../constantes.js';
import { validarCliente } from '../logica/validarCliente.js';

export const CLIENTE_VACIO = { nombreCompleto: '', telefono: '', correo: '', municipio: '' };
export const validarFormularioCliente = validarCliente;

export default function FormularioCliente({ valor, onChange, errores = {} }) {
  const cambiar = (campo) => (e) => onChange({ ...valor, [campo]: e.target.value });

  return (
    <div className="form-grid">
      <label>Nombre completo
        <input
          value={valor.nombreCompleto}
          onChange={cambiar('nombreCompleto')}
          placeholder="Ej. Juan Pérez López"
          className={errores.nombreCompleto ? 'invalido' : ''}
        />
        {errores.nombreCompleto && <span className="msg-error">{errores.nombreCompleto}</span>}
      </label>
      <label>Teléfono (WhatsApp)
        <input
          value={valor.telefono}
          onChange={cambiar('telefono')}
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="6441234567"
          className={errores.telefono ? 'invalido' : ''}
        />
        {errores.telefono && <span className="msg-error">{errores.telefono}</span>}
      </label>
      <label>Correo electrónico
        <input
          value={valor.correo}
          onChange={cambiar('correo')}
          type="email"
          placeholder="tu@correo.com"
          className={errores.correo ? 'invalido' : ''}
        />
        {errores.correo && <span className="msg-error">{errores.correo}</span>}
      </label>
      <label>Municipio de entrega
        <select
          value={valor.municipio}
          onChange={cambiar('municipio')}
          className={errores.municipio ? 'invalido' : ''}
        >
          <option value="">Elige un municipio</option>
          {MUNICIPIOS.map((m) => <option key={m}>{m}</option>)}
        </select>
        {errores.municipio && <span className="msg-error">{errores.municipio}</span>}
      </label>
    </div>
  );
}
