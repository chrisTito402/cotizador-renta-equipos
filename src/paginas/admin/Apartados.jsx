import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  crearApartado,
  obtenerApartados,
  obtenerCotizacionesParaApartado,
  obtenerMetadatosCartasFirmadas,
  EVENTO_APARTADOS_ACTUALIZADOS,
  registrarAceptacionSimulada,
} from '../../servicios/apartados.js';
import { fechaCorta } from '../../utilidades/formato.js';
import './apartados.css';

export default function Apartados() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [apartados, setApartados] = useState([]);
  const [cartas, setCartas] = useState([]);
  const [error, setError] = useState('');
  const [errorCartas, setErrorCartas] = useState('');

  const cargar = async () => {
    setError('');
    try {
      setCotizaciones(obtenerCotizacionesParaApartado());
      setApartados(obtenerApartados());
    } catch (e) {
      setError(e.message);
    }
    try {
      setCartas(await obtenerMetadatosCartasFirmadas());
      setErrorCartas('');
    } catch (e) {
      setCartas([]);
      setErrorCartas(e.message);
    }
  };

  useEffect(() => {
    cargar();
    const actualizar = (evento) => {
      if (!evento.key || evento.key === 'cotizador:apartados') cargar();
    };
    window.addEventListener(EVENTO_APARTADOS_ACTUALIZADOS, cargar);
    window.addEventListener('storage', actualizar);
    return () => {
      window.removeEventListener(EVENTO_APARTADOS_ACTUALIZADOS, cargar);
      window.removeEventListener('storage', actualizar);
    };
  }, []);

  const aceptarSimulado = async (cotizacionId) => {
    setError('');
    try {
      registrarAceptacionSimulada(cotizacionId);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const crear = async (cotizacionId) => {
    setError('');
    try {
      crearApartado(cotizacionId);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const apartadosConCarta = apartados.map((apartado) => ({
    ...apartado,
    carta: cartas.find((carta) => carta.apartadoId === apartado.id) || null,
  }));

  return (
    <section className="pagina-apartados">
      <div className="encabezado">
        <div>
          <h1>Apartados y rentas</h1>
          <p className="sutil">Simula la aceptación de una cotización y administra el proceso del equipo.</p>
        </div>
      </div>

      {error && <p className="msg-error aviso-apartados" role="alert">{error}</p>}
      {errorCartas && <p className="msg-error aviso-apartados" role="alert">No se pudo consultar el estado de las cartas: {errorCartas}</p>}

      <details className="tarjeta seccion-desplegable">
        <summary className="resumen-seccion-desplegable">
          <span>
            <strong>Cotizaciones</strong>
            <small>Las aceptaciones de prueba no modifican el registro de cotizaciones.</small>
          </span>
          <span className="contador-seccion">{cotizaciones.length} cotizaciones</span>
        </summary>
        <div className="contenido-seccion-desplegable">
          <div className="tabla-wrap">
          <table>
            <thead>
              <tr><th>Folio</th><th>Cliente</th><th>Equipo(s)</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {cotizaciones.map((cotizacion) => (
                <tr key={cotizacion.id}>
                  <td className="folio">{cotizacion.id}</td>
                  <td>{cotizacion.cliente?.nombreCompleto || 'Pendiente'}</td>
                  <td>{(cotizacion.lineas || []).map((linea) => {
                    const nombre = linea.equipoId
                      ? (cotizacion.equipos?.find((equipo) => equipo.equipoId === linea.equipoId)?.nombre || linea.equipoId)
                      : 'Equipo pendiente';
                    return `${nombre} × ${linea.cantidad || 1}`;
                  }).join(', ') || 'Pendiente'}</td>
                  <td>{cotizacion.aceptada ? 'Aceptada' : cotizacion.estado}</td>
                  <td className="acciones-apartado">
                    {cotizacion.apartadoId ? (
                      <Link className="boton boton-secundario" to={`/admin/apartados/${cotizacion.apartadoId}`}>Ver apartado</Link>
                    ) : cotizacion.aceptada ? (
                      <button className="boton" onClick={() => crear(cotizacion.id)}>Crear apartado</button>
                    ) : cotizacion.estado === 'Pendiente' ? (
                      <button className="boton boton-secundario" onClick={() => aceptarSimulado(cotizacion.id)}>Simular aceptación</button>
                    ) : <span className="sutil">No disponible</span>}
                  </td>
                </tr>
              ))}
              {cotizaciones.length === 0 && <tr><td colSpan="5">No hay cotizaciones disponibles.</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      </details>

      <details className="tarjeta seccion-desplegable">
        <summary className="resumen-seccion-desplegable">
          <span>
            <strong>Apartados y seguimiento</strong>
            <small>Reserva, renta y devolución del equipo.</small>
          </span>
          <span className="contador-seccion">{apartados.length} apartados</span>
        </summary>
        <div className="contenido-seccion-desplegable tabla-wrap">
          <table>
          <thead>
            <tr><th>Folio</th><th>Cotización</th><th>Cliente</th><th>Equipo(s)</th><th>Creado</th><th>Periodo</th><th>Estado</th><th>Carta</th><th></th></tr>
          </thead>
          <tbody>
            {apartadosConCarta.map((apartado) => {
              const terminal = ['Entregado', 'En renta', 'Pendiente de devolución', 'Devuelto', 'Cerrado'].includes(apartado.estado);
              return (
                <tr key={apartado.id}>
                  <td className="folio">{apartado.id}</td>
                  <td>{apartado.cotizacionId}</td>
                  <td>{apartado.cliente?.nombreCompleto || 'Pendiente'}</td>
                  <td>{apartado.equipos.map((equipo) => `${equipo.nombre} × ${equipo.cantidad}`).join(', ')}</td>
                  <td>{fechaCorta(apartado.fechaCreacion)}</td>
                  <td>{fechaCorta(apartado.fechaInicio) || 'Pendiente'} – {fechaCorta(apartado.fechaFin) || 'Pendiente'}</td>
                  <td>
                    <span className="estado estado-apartado">{apartado.estado}</span>
                    {apartado.entrega && <span className="aviso-entrega-cliente">Cliente confirmó</span>}
                  </td>
                  <td>
                    {errorCartas
                      ? 'No disponible'
                      : apartado.carta
                        ? 'Firmada'
                        : apartado.cartaEnviadaEn
                          ? 'Enviada'
                          : apartado.cartaGeneradaEn
                            ? 'Generada'
                            : 'Pendiente'}
                  </td>
                  <td className="acciones-apartado">
                    {apartado.preparacionCompletada ? (
                      <span className="accion-entrega-cliente">
                        <button className="boton boton-secundario" type="button" disabled title="La entrega solo puede registrarla el cliente">
                          Registrar entrega
                        </button>
                        <small>Solo el cliente</small>
                      </span>
                    ) : terminal ? (
                      <button className="boton boton-secundario" type="button" disabled>
                        Renta cerrada
                      </button>
                    ) : (
                      <Link className="boton boton-secundario" to={`/admin/apartados/${apartado.id}`}>
                        Preparar
                      </Link>
                    )}
                    <Link to={`/admin/apartados/${apartado.id}`}>Detalle</Link>
                  </td>
                </tr>
              );
            })}
            {apartadosConCarta.length === 0 && <tr><td colSpan="9">Todavía no hay apartados. Usa una cotización aprobada o simula su aceptación.</td></tr>}
          </tbody>
        </table>
        </div>
      </details>
    </section>
  );
}
