// ============================================================
// DUEÑO: Cris · Lo usa Modificar cotización; TarjetaFechas también Mi cotización (web).
// Las tarjetas Equipos, Fechas, Cliente y Costos con el desglose en vivo.
// ============================================================
//
// Uso:
//   <CamposCotizacion valor={{ lineas, fechaInicio, fechaFin, cliente }} onChange={(cambios) => ...} errores={errores} />
//   onChange recibe solo lo que cambió, ej. { fechaInicio: '2026-10-20' }
import FormularioCliente from './FormularioCliente.jsx';
import SelectorEquipos from './SelectorEquipos.jsx';
import DesgloseCostos from './DesgloseCostos.jsx';
import { calcularCotizacionSegura } from '../logica/calcularCotizacion.js';
import { obtenerEquipos } from '../servicios/almacen.js';

// También la usa Mi cotización (web). children: texto opcional bajo el título.
export function TarjetaFechas({ fechaInicio, fechaFin, onChange, children }) {
  return (
    <div className="tarjeta">
      <h2>Fechas de renta</h2>
      {children}
      <div className="form-grid">
        <label>Fecha de inicio
          <input type="date" value={fechaInicio} onChange={(e) => onChange({ fechaInicio: e.target.value })} />
        </label>
        <label>Fecha de fin
          <input type="date" min={fechaInicio || undefined} value={fechaFin}
            onChange={(e) => onChange({ fechaFin: e.target.value })} />
        </label>
      </div>
    </div>
  );
}

export default function CamposCotizacion({ valor, onChange, errores = {} }) {
  const { lineas, fechaInicio, fechaFin, cliente } = valor;
  const { desglose, error } = calcularCotizacionSegura({ lineas, fechaInicio, fechaFin, municipio: cliente.municipio });

  return (
    <>
      <div className="tarjeta">
        <h2>Equipos</h2>
        <SelectorEquipos equipos={obtenerEquipos()} lineas={lineas} onChange={(l) => onChange({ lineas: l })} />
      </div>

      <TarjetaFechas fechaInicio={fechaInicio} fechaFin={fechaFin} onChange={onChange} />

      <div className="tarjeta">
        <h2>Cliente</h2>
        <FormularioCliente valor={cliente} onChange={(c) => onChange({ cliente: c })} errores={errores} />
      </div>

      <div className="tarjeta">
        <h2>Costos</h2>
        {desglose && <DesgloseCostos desglose={desglose} />}
        {error && <p className="error">{error}</p>}
        {!desglose && !error && <p className="sutil">Elige al menos un equipo y las fechas para ver el costo.</p>}
      </div>
    </>
  );
}
