// ============================================================
// DUEÑO: Cris · Lo usa Modificar cotización; CampoNotas también Mi cotización (web) y Nueva cotización.
// Las tarjetas Equipos (cada uno con sus fechas), Cliente, Notas y Costos con el desglose en vivo.
// ============================================================
//
// Uso:
//   <CamposCotizacion valor={{ lineas, cliente, notas }} onChange={(cambios) => ...}
//     errores={errores} errorLinea={{ id, mensaje }} />
//   onChange recibe solo lo que cambió, ej. { notas: 'Acceso por la puerta 2' }
import FormularioCliente from './FormularioCliente.jsx';
import SelectorEquipos from './SelectorEquipos.jsx';
import DesgloseCostos from './DesgloseCostos.jsx';
import { calcularCotizacionSegura } from '../logica/calcularCotizacion.js';
import { obtenerEquipos } from '../servicios/almacen.js';
import { MAX_NOTAS } from '../constantes.js';

// "Notas de entrega u obra" (opcional). La usan la web y el panel.
export function CampoNotas({ valor = '', onChange }) {
  return (
    <label className="campo-notas">
      <span className="campo-notas-titulo">Notas de entrega u obra <small>OPCIONAL</small></span>
      <textarea
        value={valor}
        maxLength={MAX_NOTAS}
        rows={3}
        placeholder="Indicaciones de acceso, requerimiento de operador certificado o maniobra especial…"
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export default function CamposCotizacion({ valor, onChange, errores = {}, errorLinea = null }) {
  const { lineas, cliente, notas } = valor;
  const { desglose, error } = calcularCotizacionSegura({ lineas, municipio: cliente.municipio });
  const sinFechas = lineas.filter((l) => l.equipoId && (!l.fechaInicio || !l.fechaFin)).length;

  return (
    <>
      <div className="tarjeta">
        <h2>Equipos</h2>
        <p className="sutil" style={{ marginBottom: 12 }}>Cada equipo lleva sus fechas. Toca “Cambiar” en el que quieras modificar.</p>
        <SelectorEquipos equipos={obtenerEquipos()} lineas={lineas} onChange={(l) => onChange({ lineas: l })} errorLinea={errorLinea} />
      </div>

      <div className="tarjeta">
        <h2>Cliente</h2>
        <FormularioCliente valor={cliente} onChange={(c) => onChange({ cliente: c })} errores={errores} />
      </div>

      <div className="tarjeta">
        <CampoNotas valor={notas} onChange={(n) => onChange({ notas: n })} />
      </div>

      <div className="tarjeta">
        <h2>Costos</h2>
        {desglose && <DesgloseCostos desglose={desglose} />}
        {sinFechas > 0 && <p className="error">Falta elegir fechas en {sinFechas === 1 ? '1 equipo' : `${sinFechas} equipos`}.</p>}
        {error && <p className="error">{error}</p>}
        {!desglose && !error && <p className="sutil">Elige al menos un equipo con sus fechas para ver el costo.</p>}
      </div>
    </>
  );
}
