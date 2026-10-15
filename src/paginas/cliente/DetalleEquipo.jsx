// DUEÑO: Héctor · RAMA: feature/catalogo
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { calcularRenta } from '../../logica/calculoRenta.js';
import { agregarAlCarrito, obtenerEquipo } from '../../servicios/almacen.js';
import { pesos } from '../../utilidades/formato.js';
import './catalogo.css';

export default function DetalleEquipo() {
  const { id } = useParams();
  const [cantidad, setCantidad] = useState('1');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [agregado, setAgregado] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const equipo = obtenerEquipo(id);

  if (!equipo) {
    return (
      <div className="detalle-equipo">
        <header className="detalle-encabezado">
          <p className="catalogo-ruta">EQUIPOS / {id}</p>
          <h1>Equipo no encontrado</h1>
        </header>
        <div className="tarjeta detalle-no-encontrado">
          <p className="sutil">No encontramos un equipo con el identificador {id}.</p>
          <Link className="boton boton-secundario" to="/">Volver al catálogo</Link>
        </div>
      </div>
    );
  }

  const cantidadNumerica = Number(cantidad);
  const cantidadValida = cantidad !== '' && Number.isFinite(cantidadNumerica) && cantidadNumerica >= 1;
  const fechasInvertidas = fechaInicio && fechaFin && fechaFin < fechaInicio;
  let subtotal = null;
  let errorCalculo = '';

  if (fechaInicio && fechaFin) {
    try {
      subtotal = calcularRenta([{ equipoId: id, cantidad }], fechaInicio, fechaFin).subtotalRenta;
    } catch (e) {
      errorCalculo = e.message;
    }
  }
  if (fechasInvertidas && !errorCalculo) errorCalculo = 'La fecha de fin no puede ser anterior a la de inicio';

  const cambiar = (setter, valor) => {
    setter(valor);
    setAgregado(false);
    setMensaje('');
  };

  const agregar = () => {
    if (!equipo.disponible || !cantidadValida || fechasInvertidas) return;

    try {
      agregarAlCarrito({ equipoId: id, cantidad: cantidadNumerica, fechaInicio, fechaFin });
      setAgregado(true);
      setMensaje('');
    } catch (e) {
      setMensaje(e.message);
    }
  };

  return (
    <div className="detalle-equipo">
      <header className="detalle-encabezado">
        <div>
          <p className="catalogo-ruta">EQUIPOS / {equipo.id}</p>
          <h1>Detalle del equipo</h1>
          <p className="sutil">Consulta sus características y prepara tu renta.</p>
        </div>
        <Link className="detalle-regresar" to="/">← Volver a equipos</Link>
      </header>

      <section className="tarjeta detalle-resumen">
        <div>
          <div className="detalle-resumen-nombre">
            <h2>{equipo.nombre}</h2>
            <span className={`catalogo-estado ${equipo.disponible ? 'catalogo-estado-disponible' : 'catalogo-estado-no-disponible'}`}>
              {equipo.disponible ? 'Disponible' : 'No disponible'}
            </span>
          </div>
          <p className="sutil">{equipo.id} · {equipo.tipo} · Modelo {equipo.modelo}</p>
        </div>
        <div className="detalle-resumen-precio"><small>PRECIO POR DÍA</small><strong>{pesos(equipo.precioPorDia)}</strong></div>
      </section>

      <div className="detalle-grid">
        <section className="tarjeta detalle-informacion">
          <div className="detalle-panel-encabezado">
            <span className="equipos-icono" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h10M7 13h7" />
              </svg>
            </span>
            <h2>Información del equipo</h2>
          </div>
          <div className="detalle-info-cuerpo">
            {equipo.fotos.length > 0 ? (
              <img className="equipo-foto detalle-foto" src={equipo.fotos[0]} alt={equipo.nombre} />
            ) : (
              <div className="equipo-foto equipo-foto-vacia detalle-foto" aria-label={`Sin foto: ${equipo.tipo}`}>
                <span className="equipo-foto-icono" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 15V9h13l3 6H3Zm3-6V5h7l3 4M4 19h16" />
                    <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
                  </svg>
                </span>
                <span>{equipo.tipo}</span>
              </div>
            )}
            <dl className="detalle-caracteristicas">
              <div><dt>ID de equipo</dt><dd>{equipo.id}</dd></div>
              <div><dt>Tipo</dt><dd>{equipo.tipo}</dd></div>
              <div><dt>Modelo</dt><dd>{equipo.modelo}</dd></div>
              {Object.entries(equipo.caracteristicas).map(([nombre, valor]) => (
                <div key={nombre}><dt>{nombre}</dt><dd>{valor}</dd></div>
              ))}
            </dl>
          </div>
        </section>

        <section className="tarjeta detalle-renta">
          <div className="detalle-panel-encabezado">
            <span className="equipos-icono" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18m-13 5h3" />
              </svg>
            </span>
            <h2>Calcula tu renta</h2>
          </div>
          <p className="sutil detalle-renta-ayuda">Selecciona cantidad y fechas para estimar el costo.</p>
          <div className="detalle-campos">
            <label>
              Cantidad
              <input type="number" min="1" step="1" value={cantidad}
                onChange={(e) => cambiar(setCantidad, e.target.value)} />
            </label>
            <label>
              Fecha de inicio
              <input type="date" value={fechaInicio}
                onChange={(e) => cambiar(setFechaInicio, e.target.value)} />
            </label>
            <label>
              Fecha de fin
              <input type="date" min={fechaInicio || undefined} value={fechaFin}
                onChange={(e) => cambiar(setFechaFin, e.target.value)} />
            </label>
          </div>

          <div className="detalle-subtotal" aria-live="polite">
            {errorCalculo ? (
              <p className="error" role="alert">{errorCalculo}</p>
            ) : subtotal !== null ? (
              <p><span>Subtotal estimado</span><strong>{pesos(subtotal)}</strong></p>
            ) : (
              <p className="sutil">Elige las fechas para ver el subtotal estimado.</p>
            )}
          </div>

          <p className="sutil detalle-renta-nota">El importe corresponde solo a la renta del equipo.</p>
          <button type="button" className="boton" disabled={!equipo.disponible || !cantidadValida || !!fechasInvertidas}
            onClick={agregar}>
            Agregar a mi cotización
          </button>
          {mensaje && <p className="msg-error" role="alert">{mensaje}</p>}
          {agregado && (
            <div className="detalle-confirmacion" role="status">
              <p>Agregado a tu cotización</p>
              <div className="detalle-acciones">
                <Link className="boton" to="/cotizar">Ver mi cotización</Link>
                <Link className="boton boton-secundario" to="/">Seguir viendo equipos</Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
