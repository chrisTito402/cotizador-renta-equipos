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
//   notaMunicipio: (opcional) texto bajo el municipio; la web no menciona el costo de envío
//
// La validación vive en logica/validarCliente.js (también de Katia). Aquí se reexporta con este nombre.
// Pinta en rojo los campos que traen error. El teléfono solo acepta números.
import { MUNICIPIOS } from '../constantes.js';
import { validarCliente, MAX_NOMBRE, MAX_CORREO } from '../logica/validarCliente.js';
import './formularioCliente.css';

export const CLIENTE_VACIO = { nombreCompleto: '', telefono: '', correo: '', municipio: '' };
export const validarFormularioCliente = validarCliente;

const NOTA_MUNICIPIO = 'La tarifa de envío cambia según el municipio y se suma al total.';

export default function FormularioCliente({ valor, onChange, errores = {}, notaMunicipio = NOTA_MUNICIPIO }) {
  const cambiar = (campo) => (e) => onChange({ ...valor, [campo]: e.target.value });

  const cambiarTelefono = (e) => {
    const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange({ ...valor, telefono: soloNumeros });
  };

  return (
    <div className="formulario-cliente">
      <p className="aviso">Todos los campos son obligatorios.</p>
      <div className="campos">
        <label className="campo-ancho">Nombre completo
          <input
            value={valor.nombreCompleto}
            onChange={cambiar('nombreCompleto')}
            maxLength={MAX_NOMBRE}
            autoComplete="name"
            placeholder="Ej. Juan Pérez López"
            className={errores.nombreCompleto ? 'invalido' : ''}
          />
          {errores.nombreCompleto && <span className="msg-error">{errores.nombreCompleto}</span>}
        </label>
        <label>Teléfono (WhatsApp)
          <input
            value={valor.telefono}
            onChange={cambiarTelefono}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel"
            placeholder="6441234567"
            className={errores.telefono ? 'invalido' : ''}
          />
          {errores.telefono && <span className="msg-error">{errores.telefono}</span>}
          <span className="nota">10 dígitos con lada, sin +52.</span>
        </label>
        <label>Correo electrónico
          <input
            value={valor.correo}
            onChange={cambiar('correo')}
            type="email"
            maxLength={MAX_CORREO}
            autoComplete="email"
            placeholder="tu@correo.com"
            className={errores.correo ? 'invalido' : ''}
          />
          {errores.correo && <span className="msg-error">{errores.correo}</span>}
        </label>
        <label className="campo-ancho">Municipio de entrega
          <select
            value={valor.municipio}
            onChange={cambiar('municipio')}
            className={errores.municipio ? 'invalido' : ''}
          >
            <option value="">Elige un municipio</option>
            {MUNICIPIOS.map((m) => <option key={m}>{m}</option>)}
          </select>
          {errores.municipio && <span className="msg-error">{errores.municipio}</span>}
          <span className="nota">{notaMunicipio}</span>
        </label>
      </div>
    </div>
  );
}
