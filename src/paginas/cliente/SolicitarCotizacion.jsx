// DUEÑO: Cris · RAMA: feature/cotizacion-web (diseño del Figma y fechas por equipo: feature/fechas-por-equipo)
// Al elegir municipio, el envío se suma al total que ve el cliente, pero no se muestra su fila ni su monto
// (el panel admin sí lo ve).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import FormularioCliente, { CLIENTE_VACIO, validarFormularioCliente } from '../../componentes/FormularioCliente.jsx';
import LineaCotizacion from '../../componentes/LineaCotizacion.jsx';
import { CampoNotas } from '../../componentes/CamposCotizacion.jsx';
import { calcularCotizacionSegura } from '../../logica/calcularCotizacion.js';
import {
  obtenerCarrito, actualizarLineaCarrito, quitarDelCarrito, vaciarCarrito, guardarCotizacion,
} from '../../servicios/almacen.js';
import { pesos } from '../../utilidades/formato.js';
import './solicitarCotizacion.css';

const NOTA_MUNICIPIO = 'Un solo envío para todos tus equipos; se suma al total estimado.';
const avisoTotal = (municipio) => (municipio
  ? `Incluye el envío a ${municipio}. El área comercial te confirma el total final.`
  : 'Elige tu municipio de entrega para sumar el envío al total.');

function Pasos({ fechasListas }) {
  return (
    <ol className="solicitud-pasos" aria-label="Pasos">
      <li className="hecho">✓ Equipos</li>
      <li className={fechasListas ? 'hecho' : ''}>{fechasListas ? '✓' : '2'} Fechas</li>
      <li className="actual" aria-current="step">3 Tus datos</li>
    </ol>
  );
}

export default function SolicitarCotizacion() {
  const [carrito, setCarrito] = useState(obtenerCarrito);
  const [cliente, setCliente] = useState(CLIENTE_VACIO);
  const [notas, setNotas] = useState('');
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [errorLinea, setErrorLinea] = useState(null);
  const [abierta, setAbierta] = useState(null);
  const [guardada, setGuardada] = useState(null);

  if (guardada) {
    return (
      <div className="tarjeta solicitud-lista" role="status">
        <h1>Recibimos tu solicitud</h1>
        <p>Tu folio es <span className="folio">{guardada.id}</span>.</p>
        <p>Total estimado: <strong>{pesos(guardada.desglose.total)}</strong></p>
        <p className="sutil">{avisoTotal(guardada.cliente.municipio)}</p>
        <p className="sutil">El área comercial te contactará para confirmar tu renta.</p>
        <Link className="boton" to="/">Volver al catálogo</Link>
      </div>
    );
  }

  if (carrito.lineas.length === 0) {
    return (
      <div className="tarjeta solicitud-lista">
        <h1>Solicitud de cotización</h1>
        <p>Todavía no agregas equipos.</p>
        <Link className="boton" to="/">Ver el catálogo</Link>
      </div>
    );
  }

  const { lineas } = carrito;
  // Sin municipio el total es solo la renta; con municipio ya trae el envío sumado.
  // Si el municipio está fuera de zona, se queda la renta y se muestra el aviso.
  const soloRenta = calcularCotizacionSegura({ lineas });
  const conEnvio = cliente.municipio ? calcularCotizacionSegura({ lineas, municipio: cliente.municipio }) : null;
  const desglose = conEnvio?.desglose || soloRenta.desglose;
  const errorCalculo = soloRenta.error;
  const errorEnvio = conEnvio?.error || '';
  const sinFechas = lineas.filter((l) => !l.fechaInicio || !l.fechaFin).length;

  const guardarLinea = (linea) => {
    setCarrito(actualizarLineaCarrito(linea.id, { cantidad: linea.cantidad, fechaInicio: linea.fechaInicio, fechaFin: linea.fechaFin }));
    setErrorLinea(null);
  };
  const quitar = (idLinea) => {
    setCarrito(quitarDelCarrito(idLinea));
    if (errorLinea?.id === idLinea) setErrorLinea(null);
  };

  const enviar = () => {
    setMensaje('');
    setErrorLinea(null);
    const validacion = validarFormularioCliente(cliente);
    setErrores(validacion.errores);
    if (!validacion.valido) return;

    try {
      const nueva = guardarCotizacion({ origen: 'web', cliente, lineas, notas });
      vaciarCarrito();
      setGuardada(nueva);
    } catch (e) {
      if (e.errores) setErrores(e.errores);
      else if (e.lineaId) setErrorLinea({ id: e.lineaId, mensaje: e.message });
      else setMensaje(e.message);
    }
  };

  return (
    <div className="solicitud">
      <Link className="solicitud-volver" to="/">← Seguir viendo equipos</Link>
      <h1>Solicitud de cotización</h1>
      <p className="sutil solicitud-bajada">Déjanos tus datos una sola vez para todos tus equipos.</p>
      <Pasos fechasListas={sinFechas === 0} />

      <div className="solicitud-grid">
        <section className="tarjeta solicitud-datos">
          <h2>Tus datos de contacto</h2>
          <FormularioCliente valor={cliente} onChange={setCliente} errores={errores} notaMunicipio={NOTA_MUNICIPIO} />
          <CampoNotas valor={notas} onChange={setNotas} />
        </section>

        <aside className="tarjeta solicitud-resumen" aria-label="Equipos en tu cotización">
          <div className="solicitud-resumen-cabeza">
            <h2>Equipos en tu cotización</h2>
            <span>{lineas.length === 1 ? '1 EQUIPO' : `${lineas.length} EQUIPOS`}</span>
          </div>

          <div className="solicitud-lineas">
            {lineas.map((l) => (
              <LineaCotizacion
                key={l.id}
                linea={l}
                abierta={abierta === l.id}
                onAbrir={() => setAbierta(l.id)}
                onCerrar={() => setAbierta(null)}
                onGuardar={guardarLinea}
                onQuitar={() => quitar(l.id)}
                error={errorLinea?.id === l.id ? errorLinea.mensaje : ''}
              />
            ))}
          </div>
          <Link className="solicitud-agregar" to="/">⊕ Agregar otro equipo</Link>

          <div className="solicitud-total">
            <div>
              <strong>Total estimado</strong>
              <small>{avisoTotal(conEnvio?.desglose ? cliente.municipio : '')}</small>
            </div>
            <span className="solicitud-monto">{desglose ? pesos(desglose.total) : '—'}</span>
          </div>
          {sinFechas > 0 && <p className="msg-error">Falta elegir fechas en {sinFechas === 1 ? '1 equipo' : `${sinFechas} equipos`}: toca “Cambiar”.</p>}
          {(errorCalculo || errorEnvio) && <p className="msg-error" role="alert">{errorCalculo || errorEnvio}</p>}
          {mensaje && <p className="msg-error" role="alert">{mensaje}</p>}

          <button type="button" className="boton solicitud-enviar" onClick={enviar}>Enviar solicitud de cotización →</button>
          <p className="solicitud-sin-cobro">Esto no es un cobro. Tu solicitud queda pendiente de revisión.</p>
          <p className="solicitud-logistica">🚚 Operación logística con cama baja y operadores certificados para maniobras.</p>
        </aside>
      </div>
    </div>
  );
}
