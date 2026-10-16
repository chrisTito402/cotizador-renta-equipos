// DUEÑO: Héctor · RAMA: feature/catalogo
// (rediseño como el Figma con calendario por equipo: rama feature/fechas-por-equipo, con aviso en el grupo)
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CalendarioRango from '../../componentes/CalendarioRango.jsx';
import SelectorCantidad from '../../componentes/SelectorCantidad.jsx';
import { rangosOcupados } from '../../logica/disponibilidad.js';
import { agregarAlCarrito, obtenerCotizaciones, obtenerEquipo, revisarLinea } from '../../servicios/almacen.js';
import { diasEntre, hoyLocal } from '../../utilidades/fechas.js';
import { pesos, rangoFechas, textoDias } from '../../utilidades/formato.js';
import './catalogo.css';
import './detalleEquipo.css';

function IlustracionEquipo({ tipo }) {
  return (
    <div className="ficha-foto ficha-foto-vacia" role="img" aria-label={`Sin foto: ${tipo}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 15V9h13l3 6H3Zm3-6V5h7l3 4M4 19h16" />
        <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
      </svg>
      <span>{tipo}</span>
    </div>
  );
}

export default function DetalleEquipo() {
  const { id } = useParams();
  const [cantidad, setCantidad] = useState(1);
  const [fechas, setFechas] = useState({ fechaInicio: '', fechaFin: '' });
  const [agregado, setAgregado] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const equipo = obtenerEquipo(id);

  if (!equipo) {
    return (
      <div className="detalle-equipo">
        <nav className="ficha-migas" aria-label="Ruta"><Link to="/">← Catálogo</Link></nav>
        <div className="tarjeta detalle-no-encontrado">
          <h1>Equipo no encontrado</h1>
          <p className="sutil">No encontramos un equipo con el identificador {id}.</p>
          <Link className="boton boton-secundario" to="/">Volver al catálogo</Link>
        </div>
      </div>
    );
  }

  const { fechaInicio, fechaFin } = fechas;
  const conFechas = fechaInicio && fechaFin;
  const dias = conFechas ? diasEntre(fechaInicio, fechaFin) : 0;
  const subtotal = dias * cantidad * equipo.precioPorDia;
  const problema = conFechas ? revisarLinea({ equipoId: id, cantidad, fechaInicio, fechaFin }) : '';

  const cambiar = (cambios) => {
    if ('cantidad' in cambios) setCantidad(cambios.cantidad);
    else setFechas(cambios);
    setAgregado(false);
    setMensaje('');
  };

  const agregar = () => {
    try {
      agregarAlCarrito({ equipoId: id, cantidad, fechaInicio, fechaFin });
      setAgregado(true);
      setMensaje('');
    } catch (e) {
      setMensaje(e.message);
    }
  };

  const caracteristicas = [
    ...Object.entries(equipo.caracteristicas),
    ['Tipo', equipo.tipo],
    ['Modelo', equipo.modelo],
    ['Núm. económico', equipo.id],
  ];

  return (
    <div className="detalle-equipo">
      <nav className="ficha-migas" aria-label="Ruta">
        <Link to="/">← Catálogo</Link>
        <span aria-hidden="true">/</span>
        <span>{equipo.tipo}</span>
        <span aria-hidden="true">/</span>
        <strong>{equipo.nombre}</strong>
      </nav>

      <div className="ficha-grid">
        <div className="ficha-izquierda">
          <section className="tarjeta ficha-foto-tarjeta">
            {equipo.fotos.length > 0
              ? <img className="ficha-foto" src={equipo.fotos[0]} alt={equipo.nombre} />
              : <IlustracionEquipo tipo={equipo.tipo} />}
          </section>

          <section className="tarjeta ficha-caracteristicas">
            <div className="ficha-seccion-cabeza">
              <h2>Características técnicas</h2>
              <span>FICHA OPERATIVA</span>
            </div>
            <dl className="ficha-mosaico">
              {caracteristicas.map(([nombre, valor]) => (
                <div key={nombre}><dt>{nombre}</dt><dd>{valor}</dd></div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="tarjeta ficha-renta" aria-label="Renta">
          <span className={`catalogo-estado ${equipo.disponible ? 'catalogo-estado-disponible' : 'catalogo-estado-no-disponible'}`}>
            {equipo.disponible ? '● Disponible' : 'No disponible'}
          </span>
          <h1 className="ficha-nombre">{equipo.nombre} <span>{equipo.modelo}</span></h1>
          <p className="ficha-precio"><strong>{pesos(equipo.precioPorDia)}</strong> / día</p>

          {equipo.disponible ? (
            <>
              <CalendarioRango
                fechaInicio={fechaInicio}
                fechaFin={fechaFin}
                ocupados={rangosOcupados(id, obtenerCotizaciones())}
                minimo={hoyLocal()}
                onChange={cambiar}
              />

              <div className="ficha-cantidad">
                <span>Cantidad</span>
                <SelectorCantidad valor={cantidad} onChange={(n) => cambiar({ cantidad: n })} etiqueta={`Cantidad de ${equipo.nombre}`} />
              </div>

              <div className="ficha-costo" aria-live="polite">
                <div className="ficha-costo-cabeza">
                  <strong>Costo estimado</strong>
                  {conFechas && <span>{rangoFechas(fechaInicio, fechaFin)}</span>}
                </div>
                {conFechas ? (
                  <>
                    <p><span>Renta ({textoDias(dias)} × {cantidad > 1 ? `${cantidad} × ` : ''}{pesos(equipo.precioPorDia)})</span><span>{pesos(subtotal)}</span></p>
                    <p className="ficha-costo-total"><span>Total estimado de renta</span><strong>{pesos(subtotal)}</strong></p>
                  </>
                ) : (
                  <p className="sutil">Elige las fechas en el calendario para ver el costo.</p>
                )}
                <p className="ficha-costo-nota">No incluye el envío: se suma al elegir tu municipio en tu cotización.</p>
              </div>

              {problema && <p className="msg-error" role="alert">{problema}</p>}
              {mensaje && <p className="msg-error" role="alert">{mensaje}</p>}
              <button type="button" className="boton ficha-agregar" disabled={!conFechas || !!problema} onClick={agregar}>
                Agregar a mi cotización
              </button>
              <p className="ficha-sin-cobro">🔒 No se realiza ningún cobro en este paso</p>

              {agregado && (
                <div className="detalle-confirmacion" role="status">
                  <p>Agregado a tu cotización: {rangoFechas(fechaInicio, fechaFin)}</p>
                  <div className="detalle-acciones">
                    <Link className="boton" to="/cotizar">Ver mi cotización</Link>
                    <Link className="boton boton-secundario" to="/">Seguir viendo equipos</Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="sutil">Este equipo no está disponible para renta por ahora. Revisa otros equipos en el catálogo.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
