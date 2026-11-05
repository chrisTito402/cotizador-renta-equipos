// ============================================================
// DUEÑO: Cris · RAMA: feature/fechas-por-equipo
// Calendario para elegir un rango de renta (como el Figma del detalle del equipo).
// ============================================================
//
// Uso:
//   <CalendarioRango fechaInicio={ini} fechaFin={fin} ocupados={rangos} minimo={hoyLocal()}
//     onChange={({ fechaInicio, fechaFin }) => ...} />
//
// - Primer toque = día de inicio; segundo toque = día de fin (si es antes del inicio, se vuelve el inicio;
//   si el rango cruzaría días ocupados, también se vuelve el inicio y se avisa).
// - Con el rango completo, un toque empieza otro rango.
// - Días antes de `minimo` y días ocupados no se pueden tocar; un rango no puede cruzar días ocupados.
// - ocupados: [{ inicio, fin }] (rangosOcupados de logica/disponibilidad.js)
import { useState } from 'react';
import { MESES, textoDias } from '../utilidades/formato.js';
import { aTexto, desdeTexto, diasEntre } from '../utilidades/fechas.js';
import { diaOcupado, rangoChoca } from '../logica/disponibilidad.js';
import './calendarioRango.css';

const DIAS_SEMANA = [['L', 'Lunes'], ['M', 'Martes'], ['Mi', 'Miércoles'], ['J', 'Jueves'], ['V', 'Viernes'], ['S', 'Sábado'], ['D', 'Domingo']];

// Días del mes como texto AAAA-MM-DD
function diasDelMes(anio, mes) {
  const total = new Date(anio, mes + 1, 0).getDate();
  return Array.from({ length: total }, (_, i) => aTexto(new Date(anio, mes, i + 1)));
}

export default function CalendarioRango({ fechaInicio = '', fechaFin = '', ocupados = [], minimo = '', onChange }) {
  const base = desdeTexto(fechaInicio || minimo || aTexto(new Date()));
  const [vista, setVista] = useState({ anio: base.getFullYear(), mes: base.getMonth() });
  const [sobre, setSobre] = useState('');
  const [aviso, setAviso] = useState('');

  const dias = diasDelMes(vista.anio, vista.mes);
  // Lunes = columna 1
  const primeraColumna = ((new Date(vista.anio, vista.mes, 1).getDay() + 6) % 7) + 1;
  const mesMinimo = minimo ? minimo.slice(0, 7) : '';
  const puedeRegresar = !mesMinimo || dias[0].slice(0, 7) > mesMinimo;

  const moverMes = (paso) => {
    const d = new Date(vista.anio, vista.mes + paso, 1);
    setVista({ anio: d.getFullYear(), mes: d.getMonth() });
  };

  const eligiendoFin = fechaInicio && !fechaFin;
  // Mientras se elige el fin, el rango se pinta hasta el día bajo el mouse
  const finVisible = fechaFin || (eligiendoFin && sobre >= fechaInicio && !rangoChoca(fechaInicio, sobre, ocupados) ? sobre : '');

  const tocar = (dia) => {
    setAviso('');
    if (!eligiendoFin || dia < fechaInicio) {
      onChange({ fechaInicio: dia, fechaFin: '' });
    } else if (rangoChoca(fechaInicio, dia, ocupados)) {
      // No se puede cruzar días ocupados: el día tocado se vuelve el nuevo inicio
      onChange({ fechaInicio: dia, fechaFin: '' });
      setAviso(`Ese rango cruzaba días ocupados, así que el ${Number(dia.slice(8))} quedó como nuevo inicio. Ahora toca el último día.`);
    } else {
      onChange({ fechaInicio, fechaFin: dia });
    }
  };

  const claseDia = (dia, bloqueado) => {
    const clases = ['calendario-dia'];
    if (diaOcupado(dia, ocupados)) clases.push('calendario-ocupado');
    else if (bloqueado) clases.push('calendario-pasado');
    if (dia === fechaInicio || dia === finVisible) clases.push('calendario-extremo');
    else if (fechaInicio && finVisible && dia > fechaInicio && dia < finVisible) clases.push('calendario-en-rango');
    return clases.join(' ');
  };

  const diasElegidos = fechaInicio && fechaFin ? diasEntre(fechaInicio, fechaFin) : 0;
  let ayuda = 'Toca el primer día de renta y luego el último.';
  if (eligiendoFin) ayuda = 'Ahora toca el último día de renta.';

  return (
    <div className="calendario">
      <div className="calendario-cabeza">
        <div>
          <p className="calendario-titulo">Elige tus fechas</p>
          <p className="calendario-ayuda">{ayuda}</p>
        </div>
        <div className="calendario-mes">
          <button type="button" onClick={() => moverMes(-1)} disabled={!puedeRegresar} aria-label="Mes anterior">‹</button>
          <span aria-live="polite">{MESES[vista.mes][0].toUpperCase() + MESES[vista.mes].slice(1)} {vista.anio}</span>
          <button type="button" onClick={() => moverMes(1)} aria-label="Mes siguiente">›</button>
        </div>
      </div>

      <div className="calendario-rejilla">
        {DIAS_SEMANA.map(([corto, largo]) => (
          <abbr key={largo} title={largo} className="calendario-semana">{corto[0]}</abbr>
        ))}
        {dias.map((dia, i) => {
          const ocupado = diaOcupado(dia, ocupados);
          const bloqueado = ocupado || (minimo && dia < minimo);
          const numero = Number(dia.slice(8));
          return (
            <button
              key={dia}
              type="button"
              className={claseDia(dia, bloqueado)}
              style={i === 0 ? { gridColumnStart: primeraColumna } : undefined}
              disabled={bloqueado}
              aria-pressed={dia === fechaInicio || dia === fechaFin}
              aria-label={`${numero} de ${MESES[vista.mes]}${ocupado ? ', ocupado' : ''}`}
              onClick={() => tocar(dia)}
              onMouseEnter={() => setSobre(dia)}
              onMouseLeave={() => setSobre('')}
            >
              {numero}
            </button>
          );
        })}
      </div>

      <div className="calendario-leyenda">
        <span><i className="calendario-muestra-seleccion" aria-hidden="true" />Tu selección{diasElegidos ? ` (${textoDias(diasElegidos)})` : ''}</span>
        <span><i className="calendario-muestra-ocupado" aria-hidden="true" />Ocupado</span>
      </div>
      {aviso && <p className="msg-error calendario-aviso" role="alert">{aviso}</p>}
    </div>
  );
}
