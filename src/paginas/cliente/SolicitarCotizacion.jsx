// DUEÑO: Cris · RAMA: feature/cotizacion-web
import { useSearchParams } from 'react-router-dom';
import Pendiente from '../../componentes/Pendiente.jsx';

export default function SolicitarCotizacion() {
  const [params] = useSearchParams();
  return (
    <Pendiente titulo="Solicitar cotización" duenio="Cris" rama="feature/cotizacion-web">
      <p>Llega desde el detalle con: equipo <code>{params.get('equipo') || '—'}</code>, cantidad <code>{params.get('cantidad') || '—'}</code>, del <code>{params.get('inicio') || '—'}</code> al <code>{params.get('fin') || '—'}</code>.</p>
      <p>Costo estimado automático, FormularioCliente, DesgloseCostos, enviar con <code>guardarCotizacion({'{'} origen: 'web', … {'}'})</code> y mostrar confirmación.</p>
    </Pendiente>
  );
}
