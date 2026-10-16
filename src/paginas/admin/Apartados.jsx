import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  crearApartado,
  obtenerApartados,
  obtenerCotizacionesParaApartado,
  obtenerMetadatosCartasFirmadas,
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

      <div className="tarjeta apartado-seccion">
        <h2>Cotizaciones</h2>
        <p className="sutil">Las aceptaciones de prueba no modifican el registro de cotizaciones.</p>
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

      <div className="tarjeta tabla-wrap apartado-seccion">
        <div className="apartado-subtitulo">
          <div>
            <h2>Apartados y seguimiento</h2>
            <p className="sutil">Reserva, renta y devolución del equipo.</p>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Folio</th><th>Cotización</th><th>Cliente</th><th>Equipo(s)</th><th>Creado</th><th>Periodo</th><th>Estado</th><th>Carta</th><th></th></tr>
          </thead>
          <tbody>
            {apartadosConCarta.map((apartado) => (
              <tr key={apartado.id}>
                <td className="folio">{apartado.id}</td>
                <td>{apartado.cotizacionId}</td>
                <td>{apartado.cliente?.nombreCompleto || 'Pendiente'}</td>
                <td>{apartado.equipos.map((equipo) => `${equipo.nombre} × ${equipo.cantidad}`).join(', ')}</td>
                <td>{fechaCorta(apartado.fechaCreacion)}</td>
                <td>{fechaCorta(apartado.fechaInicio) || 'Pendiente'} – {fechaCorta(apartado.fechaFin) || 'Pendiente'}</td>
                <td><span className="estado estado-apartado">{apartado.estado}</span></td>
                <td>{apartado.carta ? 'Firmada' : 'Pendiente'}</td>
                <td><Link to={`/admin/apartados/${apartado.id}`}>Detalle</Link></td>
              </tr>
            ))}
            {apartadosConCarta.length === 0 && <tr><td colSpan="9">Todavía no hay apartados. Usa una cotización aprobada o simula su aceptación.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
