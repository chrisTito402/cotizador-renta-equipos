import { useEffect, useState } from 'react';
import {
  confirmarEntregaCliente,
  EVENTO_APARTADOS_ACTUALIZADOS,
  listarRentasCliente,
  obtenerEstadoDocumental,
} from '../../servicios/apartados.js';
import { fechaCorta } from '../../utilidades/formato.js';

const CONDICIONES = [
  { nombre: 'Excelente', descripcion: 'Llegaron rápido; la maquinaria está en buen estado y con buen mantenimiento.' },
  { nombre: 'Moderado', descripcion: 'Llegaron con algunos detalles; no se ven tan bien.' },
  { nombre: 'Bajo', descripcion: 'Se ven en mal estado y tardaron en llegar.' },
];

function fechaHora(iso) {
  return iso ? new Date(iso).toLocaleString('es-MX') : '';
}

export default function MisRentas() {
  const [correo, setCorreo] = useState('');
  const [correoConsultado, setCorreoConsultado] = useState('');
  const [rentas, setRentas] = useState([]);
  const [documentos, setDocumentos] = useState({});
  const [apartadoAbierto, setApartadoAbierto] = useState('');
  const [condicion, setCondicion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const consultar = async (email) => {
    const lista = listarRentasCliente(email);
    const estados = await Promise.all(lista.map(async (apartado) => [
      apartado.id,
      await obtenerEstadoDocumental(apartado.id),
    ]));
    setRentas(lista);
    setDocumentos(Object.fromEntries(estados));
    setCorreoConsultado(email.trim());
  };

  useEffect(() => {
    if (!correoConsultado) return undefined;
    const actualizar = async (evento) => {
      if (evento.key && evento.key !== 'cotizador:apartados') return;
      try {
        await consultar(correoConsultado);
      } catch (e) {
        setError(e.message);
      }
    };
    window.addEventListener(EVENTO_APARTADOS_ACTUALIZADOS, actualizar);
    window.addEventListener('storage', actualizar);
    return () => {
      window.removeEventListener(EVENTO_APARTADOS_ACTUALIZADOS, actualizar);
      window.removeEventListener('storage', actualizar);
    };
  }, [correoConsultado]);

  const buscarRentas = async (evento) => {
    evento.preventDefault();
    setError('');
    setMensaje('');
    setApartadoAbierto('');
    try {
      await consultar(correo);
    } catch (e) {
      setRentas([]);
      setError(e.message);
    }
  };

  const confirmar = async (evento, apartadoId) => {
    evento.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);
    try {
      await confirmarEntregaCliente(apartadoId, correoConsultado, condicion, observaciones);
      setMensaje(`La recepción del apartado ${apartadoId} quedó confirmada.`);
      setApartadoAbierto('');
      setCondicion('');
      setObservaciones('');
      await consultar(correoConsultado);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="pagina-rentas-cliente">
      <div className="encabezado">
        <div>
          <h1>Mis rentas</h1>
          <p className="sutil">Consulta tus apartados y confirma la recepción de los equipos cuando la documentación esté lista.</p>
        </div>
      </div>

      <p className="aviso-demo-cliente">
        MVP simulado: escribe el correo relacionado con la cotización. Esta pantalla no inicia sesión ni verifica identidad;
        cualquier persona que conozca un correo podría consultar sus rentas en este navegador.
      </p>

      <form className="tarjeta formulario-consulta-rentas" onSubmit={buscarRentas}>
        <label htmlFor="correo-rentas">Correo de la cotización</label>
        <div className="acciones-apartado">
          <input id="correo-rentas" type="email" required value={correo} onChange={(evento) => setCorreo(evento.target.value)} />
          <button className="boton" type="submit">Consultar rentas</button>
        </div>
      </form>

      {error && <p className="msg-error aviso-apartados" role="alert">{error}</p>}
      {mensaje && <p className="mensaje-exito-rentas" role="status">{mensaje}</p>}

      {correoConsultado && rentas.length === 0 && !error && (
        <div className="tarjeta"><p>No hay rentas asociadas a ese correo en este navegador.</p></div>
      )}

      {rentas.map((apartado) => {
        const estadoDocs = documentos[apartado.id];
        const entregaConfirmada = Boolean(apartado.entrega && apartado.estado === 'Entregado');
        const puedeConfirmar = Boolean(estadoDocs?.puedeConfirmar && !entregaConfirmada);
        return (
          <article className="tarjeta tarjeta-renta-cliente" key={apartado.id}>
            <div className="encabezado-renta-cliente">
              <div>
                <h2>Apartado {apartado.id}</h2>
                <p className="sutil">Cotización {apartado.cotizacionId} · {fechaCorta(apartado.fechaInicio) || 'Fecha pendiente'} – {fechaCorta(apartado.fechaFin) || 'Fecha pendiente'}</p>
              </div>
              <span className="estado estado-apartado">{apartado.estado}</span>
            </div>
            <div className="maquinaria-rentada">
              <h3>Maquinaria rentada</h3>
              <ul>
                {apartado.equipos.map((equipo) => (
                  <li key={equipo.equipoId}>
                    <span className="icono-maquinaria" aria-hidden="true">M</span>
                    <span>
                      <strong>{equipo.nombre}</strong>
                      <small>{equipo.modelo || 'Modelo pendiente'} · Cantidad: {equipo.cantidad}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {apartado.municipio && <p><strong>Municipio:</strong> {apartado.municipio}</p>}

            {entregaConfirmada ? (
              <div className="resumen-entrega-cliente">
                <h3>Recepción confirmada</h3>
                <p><strong>Condición recibida:</strong> {apartado.entrega.condicion}</p>
                <p><strong>Observaciones:</strong> {apartado.entrega.observaciones || 'Sin observaciones'}</p>
                <p><strong>Fecha:</strong> {fechaHora(apartado.entrega.confirmadoEn)}</p>
              </div>
            ) : puedeConfirmar ? (
              apartadoAbierto === apartado.id ? (
                <form className="formulario-confirmacion-entrega" onSubmit={(evento) => confirmar(evento, apartado.id)}>
                  <fieldset className="opciones-condicion-entrega">
                    <legend>¿En qué condición recibiste la maquinaria?</legend>
                    {CONDICIONES.map((opcion) => (
                      <label className={`tarjeta-condicion-entrega ${condicion === opcion.nombre ? 'seleccionada' : ''}`} key={opcion.nombre}>
                        <input
                          type="radio"
                          name={`condicion-${apartado.id}`}
                          value={opcion.nombre}
                          checked={condicion === opcion.nombre}
                          onChange={(evento) => setCondicion(evento.target.value)}
                          required
                        />
                        <span className={`indicador-condicion indicador-${opcion.nombre.toLowerCase()}`} aria-hidden="true" />
                        <span className="texto-condicion-entrega">
                          <strong>{opcion.nombre}</strong>
                          <span>{opcion.descripcion}</span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <label htmlFor={`observaciones-${apartado.id}`}>Descripción u observaciones (opcional)</label>
                  <textarea
                    id={`observaciones-${apartado.id}`}
                    rows="4"
                    value={observaciones}
                    onChange={(evento) => setObservaciones(evento.target.value)}
                    placeholder="Describe la condición o algún detalle que hayas detectado."
                  />
                  <div className="acciones-apartado">
                    <button className="boton" type="submit" disabled={cargando || !condicion}>
                      {cargando ? 'Guardando…' : 'Aceptar y confirmar entrega'}
                    </button>
                    <button className="boton boton-secundario" type="button" onClick={() => setApartadoAbierto('')} disabled={cargando}>
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button className="boton" onClick={() => {
                  setApartadoAbierto(apartado.id);
                  setCondicion('');
                  setObservaciones('');
                }}>
                  Confirmar entrega
                </button>
              )
            ) : (
              <div className="estado-documental-cliente">
                <p className="sutil">Confirmación pendiente: el administrador debe completar estos requisitos.</p>
                <ul className="checklist-apartado">
                  <li>{estadoDocs?.preparacionCompletada ? '✓' : '○'} Preparación completada</li>
                  <li>{estadoDocs?.cartaGenerada ? '✓' : '○'} Carta responsiva generada</li>
                  <li>{estadoDocs?.cartaEnviada ? '✓' : '○'} Carta enviada</li>
                  <li>{estadoDocs?.cartaFirmada ? '✓' : '○'} Carta firmada cargada</li>
                </ul>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
