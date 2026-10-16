import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  actualizarEstadoApartado,
  guardarCartaFirmada,
  obtenerApartado,
  obtenerCartaFirmada,
  obtenerEstadosRenta,
} from '../../servicios/apartados.js';
import { crearPDFCartaResponsiva } from '../../utilidades/generarCartaResponsiva.js';
import { fechaCorta } from '../../utilidades/formato.js';
import './apartados.css';

export default function DetalleApartado() {
  const { id } = useParams();
  const [apartado, setApartado] = useState(null);
  const [carta, setCarta] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [errorArchivo, setErrorArchivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [urlCarta, setUrlCarta] = useState('');
  const estados = obtenerEstadosRenta();

  const cargar = async () => {
    setError('');
    setErrorArchivo('');
    try {
      const actual = obtenerApartado(id);
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
      setCarta(await obtenerCartaFirmada(id));
    } catch (e) {
      setCarta(null);
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

  const descargarPDF = async () => {
    setError('');
    try {
      const pdf = await crearPDFCartaResponsiva(apartado);
      pdf.save(`carta-responsiva-${apartado.id}.pdf`);
    } catch (e) {
      setError(`No fue posible generar o descargar el PDF: ${e.message}`);
    }
  };

  const abrirPDFParaImprimir = async () => {
    setError('');
    try {
      const pdf = await crearPDFCartaResponsiva(apartado);
      const url = pdf.output('bloburl');
      const ventana = window.open(url, '_blank');
      if (!ventana) throw new Error('El navegador bloqueó la ventana. Permite ventanas emergentes e inténtalo otra vez.');
    } catch (e) {
      setError(`No fue posible abrir el PDF para imprimir: ${e.message}`);
    }
  };

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

  const subirCarta = async (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    setErrorArchivo('');
    if (!archivo) {
      setErrorArchivo('Selecciona el PDF firmado antes de guardarlo.');
      return;
    }
    setGuardando(true);
    try {
      await guardarCartaFirmada(id, archivo);
      setArchivo(null);
      formulario.reset();
      await cargar();
    } catch (e) {
      setErrorArchivo(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const avanzarEstado = async () => {
    const siguiente = estados[estados.indexOf(apartado.estado) + 1];
    if (!siguiente) return;
    setError('');
    try {
      await actualizarEstadoApartado(id, siguiente);
      await cargar();
    } catch (e) {
      setError(e.message);
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

  const siguienteEstado = estados[estados.indexOf(apartado.estado) + 1];
  const whatsappDisponible = Boolean(String(apartado.cliente?.telefono || '').replace(/\D/g, ''));

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

      <div className="tarjeta apartado-seccion">
        <h2>Carta responsiva</h2>
        <p className="sutil">El PDF incluye los datos disponibles y espacios para completar fecha y firmas; no añade condiciones legales.</p>
        <div className="acciones-apartado">
          <button className="boton" onClick={descargarPDF}>Descargar PDF</button>
          <button className="boton boton-secundario" onClick={abrirPDFParaImprimir}>Abrir PDF para imprimir</button>
          <button className="boton boton-secundario" onClick={abrirWhatsApp} disabled={!whatsappDisponible}>Preparar WhatsApp</button>
        </div>
        {!whatsappDisponible && <p className="sutil">No hay teléfono disponible para WhatsApp.</p>}
        <div className="subir-carta">
          <h3>Carta firmada</h3>
          {carta ? (
            <div className="carta-guardada">
              <p><strong>Firmada:</strong> {carta.nombre} · {fechaCorta(carta.fechaSubida)}</p>
              {urlCarta && <a href={urlCarta} target="_blank" rel="noreferrer">Consultar carta firmada</a>}
            </div>
          ) : <p className="sutil">Estado: pendiente de firma.</p>}
          {errorArchivo && <p className="msg-error" role="alert">{errorArchivo}</p>}
          <form className="formulario-carta" onSubmit={subirCarta}>
            <label>Subir o reemplazar PDF firmado
              <input type="file" accept="application/pdf,.pdf" onChange={(evento) => setArchivo(evento.target.files?.[0] || null)} />
            </label>
            <button className="boton boton-secundario" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar carta firmada'}</button>
          </form>
          <p className="sutil nota-almacenamiento">El archivo se conserva en IndexedDB de este navegador; no se sincroniza con otros dispositivos.</p>
        </div>
      </div>

      <div className="tarjeta apartado-seccion">
        <h2>Seguimiento de renta</h2>
        <p className="sutil">Los estados se actualizan manualmente. La carta firmada es necesaria antes de iniciar la renta.</p>
        <div className="seguimiento-apartado">
          <ol>
            {estados.map((estado) => (
              <li key={estado} className={estado === apartado.estado ? 'estado-actual' : ''}>{estado}</li>
            ))}
          </ol>
          {siguienteEstado
            ? <button className="boton" onClick={avanzarEstado}>Marcar como “{siguienteEstado}”</button>
            : <strong>Proceso cerrado</strong>}
        </div>
      </div>
    </section>
  );
}
