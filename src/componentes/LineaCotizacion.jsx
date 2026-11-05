// ============================================================
// DUEÑO: Cris · RAMA: feature/fechas-por-equipo
// Un equipo de la cotización con SUS fechas. La usan Mi cotización (web) y SelectorEquipos (panel).
// ============================================================
//
// Uso:
//   <LineaCotizacion linea={{ id, equipoId, cantidad, fechaInicio, fechaFin }}
//     abierta={idAbierta === linea.id} onAbrir={...} onCerrar={...} onCancelar={...}
//     onGuardar={(linea) => ...} onQuitar={...} error={mensaje} equipos={lista} />
//   onCerrar se llama después de guardar; onCancelar (si no viene, onCerrar) al tocar "Cancelar".
//
// - Cerrada: nombre, precio por día, fechas, días e importe, con "Cambiar" y "Quitar".
// - Abierta ("Cambiar"): cantidad + calendario con los días ocupados de ESE equipo.
//   Los cambios se quedan en borrador hasta "Guardar cambios"; "Cancelar" los descarta.
//   onGuardar recibe la línea completa; si lanza un Error, se muestra en la tarjeta.
// - equipos (opcional): si viene, el borrador también deja cambiar el equipo (panel admin).
import { useState } from 'react';
import CalendarioRango from './CalendarioRango.jsx';
import SelectorCantidad from './SelectorCantidad.jsx';
import { obtenerCotizaciones, obtenerEquipo, revisarLinea } from '../servicios/almacen.js';
import { rangosOcupados } from '../logica/disponibilidad.js';
import { diasEntre, hoyLocal } from '../utilidades/fechas.js';
import { pesos, rangoFechas, textoDias } from '../utilidades/formato.js';
import './lineaCotizacion.css';

const importeDe = (linea, equipo) => (equipo && linea.fechaInicio && linea.fechaFin
  ? Number(linea.cantidad) * equipo.precioPorDia * diasEntre(linea.fechaInicio, linea.fechaFin)
  : null);

function IconoEquipo() {
  return (
    <span className="linea-icono" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 15V9h13l3 6H3Zm3-6V5h7l3 4M4 19h16" />
        <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
      </svg>
    </span>
  );
}

function IconoCalendario() {
  return (
    <svg className="linea-icono-fecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4m8-4v4M3 10h18" />
    </svg>
  );
}

function EditorLinea({ linea, equipos, onGuardar, onCerrar, onCancelar }) {
  const [borrador, setBorrador] = useState(linea);
  const [error, setError] = useState('');
  const equipo = obtenerEquipo(borrador.equipoId);
  const ocupados = equipo ? rangosOcupados(equipo.id, obtenerCotizaciones()) : [];
  const importe = importeDe(borrador, equipo);

  const cambiar = (cambios) => {
    setError('');
    setBorrador((b) => ({ ...b, ...cambios }));
  };

  const guardar = () => {
    const problema = revisarLinea(borrador);
    if (problema) {
      setError(problema);
      return;
    }
    try {
      onGuardar(borrador);
      onCerrar();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="linea-editor">
      {equipos && (
        <label>Equipo
          <select value={borrador.equipoId}
            onChange={(e) => cambiar({ equipoId: e.target.value, fechaInicio: '', fechaFin: '' })}>
            <option value="">Selecciona…</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id} disabled={!eq.disponible}>
                {eq.nombre} · {pesos(eq.precioPorDia)}/día{eq.disponible ? '' : ' (no disponible)'}
              </option>
            ))}
          </select>
        </label>
      )}

      {equipo && (
        <>
          <div className="linea-editor-cantidad">
            <span>Cantidad</span>
            <SelectorCantidad valor={borrador.cantidad} onChange={(cantidad) => cambiar({ cantidad })}
              etiqueta={`Cantidad de ${equipo.nombre}`} />
          </div>
          <CalendarioRango
            key={equipo.id}
            fechaInicio={borrador.fechaInicio}
            fechaFin={borrador.fechaFin}
            ocupados={ocupados}
            minimo={hoyLocal()}
            onChange={cambiar}
          />
        </>
      )}

      {importe !== null && (
        <p className="linea-editor-importe">
          <span>{textoDias(diasEntre(borrador.fechaInicio, borrador.fechaFin))} × {borrador.cantidad} × {pesos(equipo.precioPorDia)}</span>
          <strong>{pesos(importe)}</strong>
        </p>
      )}
      {error && <p className="msg-error" role="alert">{error}</p>}

      <div className="linea-editor-acciones">
        <button type="button" className="boton" onClick={guardar}
          disabled={!borrador.equipoId || !borrador.fechaInicio || !borrador.fechaFin}>
          Guardar cambios
        </button>
        <button type="button" className="boton boton-secundario" onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
}

export default function LineaCotizacion({ linea, abierta = false, onAbrir, onCerrar, onCancelar = onCerrar, onGuardar, onQuitar, error = '', equipos }) {
  const equipo = obtenerEquipo(linea.equipoId);
  const importe = importeDe(linea, equipo);
  const conFechas = linea.fechaInicio && linea.fechaFin;

  return (
    <div className={`linea ${abierta ? 'linea-abierta' : ''} ${error ? 'linea-con-error' : ''}`}>
      <div className="linea-resumen">
        <IconoEquipo />
        <div className="linea-info">
          <div className="linea-fila">
            <strong className="linea-nombre">{equipo ? equipo.nombre : 'Equipo sin elegir'}</strong>
            <strong className="linea-importe">{importe === null ? '—' : pesos(importe)}</strong>
          </div>
          {equipo && (
            <p className="linea-detalle">
              {equipo.id} · {pesos(equipo.precioPorDia)} / día{Number(linea.cantidad) > 1 ? ` · ${linea.cantidad} unidades` : ''}
            </p>
          )}
          <div className="linea-fila">
            <p className={`linea-fechas ${conFechas ? '' : 'linea-sin-fechas'}`}>
              <IconoCalendario />
              {conFechas
                ? `${rangoFechas(linea.fechaInicio, linea.fechaFin)} · ${textoDias(diasEntre(linea.fechaInicio, linea.fechaFin))}`
                : 'Sin fechas: toca Cambiar'}
            </p>
            {!abierta && (
              <span className="linea-acciones">
                <button type="button" onClick={onAbrir}>Cambiar</button>
                <button type="button" className="linea-quitar" onClick={onQuitar}>Quitar</button>
              </span>
            )}
          </div>
        </div>
      </div>
      {error && !abierta && <p className="msg-error linea-error" role="alert">{error}</p>}
      {abierta && <EditorLinea linea={linea} equipos={equipos} onGuardar={onGuardar} onCerrar={onCerrar} onCancelar={onCancelar} />}
    </div>
  );
}
