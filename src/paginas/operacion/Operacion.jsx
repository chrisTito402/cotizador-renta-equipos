// Área operativa (portada de ProyectoMetodologia/src/App.jsx). Ruta: /operacion/:seccion
import EquipmentCatalog from '../../componentes/operacion/EquipmentCatalog.jsx';
import SearchResults from '../../componentes/operacion/SearchResults.jsx';
import DatePicker from '../../componentes/operacion/DatePicker.jsx';
import AlertsPage from '../../componentes/operacion/AlertsPage.jsx';
import RecordsPage from '../../componentes/operacion/RecordsPage.jsx';
import ClientsPage from '../../componentes/operacion/ClientsPage.jsx';
import EquipmentCalendar from '../../componentes/operacion/EquipmentCalendar.jsx';
import PorApartar from '../../componentes/operacion/PorApartar.jsx';
import { buildAlerts, businessDay } from '../../logica/operacion/alertas.js';
import { INVENTORY, applyOperation, bucketRentals } from '../../logica/operacion/operaciones.js';
import { cargarOperacion, guardarOperacion, reiniciarOperacion, datosDocumentoCobro } from '../../servicios/operacion.js';
import { crearPDFDocumentoCobro } from '../../utilidades/generarDocumentoCobro.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import './operacion.css';
import './comercial-en-panel.css';

const paths={plus:'M12 5v14 M5 12h14',grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',inbox:'M4 4h16v16H4z M4 13h5l2 3h2l2-3h5',calendar:'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h2 M14 14h2 M8 17h2',tool:'m14 6-8 8-3 7 7-3 8-8 M14 6l1-4 3 4 4 1-4 4 M3 3l5 5 M3 3v4l3 3',truck:'M3 6h11v12H3z M14 10h4l3 4v4h-7 M6 18a2 2 0 1 0 0 .1 M17 18a2 2 0 1 0 0 .1',search:'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14 M15 15l6 6',arrow:'M4 12h16 M14 6l6 6-6 6',back:'M20 12H4 M10 6l-6 6 6 6',chevron:'m9 5 7 7-7 7',clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M12 6v6l4 2',check:'m5 12 4 4L20 5',file:'M5 3h9l5 5v13H5z M14 3v6h5 M8 13h8 M8 17h6',user:'M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M4 22v-3a8 8 0 0 1 16 0v3',bell:'M5 16h14l-2-3V8a5 5 0 0 0-10 0v5z M10 20h4',menu:'M3 6h18 M3 12h18 M3 18h18',close:'m5 5 14 14 M19 5 5 19',filter:'M3 5h18 M6 12h12 M10 19h4',pin:'M12 22s8-8 8-14A8 8 0 0 0 4 8c0 6 8 14 8 14 M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6',info:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M12 11v6 M12 7h.01',help:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M9 8a3 3 0 1 1 4 3v3 M12 18h.01',print:'M6 9V3h12v6 M6 17H3V9h18v8h-3 M6 14h12v7H6z',box:'M3 7l9-5 9 5v10l-9 5-9-5z M3 7l9 5 9-5 M12 12v10',swap:'M3 7h17l-4-4 M21 17H4l4 4',download:'M12 3v12 M7 10l5 5 5-5 M4 17v4h16v-4',phone:'M6 3l4 5-3 3 6 6 3-3 5 4-3 3C9 22 2 15 3 6z'};
function Icon({name,size=20,...props}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]||paths.box}/></svg>}
const categories=[{id:'apartados',title:'Reservaciones',icon:'inbox'},{id:'rentas',title:'Rentas activas',icon:'swap'},{id:'preparacion',title:'Preparación de equipos',icon:'tool'},{id:'recolecciones',title:'Recolecciones programadas',icon:'truck'},{id:'revision',title:'Pendientes de revisión',icon:'check'}];
const dateText=(value)=>value?new Date(value+'T12:00:00').toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'}):'Sin registrar';
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
function Badge({state}){return <span className={'badge '+({'Disponible':'green','En renta':'green','En preparación':'amber','Apartado':'blue','En revisión':'amber','En mantenimiento':'red','Fuera de servicio':'red','Cerrada':'muted'}[state]||'muted')}><i/>{state}</span>}
function Field({label,children,wide=false}){return <label className={wide?'field wide':'field'}><span>{label}</span>{children}</label>}
function Empty({title='No hay registros',text='Los registros aparecerán aquí cuando avance la operación.'}){return <div className="empty"><span className="empty-icon"><Icon name="inbox" size={30}/></span><h3>{title}</h3><p>{text}</p></div>}

const exampleAlert = () => ({
  id: 'ejemplo-responsiva', kind: 'documentos', priority: 'alta', example: true,
  title: 'Falta adjuntar la responsiva',
  detail: 'Ejemplo de una hoja pendiente después de 24 horas de la entrega.',
  unitId: 'UN-DEMO', unitName: 'Montacargas Toyota', client: 'Cliente de ejemplo',
  date: businessDay(new Date()), label: 'Cerrar ejemplo',
});

// Layout único del panel administrativo (/admin): menú Comercial + Operaciones.
// Las pantallas comerciales llegan por <Outlet/> dentro de .comercial (no les aplican los estilos operativos).
export default function PanelAdmin(){
  const routerNavigate=useNavigate();const {pathname}=useLocation();const {seccion}=useParams();
  const comercial=pathname.startsWith('/admin/cotizaciones');const page=comercial?'cotizaciones':(seccion||'inicio');
  const [data,setData]=useState(()=>cargarOperacion());const [selected,setSelected]=useState('apartados');const [query,setQuery]=useState('');const [rentalId,setRentalId]=useState(null);const [unitId,setUnitId]=useState(null);const [tab,setTab]=useState('resumen');const [modal,setModal]=useState(null);const [toast,setToast]=useState('');const [error,setError]=useState('');const [mobile,setMobile]=useState(false);const [sort,setSort]=useState('folio');const [pageNumber,setPageNumber]=useState(1);const [storageError,setStorageError]=useState(false);const timer=useRef();
  const [searchClientId,setSearchClientId]=useState(null);
  const [clientReturnQuery,setClientReturnQuery]=useState('');
  const [alertClock,setAlertClock]=useState(()=>Date.now());
  useEffect(()=>{const refresh=()=>setAlertClock(Date.now());const interval=setInterval(refresh,60000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(interval);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)}},[]);
  const [demoAlert,setDemoAlert]=useState(null);
  const [demoWaiting,setDemoWaiting]=useState(false);
  const [demoArmed,setDemoArmed]=useState(false);
  const [incomingAlert,setIncomingAlert]=useState(null);
  const demoTimer=useRef();
  const previousAlerts=useRef(null);
  const realAlerts=useMemo(()=>buildAlerts(data,new Date(alertClock)),[data,alertClock]);
  const alerts=useMemo(()=>demoAlert?[demoAlert,...realAlerts]:realAlerts,[realAlerts,demoAlert]);
  const scheduleDemo=useCallback(()=>{
    clearTimeout(demoTimer.current);setDemoAlert(null);setDemoWaiting(true);
    demoTimer.current=setTimeout(()=>{
      setDemoAlert(exampleAlert());setDemoWaiting(false);
      try{window.sessionStorage.setItem('rentaequip-aviso-ejemplo-v1','mostrado')}catch{}
    },2500);
  },[]);
  const armDemo=useCallback(()=>{
    clearTimeout(demoTimer.current);setDemoAlert(null);setIncomingAlert(null);setDemoWaiting(true);setDemoArmed(true);
  },[]);
  useEffect(()=>{
    let shown=false;try{shown=!!window.sessionStorage.getItem('rentaequip-aviso-ejemplo-v1')}catch{}
    if(!shown)armDemo();
    return()=>clearTimeout(demoTimer.current);
  },[armDemo]);
  useEffect(()=>{
    const current=new Map(alerts.map(alert=>[alert.id,alert.priority+'|'+alert.title]));
    const changed=previousAlerts.current&&alerts.find(alert=>previousAlerts.current.get(alert.id)!==current.get(alert.id));
    previousAlerts.current=current;
    setIncomingAlert(previous=>changed||(previous&&alerts.find(alert=>alert.id===previous.id))||null);
  },[alerts]);
  useEffect(()=>{try{guardarOperacion(data);setStorageError(false)}catch{setStorageError(true)}},[data]);
  useEffect(()=>{setRentalId(null);setMobile(false)},[pathname]);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const announce=(text)=>{setToast(text);clearTimeout(timer.current);timer.current=setTimeout(()=>setToast(''),4500)};
  const navigate=(next)=>{routerNavigate('/admin/'+next);setRentalId(null);setQuery('');setPageNumber(1);setMobile(false);setSearchClientId(null);setClientReturnQuery('');if(demoArmed&&next!=='alertas'){setDemoArmed(false);scheduleDemo()}};
  const openRental=(id)=>{setRentalId(id);setTab('resumen');setMobile(false);window.scrollTo({top:0,behavior:'smooth'})};
  const openSearchClient=(id)=>{const previous=query;navigate('clientes');setSearchClientId(id);setClientReturnQuery(previous)};
  const backToSearch=()=>{setSearchClientId(null);setQuery(clientReturnQuery);setClientReturnQuery('')};
  const openModal=(action)=>{setError('');setModal(action)};
  const openUnit=(id)=>{setUnitId(id);setError('');setModal('equipment')};
  const openAlert=(alert)=>{if(alert.example){setDemoAlert(null);return}if(alert.action==='equipment'){openUnit(alert.unitId);return}openRental(alert.rentalId);setTab(alert.tab||'resumen');if(alert.action)openModal(alert.action)};
  const operation=(action,fields)=>{try{const next=applyOperation(data,rentalId,action,fields);if(action==='photo'){try{guardarOperacion(next);}catch{throw Error('No hay espacio para guardar la foto. Prueba con una fotografía más pequeña.');}}setData(next);setModal(null);setError('');announce(next.rentals.find(r=>r.id===rentalId).events.at(-1).text);if(['document','photo'].includes(action))setTab('documentos')}catch(e){setError(e.message)}};
  const rental=data.rentals.find(r=>r.id===rentalId);const unit=rental&&data.units.find(u=>u.id===rental.unit);
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim();
  const search=(r)=>{const u=data.units.find(u=>u.id===r.unit);return normalize(`${r.id} ${r.commercial} ${r.client} ${u?.name} ${u?.id} ${r.site}`).includes(normalize(query))};
  const navComercial=[['cotizaciones','file','Cotizaciones'],['cotizaciones/nueva','plus','Nueva cotización']];
  const isActive=(id)=>id==='cotizaciones'?comercial&&pathname!=='/admin/cotizaciones/nueva':id==='cotizaciones/nueva'?pathname==='/admin/cotizaciones/nueva':!comercial&&page===id;
  const navItem=([id,icon,label])=><button key={id} className={'nav-item '+(isActive(id)?'active':'')} onClick={()=>navigate(id)} aria-current={isActive(id)?'page':undefined}><Icon name={icon}/><span>{label}</span></button>;
  const nav=[['inicio','grid','Inicio'],['apartar','file','Por apartar'],['alertas','bell','Alertas'],['registros','inbox','Registros'],['equipos','box','Equipos'],['mantenimiento','tool','Mantenimiento'],['clientes','user','Clientes']];
  const list=(bucket)=>{let items=(query.trim()?data.rentals:bucketRentals(data,bucket)).filter(search);if(sort==='fecha')items.sort((a,b)=>a.end.localeCompare(b.end));else items.sort((a,b)=>a.id.localeCompare(b.id));return items};
  const metrics=categories.map(c=>({...c,count:bucketRentals(data,c.id).length}));
  const renderList = (bucket) => {
    const items = list(bucket);
    const pageSize = page === 'inicio' ? 3 : 4;
    const count = Math.max(1, Math.ceil(items.length / pageSize));
    const current = Math.min(pageNumber, count);
    const dateLabel = query.trim() ? 'Fecha' : ['apartados', 'preparacion'].includes(bucket) ? 'Entrega' : bucket === 'recolecciones' ? 'Recolección' : bucket === 'revision' ? 'Regresó' : 'Regreso';
    const buttonLabel = { apartados: 'Preparar', preparacion: 'Continuar', recolecciones: 'Ver recolección', revision: 'Revisar' }[bucket] || 'Ver renta';
    return <>
      <div className="overview-head" aria-hidden="true"><span>Equipo</span><span>Cliente</span><span>{dateLabel}</span><span /></div>
      <div className="overview-list">
        {items.slice((current - 1) * pageSize, current * pageSize).map(r => {
          const u = data.units.find(u => u.id === r.unit);
          const rowBucket = query.trim() ? ({Apartado:'apartados','En preparación':'preparacion','En revisión':'revision'}[r.status] || 'rentas') : bucket;
          const rowLabel = query.trim() ? ({apartados:'Preparar',preparacion:'Continuar',revision:'Revisar'}[rowBucket] || 'Ver renta') : buttonLabel;
          const nextDate = ['apartados', 'preparacion'].includes(rowBucket) ? r.start : rowBucket === 'recolecciones' ? r.collection?.date : rowBucket === 'revision' ? r.return?.date : r.end;
          return <article className="overview-row" key={r.id}>
            <div className="overview-equipment"><button className="row-open" onClick={()=>openRental(r.id)} aria-label={`Abrir ${u.id} · ${r.client}`}><strong>{u.name}</strong></button><small className="mono">{u.id}</small>{query.trim()&&<Badge state={r.status}/>}</div>
            <div className="overview-client"><span className="mobile-label">Cliente</span><span>{r.client}</span></div>
            <div className="overview-date"><span className="mobile-label">{dateLabel}</span><span>{dateText(nextDate)}</span></div>
            <button className="button dark" onClick={() => openRental(r.id)} aria-label={`${rowLabel} · ${u.id} · ${r.client}`}>{rowLabel}<Icon name="arrow" size={16}/></button>
          </article>;
        })}
      </div>
      {!items.length ? <Empty title={query ? 'Sin coincidencias' : 'Todo al día'} text={query ? 'Busca por cliente, equipo o folio.' : 'No hay equipos pendientes aquí.'}/> :
        <footer className="list-footer simple-footer"><span>{items.length} {items.length === 1 ? 'registro' : 'registros'}</span>{count > 1 && <div>
          <button className="button plain compact" disabled={current === 1} onClick={() => setPageNumber(current - 1)}>Anterior</button>
          <b>{current} de {count}</b>
          <button className="button plain compact" disabled={current === count} onClick={() => setPageNumber(current + 1)}>Siguiente<Icon name="chevron" size={14}/></button>
        </div>}</footer>}
    </>;
  };
  const filterBar=<div className="table-tools"><Icon name="filter" size={17}/><label className="sr-only" htmlFor="order">Ordenar registros</label><select id="order" value={sort} onChange={e=>{setSort(e.target.value);setPageNumber(1)}}><option value="folio">Ordenar por folio</option><option value="fecha">Próximos a vencer</option></select></div>;
  const pageTitle={cotizaciones:'Cotizaciones',apartar:'Por apartar',alertas:'Alertas',registros:'Registros',historial:'Registros',clientes:'Clientes',apartados:'Reservaciones',rentas:'Rentas activas',preparacion:'Preparación de equipos',equipos:'Equipos',mantenimiento:'Mantenimiento'};
  return <div className="operacion"><div className="app-shell"><button className={'sidebar-overlay '+(mobile?'visible':'')} aria-label="Cerrar menú" onClick={()=>setMobile(false)}/><aside className={'sidebar '+(mobile?'open':'')}><button className="brand" onClick={()=>navigate('inicio')}><span><strong>SISTEMA DE RENTAS</strong><small>Renta de maquinaria</small></span></button><span className="nav-heading">COMERCIAL</span><nav>{navComercial.map(navItem)}</nav><span className="nav-heading nav-heading-gap">OPERACIONES</span><nav>{nav.map(navItem)}</nav><div className="sidebar-bottom"><Link className="nav-item" to="/"><Icon name="back"/><span>Ver sitio del cliente</span></Link><div className="sidebar-profile"><strong>Panel administrativo</strong><span>Administrador</span></div><button className="nav-item help-button" onClick={()=>openModal('help')}><Icon name="help"/><span>Ayuda</span></button></div></aside><div className="workspace"><header className="topbar"><button className="icon-button mobile-toggle" aria-label="Abrir menú" onClick={()=>setMobile(true)}><Icon name="menu"/></button><label className="global-search"><Icon name="search"/><input aria-label="Buscar folios, equipos o clientes" placeholder="Buscar folios, equipos o clientes…" value={query} onChange={e=>{setQuery(e.target.value);setPageNumber(1);setRentalId(null);setSearchClientId(null);setClientReturnQuery('')}}/>{query&&<button className="icon-button" aria-label="Limpiar búsqueda" onClick={()=>setQuery('')}><Icon name="close" size={15}/></button>}</label><div className="topbar-right"><button className={'icon-button notification '+(incomingAlert?'has-new':'')} aria-label={alerts.length?`Ver alertas · ${alerts.length} pendientes`:'Ver alertas'} onClick={()=>{navigate('alertas');setIncomingAlert(null)}}><Icon name="bell"/>{alerts.length>0&&<i/>}</button><span className="area-label"><i/>Panel administrativo</span></div></header>
  <main className="main-content" key={rentalId || pathname}>{storageError&&<div className="alert" role="alert">El navegador no permite guardar los cambios. Se conservarán solo mientras esta página esté abierta.</div>}
  {rental?<><div className="breadcrumbs"><button onClick={()=>setRentalId(null)}><Icon name="back" size={17}/>Volver a {query.trim()?'resultados':page==='inicio'?'inicio':pageTitle[page]?.toLowerCase()}</button><div><span className="folio-chip">{rental.id}</span><Badge state={rental.status}/></div></div><div className="page-heading"><div><h1>{tab==='documentos'?'Documentos de la renta':rental.status==='Apartado'?'Detalle del apartado':'Detalle de la renta'}</h1><p>{rental.client} <span className="separator">/</span> {unit.name}</p></div><div className="detail-header-actions"><button className="button soft" onClick={()=>openUnit(unit.id)}><Icon name="calendar" size={17}/>Calendario del equipo</button><button className="button soft" onClick={()=>setTab(tab==='documentos'?'resumen':'documentos')}><Icon name={tab==='documentos'?'back':'file'} size={17}/>{tab==='documentos'?'Ver resumen':'Ver documentos'}</button></div></div><div className="tabs"><button className={tab==='resumen'?'selected':''} onClick={()=>setTab('resumen')}>Resumen de la operación</button><button className={tab==='documentos'?'selected':''} onClick={()=>setTab('documentos')}>Documentos </button><button className={tab==='movimientos'?'selected':''} onClick={()=>setTab('movimientos')}>Movimientos </button></div>
  {tab==='resumen'?<><RentalSummary rental={rental} unit={unit}/><RentalActions rental={rental} unit={unit} onAction={openModal}/>
{(rental.issues.length>0||rental.reviews.length>0)&&<section className="panel"><div className="panel-heading"><div><h2>Fallas y revisiones</h2><p>Información registrada por el administrador.</p></div></div>{rental.issues.map((issue,i)=><div className="record-note" key={'i'+i}><span className="badge red">Falla reportada</span><p>{issue.notes}</p><small>{new Date(issue.at).toLocaleString('es-MX')}</small></div>)}{rental.reviews.map((review,i)=><div className="record-note" key={'r'+i}><span className="badge muted">Revisión del mecánico</span><p>{review.notes}</p><small>{review.mechanic} · {new Date(review.at).toLocaleString('es-MX')}</small></div>)}</section>}</>:tab==='documentos'?<RentalDocuments rental={rental} onAction={openModal} cobro={datosDocumentoCobro(data,rental)}/>:<section className="panel"><div className="panel-heading"><div><h2>Qué se ha registrado</h2></div></div><ol className="timeline">{[...rental.events].reverse().map((ev,i)=><li key={i}><span className="timeline-dot"><Icon name="check" size={13}/></span><div><strong>{ev.text}</strong><small>{new Date(ev.at).toLocaleString('es-MX')} · {ev.by}</small></div></li>)}</ol></section>}</>:
  query.trim()?<SearchResults data={data} query={query} onOpenRental={openRental} onOpenUnit={openUnit} onOpenClient={openSearchClient}/>:
  comercial?<div className="comercial"><Outlet/></div>:
  page==='inicio'?<><div className="page-heading home-heading"><div><h1>Inicio</h1><p>¿Qué necesitas revisar?</p></div><time className="home-date"><Icon name="calendar" size={17}/><span>{new Date().toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'America/Hermosillo'}).replace(/^./,letter=>letter.toUpperCase())}</span></time></div><div className="metrics">{metrics.map(c=><button key={c.id} className={'metric '+(selected===c.id?'selected':'')} onClick={()=>{setSelected(c.id);setPageNumber(1)}} aria-pressed={selected===c.id}><div><span className="metric-icon"><Icon name={c.icon} size={22}/></span><b>{c.count}</b></div><strong>{c.title}</strong><span className="metric-selection" aria-hidden="true">{selected===c.id?<Icon name="check" size={15}/>:null}</span></button>)}</div><section className="panel dissolve-panel" key={selected} aria-labelledby="category-title"><div className="panel-heading"><div><div className="title-with-badge"><h2 id="category-title">{query.trim()?'Resultados':categories.find(c=>c.id===selected)?.title}</h2></div><p>{query.trim()?'Selecciona el registro que buscas.':{apartados:'Selecciona un equipo para prepararlo.',rentas:'Consulta una renta.',preparacion:'Continúa con la preparación.',recolecciones:'Consulta la recolección acordada.',revision:'Registra cómo regresó el equipo.'}[selected]}</p></div>{filterBar}</div>{renderList(selected)}</section></>:
  page==='apartar'?<PorApartar data={data} onCreated={(next,rentals)=>{setData(next);announce(rentals.length===1?`Apartado ${rentals[0].id} creado`:`${rentals.length} apartados creados (${rentals.map(r=>r.id).join(', ')})`)}} onOpenRental={openRental}/>:
  page==='alertas'?<AlertsPage alerts={alerts} query={query} onOpenAlert={openAlert} onDemo={armDemo} demoWaiting={demoWaiting}/>:
  page==='clientes'?<ClientsPage key={searchClientId||'directory'} initialClientId={searchClientId} onBackToResults={clientReturnQuery?backToSearch:undefined} rentals={data.rentals} units={data.units} query={query} onOpenRental={openRental} onClearSearch={()=>setQuery('')}/>:
  ['registros','historial'].includes(page)?<RecordsPage key={page} rentals={data.rentals} units={data.units} query={query} onOpenRental={openRental}/>:
  ['apartados','rentas','preparacion'].includes(page)?<><div className="page-heading"><div><p className="eyebrow">OPERACIONES</p><h1>{pageTitle[page]}</h1><p>{{apartados:'Selecciona el equipo que vas a preparar.',rentas:'Consulta un equipo que está con el cliente.',preparacion:'Revisa qué falta antes de entregar.'}[page]}</p></div></div><section className="panel"><div className="panel-heading"><div><h2>{pageTitle[page]}</h2><p>Selecciona un equipo para continuar.</p></div>{filterBar}</div>{renderList(page)}</section></>:
  <EquipmentCatalog units={data.units} rentals={data.rentals} maintenance={page==='mantenimiento'} onOpenUnit={openUnit}/>}
  <footer className="workspace-footer"><span>Sistema de rentas <span>·</span> Panel administrativo</span><span>Prototipo · datos de ejemplo</span></footer></main></div>
  {incomingAlert&&<aside className="incoming-alert" aria-label="Nuevo aviso">
    <span className="incoming-alert-icon"><Icon name="bell" size={23}/></span>
    <div className="incoming-alert-message" role="status"><span>{incomingAlert.example?'Aviso de ejemplo':'Nuevo aviso'}</span><strong>{incomingAlert.title}</strong><p>{incomingAlert.unitName} · {incomingAlert.unitId}</p>{incomingAlert.example&&<small>Ejemplo de una hoja pendiente después de 24 horas.</small>}</div>
    <button className="icon-button" aria-label="Cerrar aviso de alerta" onClick={()=>setIncomingAlert(null)}><Icon name="close" size={18}/></button>
    <button className="button dark" onClick={()=>{setIncomingAlert(null);if(incomingAlert.example)navigate('alertas');else openAlert(incomingAlert)}}>Ver aviso<Icon name="arrow" size={16}/></button>
  </aside>}
  {toast&&<div className="toast" role="status"><span><Icon name="check" size={19}/></span>{toast}<button className="icon-button" aria-label="Cerrar aviso" onClick={()=>setToast('')}><Icon name="close" size={16}/></button></div>}
  {modal&&<Modal kind={modal} rental={rental} unit={modal==='equipment'?data.units.find(u=>u.id===unitId):unit} rentals={data.rentals} onOpenRental={id=>{setModal(null);openRental(id)}} error={error} onClose={()=>{setModal(null);setError('')}} onSubmit={operation} onReset={()=>{setData(reiniciarOperacion());setRentalId(null);setModal(null);announce('Datos de demostración reiniciados')}}/>}</div></div>
}

const modalLabels={prepare:['Registrar preparación','Pega aquí el resultado de la revisión del mecánico.'],document:['Generar carta responsiva','Revisa los datos del equipo antes de generar la carta.'],deliver:['Registrar entrega','Confirma la entrega física del equipo al cliente.'],signature:['Registrar firma de responsiva','Registra que recibiste la carta impresa y firmada.'],installation:['Registrar instalación','Completa este paso solo cuando la entrega requiera instalación.'],issue:['Reportar falla','La falla queda relacionada con esta renta.'],review:['Registrar revisión con el cliente','Pega aquí el resultado de la revisión con el cliente.'],collection:['Coordinar recolección','Guarda lo acordado con el cliente para recoger el equipo.'],return:['Registrar devolución','El equipo pasará a En revisión al registrar su regreso.'],close:['Registrar estado final','El administrador registra el resultado de la revisión del mecánico.']};
function Modal({kind,rental,unit,rentals,onOpenRental,error,onClose,onSubmit,onReset}){
  const ref=useRef();const [result,setResult]=useState('Disponible');const [docPrint,setDocPrint]=useState(false);
  useEffect(()=>{const before=document.activeElement;ref.current?.focus();const key=e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const items=ref.current?.querySelectorAll('button:not(:disabled), input, select, textarea, [tabindex="0"]');if(!items?.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};document.addEventListener('keydown',key);document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',key);document.body.style.overflow='';before?.focus()}},[onClose]);
  useEffect(()=>{const fn=()=>setDocPrint(false);window.addEventListener('afterprint',fn);return()=>window.removeEventListener('afterprint',fn)},[]);
  const submit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const fields=Object.fromEntries(fd);onSubmit(kind,fields)};
  if(kind==='equipment') return <div className="modal-backdrop" onClick={onClose}><section className="modal equipment-modal" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="equipment-title" onClick={e=>e.stopPropagation()}><button className="icon-button modal-close" aria-label="Cerrar equipo" onClick={onClose}><Icon name="close"/></button><p className="eyebrow">{unit.id}</p><h2 id="equipment-title">{unit.name}</h2><div className="equipment-modal-state"><Badge state={unit.state}/></div><EquipmentCalendar unit={unit} rentals={rentals} onOpenRental={onOpenRental}/><details className="additional-details"><summary>Datos del equipo<Icon name="chevron" size={15}/></summary><dl className="data-list unit-details"><div><dt>Marca y modelo</dt><dd>{unit.brand} · {unit.model}</dd></div><div><dt>Serie</dt><dd className="mono">{unit.serial}</dd></div><div><dt>Tipo de equipo</dt><dd>{unit.type}</dd></div><div><dt>Modelo en catálogo</dt><dd className="mono">{unit.modelId}</dd></div><div><dt>Horómetro de referencia</dt><dd>{unit.hours} h</dd></div></dl></details><footer className="modal-footer"><button className="button dark" onClick={onClose}>Cerrar</button></footer></section></div>;
  if(kind==='help')return <div className="modal-backdrop" onClick={onClose}><section className="modal help-modal" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={e=>e.stopPropagation()}><button className="icon-button modal-close" aria-label="Cerrar" onClick={onClose}><Icon name="close"/></button><p className="eyebrow">PRIMEROS PASOS</p><h2 id="help-title">Una renta, de principio a fin</h2><p>Abre un apartado y registra la preparación. Cuando el equipo esté listo, registra la entrega. Puedes adjuntar la fotografía de la responsiva cuando la recibas.</p><p>Desde la renta puedes registrar la firma física, la instalación, las fallas y el acuerdo de recolección. Al regresar, registra la devolución y después la revisión final.</p><div className="note"><Icon name="info"/><p>Este es un prototipo local. Los datos se guardan en este navegador. Los datos son de ejemplo y se guardan en este navegador.</p></div><details><summary>Reiniciar la demostración</summary><p>Esta opción elimina los cambios de esta demostración y vuelve a cargar los ejemplos.</p><button className="button soft" onClick={onReset}>Confirmar reinicio de datos de ejemplo</button></details><footer className="modal-footer"><button className="button dark" onClick={onClose}>Entendido<Icon name="check" size={17}/></button></footer></section></div>;
  if(kind==='photo') return <PhotoUpload rental={rental} error={error} dialogRef={ref} onClose={onClose} onSave={fields=>onSubmit('photo',fields)}/>;
  if(kind==='photoPreview') return <div className="modal-backdrop" onClick={onClose}><section className="modal document-modal" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="photo-preview-title" onClick={e=>e.stopPropagation()}><div className="document-toolbar"><strong id="photo-preview-title">Foto de la responsiva</strong><button className="button dark compact" onClick={()=>window.print()}><Icon name="print" size={17}/>Imprimir</button><button className="icon-button" aria-label="Cerrar fotografía" onClick={onClose}><Icon name="close"/></button></div><div className="photo-sheet"><img src={rental.documentPhoto.image} alt={'Responsiva de '+rental.id}/></div></section></div>;
  if(kind==='preview')return <div className={'modal-backdrop '+(docPrint?'printing':'')} onClick={onClose}><section className="modal document-modal" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="document-title" onClick={e=>e.stopPropagation()}><div className="document-toolbar"><span>Vista de impresión · {rental.document.folio}</span><button className="button dark compact" onClick={()=>{setDocPrint(true);window.print()}}><Icon name="print" size={17}/>Imprimir</button><button className="icon-button" aria-label="Cerrar documento" onClick={onClose}><Icon name="close"/></button></div><article className="responsiva"><header><div className="brand-symbol"><Icon name="tool" size={26}/></div><div><h2 id="document-title">RESPONSIVA DE EQUIPO</h2><p>Documento de demostración</p></div><strong>{rental.document.folio}</strong></header><table><tbody>{[['Fecha de entrega',dateText(rental.delivery?.date||rental.document.date)],['Cliente',rental.client],['Dirección de entrega',rental.address],['Contacto',`${rental.contact} · ${rental.phone}`],['Equipo',`${unit.id} · ${unit.name}`],['Marca y modelo',`${unit.brand} · ${unit.model}`],['Número de serie',unit.serial],['Periodo de renta',`${dateText(rental.start)} al ${dateText(rental.end)}`],['Horómetro',`${rental.document.hours} horas`]].map(([label,value])=><tr key={label}><th>{label}</th><td>{value}</td></tr>)}</tbody></table><h3>Inventario de entrega</h3>{rental.document.inventory?.length ? <ul className="printed-inventory">{INVENTORY.map(item=><li key={item}>{rental.document.inventory.includes(item)?'☑':'☐'} {item}</li>)}</ul> : <p>Consultar el inventario de la revisión del mecánico.</p>}{rental.document.notes&&<p><b>Observaciones</b><br/>{rental.document.notes}</p>}<h3>Nota de responsabilidad</h3><p className="responsibility">LOS DAÑOS OCASIONADOS POR NEGLIGENCIA DERIVADOS DEL TRABAJO PARA EL CUAL SE RENTO EL MONTACARGAS, SERAN TOTALMENTE CUBIERTOS POR CUENTA DEL CLIENTE EL CUAL FIRMA DE RECIBIDO EN BUENAS CONDICIONES DE FUNCIONAMIENTO.</p><div className="signature-lines"><div>Nombre y firma de quien recibe</div><div>Nombre y firma de quien entrega</div></div></article></section></div>;
  const [title,description]=modalLabels[kind];return <div className="modal-backdrop" onClick={onClose}><section className="modal" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e=>e.stopPropagation()}><button className="icon-button modal-close" aria-label="Cerrar formulario" onClick={onClose}><Icon name="close"/></button><p className="eyebrow">{rental.id} · {unit.id}</p><h2 id="modal-title">{title}</h2><p className="modal-description">{description}</p><div className="modal-unit"><Icon name="box"/><div><strong>{unit.name}</strong><small>{rental.client}</small></div><Badge state={unit.state}/></div><form onSubmit={submit}><div className="form-grid">
  {['deliver','signature','installation','collection','return','document'].includes(kind)&&<DatePicker name="date" label={kind==='collection'?'Fecha acordada':'Fecha'} defaultValue={kind==='collection'?rental.collection?.date||today():today()}/>}
  {kind==='collection'&&<Field label="Hora acordada"><input name="time" type="time" defaultValue={rental.collection?.time||'10:00'} required/></Field>}
  {['prepare','review','close'].includes(kind)&&<Field label="Mecánico que revisó" wide><input name="mechanic" placeholder="Nombre del mecánico" defaultValue={kind==='prepare'?rental.preparedBy:''} required/></Field>}
  {kind==='prepare'&&<><Field label="Resultado de la revisión" wide><select name="result" defaultValue={rental.ready?'ready':'progress'}><option value="progress">Continuar en preparación</option><option value="ready">Equipo listo para entrega</option><option value="maintenance">Necesita mantenimiento</option></select></Field><Field label="Resultado de la revisión del mecánico" wide><textarea name="notes" defaultValue={rental.preparation} placeholder="Pega aquí el resultado de la revisión" required/></Field></>}
  {kind==='document'&&<><Field label="Lectura del horómetro"><input name="hours" type="number" min="0" step="0.1" defaultValue={unit.hours} required/></Field></>}
  {['deliver','return'].includes(kind)&&<Field label={kind==='deliver'?'Nombre de quien recibe con el cliente':'Nombre de quien recibe el regreso'} wide><input name="receiver" required placeholder="Nombre completo"/></Field>}
  {kind==='signature'&&<><Field label="Nombre de quien firmó" wide><input name="name" required placeholder="Nombre completo"/></Field><div className="wide"><label className="checkbox-row"><input type="checkbox" required/>Confirmo que recibí la responsiva impresa y firmada.</label></div></>}
  {kind==='collection'&&<Field label="Contacto para la recolección" wide><input name="contact" defaultValue={rental.collection?.contact||rental.contact} required/></Field>}
  {kind==='close'&&<><Field label="Estado final del equipo" wide><select name="result" value={result} onChange={e=>setResult(e.target.value)}><option>Disponible</option><option>En mantenimiento</option><option>Fuera de servicio</option></select></Field>{result==='Fuera de servicio'&&<Field label="Persona de Gerencia que autorizó la baja" wide><input name="authorization" required/></Field>}</>}
  {kind!=='prepare'&&<Field label={{issue:'Descripción de la falla',review:'Resultado de la revisión del mecánico',installation:'Resultado de la instalación',close:'Resultado de la revisión final',collection:'Dirección e indicaciones de recolección'}[kind]||'Observaciones'} wide><textarea name="notes" required={['issue','review','installation','close'].includes(kind)} defaultValue={kind==='collection'?rental.collection?.notes||rental.address:''} placeholder={['review','close'].includes(kind) ? 'Pega aquí el resultado de la revisión' : 'Escribe la información de esta operación'}/></Field>}
  </div>{error&&<div className="alert" role="alert">{error}</div>}<footer className="modal-footer"><button className="button soft" type="button" onClick={onClose}>Cancelar</button><button className="button dark" type="submit">{kind==='document'?'Generar responsiva':kind==='deliver'?'Confirmar entrega':'Guardar registro'}<Icon name="arrow" size={17}/></button></footer></form></section></div>
}

function RentalSummary({ rental, unit }) {
  return <section className="panel simple-summary">
    <div className="summary-top"><div><span className="summary-label">Equipo</span><h2>{unit.name}</h2><span className="summary-id mono">{unit.id}</span></div><Badge state={unit.state}/></div>
    <dl className="summary-facts">
      <div><dt>Cliente</dt><dd>{rental.client}</dd></div>
      <div><dt>Entrega</dt><dd>{dateText(rental.delivery?.date || rental.start)}</dd></div>
      <div><dt>Regreso previsto</dt><dd>{dateText(rental.end)}</dd></div>
    </dl>
    {rental.collection && rental.status==='En renta' && <div className="simple-reminder"><Icon name="truck" size={18}/><span>Recolección el <strong>{dateText(rental.collection.date)}</strong> a las {rental.collection.time}</span></div>}
    <details className="additional-details"><summary>Ver datos completos<Icon name="chevron" size={15}/></summary><div className="additional-body">
      <dl className="data-list"><div><dt>Contacto</dt><dd>{rental.contact} · {rental.phone}</dd></div><div><dt>Dirección de entrega</dt><dd>{rental.address}</dd><small>{rental.site}</small></div><div><dt>Folio de renta / Comercial</dt><dd>{rental.id} / {rental.commercial}</dd></div><div><dt>Marca, modelo y serie</dt><dd>{unit.brand} · {unit.model} · {unit.serial}</dd></div><div><dt>Horómetro</dt><dd>{rental.document?.hours ?? unit.hours} h</dd></div>
      {rental.preparation&&<div><dt>Revisión antes de salir</dt><dd>{rental.preparation}</dd><small>{rental.preparedBy}</small></div>}
      {rental.delivery&&<div><dt>Entrega</dt><dd>{dateText(rental.delivery.date)} · Recibió {rental.delivery.receiver}</dd></div>}
      {rental.signature&&<div><dt>Responsiva firmada</dt><dd>{rental.signature.name} · {dateText(rental.signature.date)}</dd></div>}
      {rental.installation&&<div><dt>Instalación</dt><dd>{rental.installation.notes}</dd></div>}
      {rental.collection&&<div><dt>Recolección</dt><dd>{rental.collection.contact} · {rental.collection.notes}</dd></div>}
      {rental.return&&<div><dt>Regreso registrado</dt><dd>{dateText(rental.return.date)} · Recibió {rental.return.receiver}</dd><small>{rental.return.notes}</small></div>}
      {rental.finalReview&&<div><dt>Revisión final</dt><dd>{rental.finalReview.notes}</dd><small>{rental.finalReview.mechanic}</small></div>}
      </dl>
    </div></details>
  </section>;
}
function RentalActions({rental,unit,onAction}) {
  let primary;
  let others=[];
  if (['Apartado','En preparación'].includes(rental.status)) {
    primary = !rental.ready ? ['prepare','Registrar preparación','Registra lo que revisó el mecánico.'] : ['deliver','Registrar entrega','Confirma que el cliente recibió el equipo.'];
    if(rental.ready)others.push(['prepare','Actualizar preparación']);
    if(rental.documentPhoto)others.push(['photo','Cambiar foto de responsiva']);
  } else if(rental.status==='En renta') {
    primary = (rental.document||rental.documentPhoto)&&!rental.signature ? ['signature','Registrar firma','Confirma que recibiste la responsiva firmada.'] : !rental.collection ? ['collection','Coordinar recolección','Acuerda el regreso con el cliente.'] : ['return','Registrar devolución','Registra el regreso cuando el equipo llegue.'];
    others=[['issue','Reportar falla'],['review','Registrar revisión con el cliente']];
    if(!rental.installation)others.push(['installation','Registrar instalación']);
    if(primary[0]!=='collection')others.push(['collection',rental.collection?'Cambiar recolección':'Coordinar recolección']);
    if(primary[0]!=='return')others.push(['return','Registrar devolución']);
  } else if(rental.status==='En revisión') {
    primary=['close','Registrar estado final','Registra el resultado de la revisión del mecánico.'];
  }
  return <section className="panel simple-actions">
    {!rental.document&&!rental.documentPhoto&&<div className="simple-reminder document-pending"><Icon name="file" size={18}/><span>Responsiva pendiente de adjuntar</span><button className="button soft compact" onClick={()=>onAction('photo')}>Adjuntar responsiva</button></div>}
    <div className="next-step"><div><h2>{rental.status==='Cerrada'?'Renta terminada':rental.status==='En mantenimiento'?'Equipo en mantenimiento':'Siguiente paso'}</h2><p>{primary?.[2] || (rental.status==='Cerrada'?'El equipo quedó '+unit.state.toLowerCase()+'.':'La entrega queda detenida hasta que el equipo esté listo.')}</p></div>{primary&&<button className="button dark" onClick={()=>onAction(primary[0])}>{primary[1]}<Icon name="arrow" size={17}/></button>}</div>
    {others.length>0&&<details className="additional-details other-actions"><summary>Otras acciones<Icon name="chevron" size={15}/></summary><div className="additional-body">{others.map(([action,label])=><button className="button soft" key={action} onClick={()=>onAction(action)}>{label}<Icon name="arrow" size={15}/></button>)}</div></details>}
  </section>;
}

function ChargeDocument({rental,cobro}) {
  const [error,setError]=useState('');
  if(!cobro)return null;
  const delivered=['En renta','En revisión','Cerrada'].includes(rental.status);
  const phone=String(cobro.cliente?.telefono||'').replace(/\D/g,'');
  const fileName=`cobro-${cobro.cotizacionId}.pdf`;
  const download=async()=>{setError('');try{(await crearPDFDocumentoCobro(cobro)).save(fileName)}catch(e){setError('No fue posible generar el documento: '+e.message)}};
  const sendWhatsApp=async()=>{
    setError('');const win=window.open('','_blank');
    try{
      (await crearPDFDocumentoCobro(cobro)).save(fileName);
      const number=phone.length===10?`52${phone}`:phone;const name=cobro.cliente?.nombreCompleto;
      const text=`${name?`Hola ${name}, `:'Hola, '}te comparto el documento de cobro de la renta ${cobro.id}. Adjunta el PDF que se descargó.`;
      if(win)win.location.href=`https://wa.me/${number}?text=${encodeURIComponent(text)}`;
    }catch(e){win?.close();setError('No fue posible preparar el documento para WhatsApp: '+e.message)}
  };
  return <section className="panel">
    <div className="panel-heading"><div><h2>Documento de cobro</h2><p>{delivered?`Cotización ${cobro.cotizacionId}. Documento no fiscal; no se guarda en el sistema.`:'Disponible después de registrar la entrega.'}</p></div></div>
    {delivered&&<div className="document-row"><span className="document-icon"><Icon name="download" size={26}/></span><div><h3>Cobro de {cobro.cotizacionId}</h3><p>{cobro.equipos.length} {cobro.equipos.length===1?'unidad':'unidades'} · {cobro.cliente?.nombreCompleto}</p></div><div className="detail-header-actions"><button className="button soft" onClick={download}>Descargar PDF</button><button className="button dark" onClick={sendWhatsApp} disabled={!phone} title={phone?'':'La cotización no tiene teléfono'}>Enviar por WhatsApp<Icon name="phone" size={16}/></button></div></div>}
    {error&&<div className="alert" role="alert">{error}</div>}
  </section>;
}

function RentalDocuments({rental,onAction,cobro}) {
  const hasPhoto=!!rental.documentPhoto;
  return <><ChargeDocument rental={rental} cobro={cobro}/><section className="panel">
    <div className="panel-heading"><div><h2>Responsiva</h2><p>Guarda una foto del documento.</p></div><button className="button dark" onClick={()=>onAction('photo')}><Icon name="file" size={17}/>{hasPhoto?'Cambiar foto':'Subir fotografía'}</button></div>
    {hasPhoto&&<div className="document-row"><button className="photo-thumbnail" onClick={()=>onAction('photoPreview')} aria-label="Ampliar foto de la responsiva"><img src={rental.documentPhoto.image} alt="Foto de la responsiva"/></button><div><h3>Fotografía de la responsiva</h3><p>{dateText(rental.documentPhoto.date)}</p><Badge state={rental.signature?'Firmada':'Firma pendiente'}/></div><button className="button soft" onClick={()=>onAction('photoPreview')}>Ver fotografía<Icon name="arrow" size={17}/></button></div>}
    {rental.document&&<div className="document-row"><span className="document-icon"><Icon name="file" size={26}/></span><div><h3>Carta generada</h3><p>{rental.document.folio} · {dateText(rental.document.date)}</p></div><button className="button soft" onClick={()=>onAction('preview')}>Ver documento<Icon name="arrow" size={17}/></button></div>}
    {!hasPhoto&&!rental.document&&<Empty title="Responsiva pendiente de adjuntar" text="Puedes agregar la fotografía cuando la recibas. Esto no impide registrar la entrega."/>}
  </section></>;
}
async function preparePhoto(file) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Selecciona una foto JPG, PNG o WebP.');
  if(file.size>20*1024*1024)throw Error('La fotografía es muy grande. Selecciona una de menos de 20 MB.');
  const url=URL.createObjectURL(file);
  try {
    const img=new Image();img.src=url;await img.decode();
    const scale=Math.min(1,1800/Math.max(img.width,img.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('No se pudo abrir la fotografía.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    let image=canvas.toDataURL('image/jpeg',0.86);
    for(let quality=0.76;image.length>1100000&&quality>=0.46;quality-=0.1)image=canvas.toDataURL('image/jpeg',quality);
    if(image.length>1100000)throw Error('La fotografía ocupa mucho espacio. Prueba con una imagen más pequeña.');
    return image;
  } finally { URL.revokeObjectURL(url); }
}
function PhotoUpload({rental,error,dialogRef,onClose,onSave}) {
  const [photo,setPhoto]=useState(null);const [loading,setLoading]=useState(false);const [photoError,setPhotoError]=useState('');const sequence=useRef(0);
  useEffect(()=>()=>{sequence.current++},[]);
  const select=async e=>{
    const file=e.target.files?.[0];if(!file)return;
    const token=++sequence.current;setLoading(true);setPhoto(null);setPhotoError('');
    try {const image=await preparePhoto(file);if(sequence.current===token)setPhoto({image,name:file.name});}
    catch(err){if(sequence.current===token)setPhotoError(err.message||'No se pudo abrir la fotografía. Prueba con otra imagen.');}
    finally {if(sequence.current===token)setLoading(false);e.target.value='';}
  };
  return <div className="modal-backdrop" onClick={onClose}><section className="modal" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="upload-title" onClick={e=>e.stopPropagation()}>
    <button className="icon-button modal-close" onClick={onClose} aria-label="Cerrar"><Icon name="close"/></button><p className="eyebrow">{rental.id}</p><h2 id="upload-title">Foto de la responsiva</h2><p className="modal-description">Incluye toda la hoja y revisa que el texto se lea.</p>
    <div className="photo-upload-area">{photo?<img className="photo-upload-preview" src={photo.image} alt="Vista previa de la foto seleccionada"/>:<div className="photo-upload-empty"><Icon name="file" size={34}/><p>{loading?'Preparando fotografía…':'Selecciona una fotografía'}</p></div>}
    <div className="photo-pickers"><label className="button soft photo-picker">{photo?'Elegir otra foto':'Elegir fotografía'}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={select} disabled={loading}/></label><label className="button soft photo-picker camera-picker">Tomar foto<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={select} disabled={loading}/></label></div></div>
    {(photoError||error)&&<div className="alert" role="alert">{photoError||error}</div>}
    <footer className="modal-footer"><button className="button soft" onClick={onClose}>Cancelar</button><button className="button dark" disabled={!photo||loading} onClick={()=>onSave({image:photo.image,name:photo.name,date:today()})}>Guardar fotografía<Icon name="check" size={17}/></button></footer>
  </section></div>;
}
