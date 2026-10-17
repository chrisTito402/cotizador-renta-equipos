import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  guardarCartaFirmada,
  iniciarPreparacion,
  marcarPreparacionCompletada,
  obtenerApartado,
  obtenerCartaFirmada,
  obtenerEstadoDocumental,
  EVENTO_APARTADOS_ACTUALIZADOS,
  registrarEnvioCarta,
  registrarGeneracionCarta,
} from '../../servicios/apartados.js';
import { crearPDFCartaResponsiva } from '../../utilidades/generarCartaResponsiva.js';
import { crearPDFDocumentoCobro } from '../../utilidades/generarDocumentoCobro.js';
import { fechaCorta } from '../../utilidades/formato.js';
import './apartados.css';

function fechaHora(iso) {
  return iso ? new Date(iso).toLocaleString('es-MX') : '';
}

export default function DetalleApartado() {
  const { id } = useParams();
  const [apartado, setApartado] = useState(null);
  const [documentos, setDocumentos] = useState(null);
  const [carta, setCarta] = useState(null);
  const [archivoCarta, setArchivoCarta] = useState(null);
  const [error, setError] = useState('');
  const [errorArchivo, setErrorArchivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [urlCarta, setUrlCarta] = useState('');

  const cargar = async () => {
    setError('');
    setErrorArchivo('');
    let actual;
    try {
      actual = obtenerApartado(id);
      if (actual?.estado === 'Apartado') actual = iniciarPreparacion(id);
      setApartado(actual);
      if (!actual) {
        setError(`No existe el apartado ${id}.`);
        return;
      }
    } catch (e) {
      setError(e.message);
      return;
    }
    try {
      const [estadoDocumental, cartaGuardada] = await Promise.all([
        obtenerEstadoDocumental(id),
        obtenerCartaFirmada(id),
      ]);
      setDocumentos(estadoDocumental);
      setCarta(cartaGuardada);
    } catch (e) {
      setErrorArchivo(e.message);
    }
  };

  useEffect(() => {
    cargar();
  }, [id]);

  useEffect(() => {
    if (!carta?.archivo) {
      setUrlCarta('');
      return undefined;
    }
    const url = URL.createObjectURL(carta.archivo);
    setUrlCarta(url);
    return () => URL.revokeObjectURL(url);
  }, [carta]);

  useEffect(() => {
    const actualizar = (evento) => {
      if (!evento.key || evento.key === 'cotizador:apartados') cargar();
    };
    window.addEventListener(EVENTO_APARTADOS_ACTUALIZADOS, cargar);
    window.addEventListener('storage', actualizar);
    return () => {
      window.removeEventListener(EVENTO_APARTADOS_ACTUALIZADOS, cargar);
      window.removeEventListener('storage', actualizar);
    };
  }, [id]);

  const ejecutar = async (operacion, errorEstado = setError) => {
    errorEstado('');
    setGuardando(true);
    try {
      await operacion();
      await cargar();
    } catch (e) {
      errorEstado(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const descargarPDFCarta = () => ejecutar(async () => {
    const pdf = await crearPDFCartaResponsiva(apartado);
    await registrarGeneracionCarta(id);
    pdf.save(`carta-responsiva-${apartado.id}.pdf`);
  });

  const abrirPDFParaImprimir = () => ejecutar(async () => {
    const pdf = await crearPDFCartaResponsiva(apartado);
    await registrarGeneracionCarta(id);
    const ventana = window.open(pdf.output('bloburl'), '_blank');
    if (!ventana) throw new Error('El navegador bloqueó la ventana. Permite ventanas emergentes e inténtalo otra vez.');
  });

  const abrirWhatsApp = () => {
    const telefono = String(apartado.cliente?.telefono || '').replace(/\D/g, '');
    if (!telefono) {
      setError('El cliente no tiene un teléfono disponible para preparar WhatsApp.');
      return;
    }
    const numero = telefono.length === 10 ? `52${telefono}` : telefono;
    const mensaje = `Hola ${apartado.cliente?.nombreCompleto || ''}, te comparto la carta responsiva del apartado ${apartado.id}. Puedes adjuntar aquí el PDF descargado.`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer');
  };

  const enviarCarta = () => {
    if (!window.confirm('Confirma que ya enviaste la carta al cliente por el medio externo.')) return;
    ejecutar(() => registrarEnvioCarta(id), setErrorArchivo);
  };

  const subirCarta = (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    if (!archivoCarta) {
      setErrorArchivo('Selecciona el PDF firmado antes de guardarlo.');
      return;
    }
    ejecutar(async () => {
      await guardarCartaFirmada(id, archivoCarta);
      setArchivoCarta(null);
      formulario.reset();
    }, setErrorArchivo);
  };

  const completarPreparacion = () => ejecutar(() => marcarPreparacionCompletada(id), setErrorArchivo);

  const generarFacturaPDF = async () => {
    const pdf = await crearPDFDocumentoCobro(apartado);
    pdf.save(`factura-${apartado.id}.pdf`);
  };

  const enviarFacturaPorWhatsApp = async () => {
    setErrorArchivo('');
    const ventana = window.open('about:blank', '_blank');
    if (ventana) ventana.opener = null;
    try {
      const pdf = await crearPDFDocumentoCobro(apartado);
      pdf.save(`factura-${apartado.id}.pdf`);
      if (!ventana) {
        throw new Error('Se descargó el PDF, pero el navegador bloqueó la ventana de WhatsApp. Permite ventanas emergentes e inténtalo otra vez.');
      }
      const telefono = String(apartado.cliente?.telefono || '').replace(/\D/g, '');
      const numero = !telefono ? '' : telefono.length === 10 ? `52${telefono}` : telefono;
      const saludo = apartado.cliente?.nombreCompleto ? `Hola ${apartado.cliente.nombreCompleto}, ` : 'Hola, ';
      const mensaje = `${saludo}te comparto la factura de la renta ${apartado.id}. Adjunta el PDF que se descargó.`;
      ventana.location.href = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    } catch (e) {
      ventana?.close();
      setErrorArchivo(`No fue posible preparar la factura para WhatsApp: ${e.message}`);
    }
  };

  if (!apartado) {
    return (
      <section className="pagina-apartados">
        <Link to="/admin/apartados">← Volver a apartados</Link>
        {error && <p className="msg-error aviso-apartados" role="alert">{error}</p>}
      </section>
    );
  }

  const whatsappDisponible = Boolean(String(apartado.cliente?.telefono || '').replace(/\D/g, ''));
  const entregaConfirmada = Boolean(apartado.entrega);
  const documentosListos = Boolean(documentos?.puedeConfirmar);
  const mostrarPreparacionDocumentos = !entregaConfirmada
    && (!apartado.preparacionCompletada || !documentosListos);
  const mostrarSeguimientoEntrega = !entregaConfirmada
    && apartado.preparacionCompletada
    && documentosListos;

  return (
    <section className="pagina-apartados">
      <Link to="/admin/apartados">← Volver a apartados</Link>
      <div className="encabezado detalle-apartado-encabezado">
        <div>
          <h1>Apartado {apartado.id}</h1>
          <p className="sutil">Cotización {apartado.cotizacionId} · creado {fechaCorta(apartado.fechaCreacion)}</p>
        </div>
        <span className="estado estado-apartado">{apartado.estado}</span>
      </div>

      {error && <p className="msg-error aviso-apartados" role="alert">{error}</p>}
      {errorArchivo && <p className="msg-error aviso-apartados" role="alert">{errorArchivo}</p>}

      <div className="apartado-detalle-grid">
        <div className="tarjeta">
          <h2>Cliente</h2>
          <dl className="datos-apartado">
            <dt>Nombre</dt><dd>{apartado.cliente?.nombreCompleto || 'Pendiente'}</dd>
            <dt>Teléfono</dt><dd>{apartado.cliente?.telefono || 'Pendiente'}</dd>
            <dt>Correo</dt><dd>{apartado.cliente?.correo || 'Pendiente'}</dd>
            <dt>Municipio</dt><dd>{apartado.municipio || 'Pendiente'}</dd>
          </dl>
        </div>
        <div className="tarjeta">
          <h2>Operación</h2>
          <dl className="datos-apartado">
            <dt>Fecha de renta</dt><dd>{fechaCorta(apartado.fechaInicio) || 'Pendiente'} – {fechaCorta(apartado.fechaFin) || 'Pendiente'}</dd>
            <dt>Estado</dt><dd>{apartado.estado}</dd>
            <dt>Cotización</dt><dd>{apartado.cotizacionId}</dd>
          </dl>
          <h3>Equipo(s)</h3>
          <ul className="lista-equipos-apartado">
            {apartado.equipos.map((equipo) => (
              <li key={equipo.equipoId}>
                <strong>{equipo.nombre}</strong> ({equipo.modelo || 'Modelo pendiente'}) · Cantidad: {equipo.cantidad}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {mostrarPreparacionDocumentos && (
      <div className="tarjeta apartado-seccion">
        <h2>Preparación y carta responsiva</h2>
        <p className="sutil">Generar, descargar o abrir el PDF no registra su envío. WhatsApp se prepara para que el administrador lo envíe manualmente.</p>
        {!documentos?.cartaGenerada && (
          <div className="acciones-apartado">
            <button className="boton" onClick={descargarPDFCarta} disabled={guardando}>Descargar carta PDF</button>
            <button className="boton boton-secundario" onClick={abrirPDFParaImprimir} disabled={guardando}>Abrir carta para imprimir</button>
            <button className="boton boton-secundario" onClick={abrirWhatsApp} disabled={!whatsappDisponible}>Preparar WhatsApp</button>
          </div>
        )}
        {!whatsappDisponible && !documentos?.cartaGenerada && <p className="sutil">No hay teléfono disponible para WhatsApp.</p>}
        {documentos?.cartaGenerada && !documentos?.cartaEnviada && (
          <button className="boton boton-secundario" onClick={enviarCarta} disabled={!apartado.cartaGeneradaEn || guardando}>
            Confirmar que la carta fue enviada
          </button>
        )}
        {!documentos?.cartaFirmada && (
          <div className="subir-carta">
            <h3>Carta firmada</h3>
            <p className="sutil">Cuando recibas la carta firmada, súbela aquí para habilitar la confirmación del cliente.</p>
            <form className="formulario-carta" onSubmit={subirCarta}>
              <label>Subir o reemplazar PDF firmado
                <input type="file" accept="application/pdf,.pdf" onChange={(evento) => setArchivoCarta(evento.target.files?.[0] || null)} />
              </label>
              <button className="boton boton-secundario" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar carta firmada'}</button>
            </form>
            <p className="sutil nota-almacenamiento">El PDF se conserva en IndexedDB de este navegador; no se sincroniza con otros dispositivos.</p>
          </div>
        )}
        {documentos?.cartaFirmada && carta && (
          <p className="estado-documento-apartado">
            Carta firmada cargada · {carta.nombre}
            {urlCarta && <> · <a href={urlCarta} target="_blank" rel="noreferrer">Consultar documento</a></>}
          </p>
        )}
        <div className="preparacion-apartado">
          <div>
            <strong>{apartado.preparacionCompletada ? 'Preparación completada' : 'Preparación pendiente'}</strong>
            <p className="sutil">La preparación no registra la entrega física ni sustituye la confirmación del cliente.</p>
          </div>
          {!apartado.preparacionCompletada && (
            <button className="boton" onClick={completarPreparacion} disabled={guardando}>
              Marcar preparación completada
            </button>
          )}
        </div>
      </div>
      )}

      {mostrarSeguimientoEntrega && (
        <div className="tarjeta apartado-seccion" id="seguimiento-entrega">
          <h2>Seguimiento de entrega</h2>
          <p className="sutil">Preparación y documentación completadas. Entrega pendiente de confirmación por el cliente desde «Mis rentas».</p>
        </div>
      )}

      {entregaConfirmada && (
        <div className="tarjeta tarjeta-factura">
          <div className="encabezado-factura">
            <div className="icono-factura" aria-hidden="true">F</div>
            <div>
              <h2>Factura</h2>
              <p className="sutil">PDF no fiscal con los datos de esta renta</p>
            </div>
          </div>
          <dl className="datos-apartado resumen-factura">
            <dt>Cliente</dt><dd>{apartado.cliente?.nombreCompleto || 'Pendiente'}</dd>
            <dt>Estado de entrega</dt><dd>{apartado.estado}</dd>
            <dt>Condición recibida</dt><dd>{apartado.entrega.condicion}</dd>
            <dt>Observaciones</dt><dd>{apartado.entrega.observaciones || 'Sin observaciones'}</dd>
            <dt>Confirmado</dt><dd>{fechaHora(apartado.entrega.confirmadoEn)}</dd>
            <dt>Equipo(s)</dt><dd>{apartado.equipos.map((equipo) => `${equipo.nombre} × ${equipo.cantidad}`).join(', ')}</dd>
          </dl>
          <div className="acciones-factura">
            <button className="boton boton-secundario" onClick={generarFacturaPDF}>
              Descargar factura PDF
            </button>
            <button className="boton" onClick={enviarFacturaPorWhatsApp}>
              Enviar por WhatsApp
            </button>
          </div>
          <p className="sutil">WhatsApp abrirá el chat del cliente y descargará el PDF para que puedas adjuntarlo. Este documento no es una factura fiscal.</p>
        </div>
      )}
    </section>
  );
}
