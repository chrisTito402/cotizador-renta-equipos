// DUEÑO: Héctor · RAMA: feature/catalogo
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TIPOS_EQUIPO } from '../../constantes.js';
import { filtrarEquipos } from '../../logica/filtrarEquipos.js';
import { obtenerCotizaciones, obtenerEquipos } from '../../servicios/almacen.js';
import { pesos } from '../../utilidades/formato.js';
import './catalogo.css';

const filtrosIniciales = { busqueda: '', tipo: '', disponible: '', fechaInicio: '', fechaFin: '' };

export default function Catalogo() {
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const actualizar = (campo, valor) => setFiltros((anteriores) => ({ ...anteriores, [campo]: valor }));
  const equipos = filtrarEquipos(obtenerEquipos(), obtenerCotizaciones(), filtros);
  const fechasInvertidas = filtros.fechaInicio && filtros.fechaFin && filtros.fechaInicio > filtros.fechaFin;

  return (
    <div className="catalogo">
      <header className="encabezado catalogo-encabezado">
        <div>
          <p className="catalogo-ruta">EQUIPOS / CATÁLOGO</p>
          <h1>Catálogo de equipos</h1>
          <p className="sutil">Encuentra el equipo que necesitas para tu renta.</p>
        </div>
        <div className="catalogo-contador"><strong>{equipos.length}</strong><span>resultados</span></div>
      </header>

      <section className="tarjeta catalogo-filtros" aria-label="Filtros del catálogo">
        <div className="catalogo-panel-titulo">
          <span className="equipos-icono" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" />
            </svg>
          </span>
          <div>
            <h2>Buscar equipo</h2>
            <p className="sutil">Filtra el catálogo por tipo, disponibilidad y fechas.</p>
          </div>
        </div>
        <div className="catalogo-filtros-grid">
          <label>
            Buscar por nombre o modelo
            <input type="search" placeholder="Ej. montacargas o 320D" value={filtros.busqueda}
              onChange={(e) => actualizar('busqueda', e.target.value)} />
          </label>
          <label>
            Tipo de equipo
            <select value={filtros.tipo} onChange={(e) => actualizar('tipo', e.target.value)}>
              <option value="">Todos</option>
              {TIPOS_EQUIPO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
            </select>
          </label>
          <label>
            Fecha de inicio
            <input type="date" value={filtros.fechaInicio}
              onChange={(e) => actualizar('fechaInicio', e.target.value)} />
          </label>
          <label>
            Fecha de fin
            <input type="date" min={filtros.fechaInicio || undefined} value={filtros.fechaFin}
              onChange={(e) => actualizar('fechaFin', e.target.value)} />
          </label>
          <label className="catalogo-casilla">
            <input type="checkbox" checked={filtros.disponible === 'true'}
              onChange={(e) => actualizar('disponible', e.target.checked ? 'true' : '')} />
            Solo disponibles
          </label>
        </div>
        {fechasInvertidas && <p className="msg-error" role="alert">La fecha de fin no puede ser anterior a la de inicio.</p>}
      </section>

      <div className="catalogo-lista-encabezado">
        <h2>Equipos para rentar</h2>
        <p className="sutil">{fechasInvertidas ? 'Revisa el rango de fechas' : `${equipos.length} resultados`}</p>
      </div>

      {!fechasInvertidas && (
        equipos.length > 0 ? (
          <div className="catalogo-grid">
            {equipos.map((equipo) => (
              <Link className="tarjeta catalogo-tarjeta" to={`/equipos/${equipo.id}`} key={equipo.id}>
                {equipo.fotos.length > 0 ? (
                  <img className="equipo-foto catalogo-foto" src={equipo.fotos[0]} alt={equipo.nombre} />
                ) : (
                  <div className="equipo-foto equipo-foto-vacia catalogo-foto" aria-label={`Sin foto: ${equipo.tipo}`}>
                    <span className="equipo-foto-icono" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 15V9h13l3 6H3Zm3-6V5h7l3 4M4 19h16" />
                        <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
                      </svg>
                    </span>
                    <span>{equipo.tipo}</span>
                  </div>
                )}
                <div className="catalogo-tarjeta-info">
                  <div className="catalogo-tarjeta-meta">
                    <span className="catalogo-codigo">{equipo.id}</span>
                    <span className={`catalogo-estado ${equipo.disponible ? 'catalogo-estado-disponible' : 'catalogo-estado-no-disponible'}`}>
                      {equipo.disponible ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                  <h2>{equipo.nombre}</h2>
                  <p className="sutil">{equipo.tipo} · {equipo.modelo}</p>
                  <div className="catalogo-tarjeta-pie">
                    <span className="catalogo-precio"><small>PRECIO POR DÍA</small><strong>{pesos(equipo.precioPorDia)}</strong></span>
                    <span className="catalogo-tarjeta-ver">Ver detalle →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="tarjeta catalogo-vacio">
            <p>No hay equipos con esos filtros</p>
            <button type="button" className="boton boton-secundario" onClick={() => setFiltros(filtrosIniciales)}>
              Limpiar filtros
            </button>
          </div>
        )
      )}
    </div>
  );
}
