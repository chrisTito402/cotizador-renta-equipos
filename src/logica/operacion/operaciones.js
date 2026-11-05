// Lógica operativa (portada de ProyectoMetodologia). Función pura: no usa localStorage ni el DOM.
// Cada unidad física (UN-xxx) apunta con modelId a un modelo del catálogo comercial (EQ-xxx).
import { EQUIPOS } from '../../datos/equipos.js';

export const STORAGE_KEY = 'cotizador:operacion';
export const DATA_VERSION = 2;
const BRANDS = { 'EQ-001': 'Grove', 'EQ-002': 'Fassi', 'EQ-003': 'Toyota', 'EQ-004': 'Hyster', 'EQ-005': 'John Deere', 'EQ-006': 'CAT', 'EQ-007': 'Genie', 'EQ-008': 'JLG' };
export const unitId = (n) => `UN-${String(n).padStart(3, '0')}`;
export function unitFromModel(id, modelId, fields = {}) {
  const model = EQUIPOS.find(e => e.id === modelId);
  if (!model) throw Error(`No existe el modelo ${modelId} en el catálogo.`);
  return { id, modelId, name: model.nombre, model: model.modelo, type: model.tipo, brand: BRANDS[modelId] || '', serial: '', state: 'Disponible', hours: 0, ...fields };
}
export const STATES = ['Disponible', 'Apartado', 'En preparación', 'En renta', 'En revisión', 'En mantenimiento', 'Fuera de servicio'];
export const INVENTORY = ['Torreta', 'Extintor', 'Espejo', 'Focos delanteros', 'Focos traseros', 'Tanque de gas', 'Alarma de reversa', 'Dos cuchillas'];
const day = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export function initialData() {
  const clients = ['Constructora del Norte', 'Inmobiliaria Rivera', 'Agroindustrial del Valle', 'Constructora Luján', 'Hortícola del Sur', 'Almacenes del Pacífico'];
  const slots = ['EQ-003', 'EQ-006', 'EQ-003', 'EQ-007', 'EQ-005', 'EQ-004'];
  const units = Array.from({length:16},(_,i)=>unitFromModel(unitId(i+1), slots[i%6], {serial:`SER-${204800+i}`, state:i<4?'Apartado':i<6?'En preparación':i<12?'En renta':i<14?'En mantenimiento':'Disponible', hours:142+i*18}));
  const rentals=units.slice(0,12).map((u,i)=>({id:`R-${String(13+i).padStart(3,'0')}`, commercial:`AP-2026-${String(89+i).padStart(4,'0')}`,unit:u.id,client:clients[i%6],contact:['Carlos Mendoza','Ana Rivera','Eduardo Inzunza'][i%3],phone:'644 000 0000',address:['Av. del Parque 501, Cd. Obregón, Sonora','Parque Industrial, acceso 2, Cd. Obregón','Carretera Internacional km 8, Cajeme'][i%3],site:['Obra Torre Norte','Plaza San Jerónimo','Almacén Central'][i%3],start:day(i<6?i%3:i===6?-28:-8),end:day(i===6?2:i===7?1:12+i),status:i<4?'Apartado':i<6?'En preparación':'En renta',ready:i===5,preparedBy:i===5?'Mecánico de turno':'',preparation:i===5?'Revisión completa. Equipo listo para entregar.':'',document:null,signature:null,installation:null,collection:i===7?{date:day(1),time:'10:00',contact:'Ana Rivera',notes:'Entrada por acceso principal'}:null,issues:[],reviews:[],events:[{at:new Date().toISOString(),text:'Apartado confirmado recibido de Comercial',by:'Administrador'}]}));
  const data = addReviewExample({version:DATA_VERSION,units,rentals});
  // Una unidad disponible de cada modelo del catálogo que aún no tenía, para poder apartar cotizaciones.
  ['EQ-001', 'EQ-002', 'EQ-004', 'EQ-005', 'EQ-006', 'EQ-008'].forEach((modelId, k) =>
    data.units.push(unitFromModel(unitId(18 + k), modelId, { serial: `SER-${204817 + k}`, hours: 60 + k * 25 })));
  return data;
}
function addReviewExample(data) {
  if (data.reviewExampleAdded) return data;
  const reviewUnit = 'UN-017';
  const rentalId = 'R-025';
  if (!data.units.some(unit => unit.id === reviewUnit) && !data.rentals.some(rental => rental.id === rentalId)) {
    const now = new Date().toISOString();
    data.units.push(unitFromModel(reviewUnit, 'EQ-003', {serial: 'SER-204816', state: 'En revisión', hours: 286}));
    data.rentals.push({
      id: rentalId, commercial: 'AP-2026-0101', unit: reviewUnit,
      client: 'Constructora del Norte', contact: 'Carlos Mendoza', phone: '644 000 0000',
      address: 'Av. del Parque 501, Cd. Obregón, Sonora', site: 'Obra Torre Norte',
      start: day(-10), end: day(0), status: 'En revisión', ready: true,
      preparedBy: 'Mecánico de turno', preparation: 'Revisión de salida completa.',
      document: {folio: 'RESP-025', date: day(-10), hours: 270, inventory: [...INVENTORY], notes: ''},
      signature: {name: 'Carlos Mendoza', date: day(-10)},
      delivery: {date: day(-10), receiver: 'Carlos Mendoza', notes: ''},
      installation: null, collection: {date: day(0), time: '09:00', contact: 'Carlos Mendoza', notes: 'Acceso principal de la obra'},
      return: {date: day(0), receiver: 'Encargado de almacén', notes: 'Equipo recibido. Pendiente de revisión del mecánico.'},
      issues: [], reviews: [],
      events: [
        {at: new Date(day(-10) + 'T09:00:00').toISOString(), text: 'Entrega registrada. Equipo en renta', by: 'Administrador'},
        {at: now, text: 'Recolección coordinada', by: 'Administrador'},
        {at: now, text: 'Devolución registrada. Equipo en revisión', by: 'Administrador'},
      ],
    });
  }
  data.reviewExampleAdded = true;
  return data;
}
export function loadData(storage) {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY));
    if (value?.version === DATA_VERSION &&Array.isArray(value.units) && Array.isArray(value.rentals)) {
      for (const rental of value.rentals) {
        if (rental.preparation === 'Revisión informada por WhatsApp. Equipo listo para entregar.') rental.preparation = 'Revisión completa. Equipo listo para entregar.';
      }
      return addReviewExample(value);
    }
  } catch { /* Invalid saved data falls back to the demonstration. */ }
  return initialData();
}
export function applyOperation(data,id,action,fields={}) {
  const next=JSON.parse(JSON.stringify(data)); const r=next.rentals.find(x=>x.id===id); if(!r)throw Error('No se encontró la renta.'); const u=next.units.find(x=>x.id===r.unit); if(!u)throw Error('No se encontró el equipo.');
  const requireText=(key,label)=>{if(!String(fields[key]||'').trim())throw Error(`Completa ${label}.`);};
  const inState=(...states)=>{if(!states.includes(r.status))throw Error('La operación no está disponible en el estado actual.');};
  let text='';
  if(action==='prepare'){inState('Apartado','En preparación');requireText('mechanic','quién revisó el equipo');requireText('notes','el resultado de la revisión');r.status=u.state=fields.result==='maintenance'?'En mantenimiento':'En preparación';r.ready=fields.result==='ready';r.preparedBy=fields.mechanic;r.preparation=fields.notes;r.inventory=fields.inventory??r.inventory??[];text=r.ready?'Preparación terminada. Equipo listo para entrega':'Revisión de preparación registrada';}
  else if(action==='document'){inState('En preparación');if(!r.ready)throw Error('Primero confirma que el equipo está listo para entrega.');requireText('hours','el horómetro');if(!Number.isFinite(Number(fields.hours))||Number(fields.hours)<0)throw Error('Revisa la lectura del horómetro.');r.document={folio:`RESP-${r.id.slice(2)}`,date:fields.date||day(0),hours:Number(fields.hours),inventory:fields.inventory??r.inventory??[],notes:fields.notes||''};text='Carta responsiva generada';}
  else if(action==='photo'){
    if(!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(fields.image||'')||fields.image.length>1100000)throw Error('Selecciona una fotografía válida.');
    r.documentPhoto={image:fields.image,name:String(fields.name||'Responsiva'),date:fields.date||day(0)};
    text='Fotografía de la responsiva guardada';
  }
  else if(action==='deliver'){inState('En preparación');if(!r.ready)throw Error('El equipo debe estar listo antes de entregarlo.');requireText('date','la fecha de entrega');requireText('receiver','quién recibe el equipo');r.delivery={...fields,at:new Date().toISOString()};r.status=u.state='En renta';text='Entrega registrada. Equipo en renta';}
  else if(action==='signature'){inState('En renta');if(!r.document&&!r.documentPhoto)throw Error('Primero agrega la responsiva de esta renta.');requireText('name','el nombre de quien firmó');requireText('date','la fecha de firma');r.signature={...fields};text='Recepción de responsiva firmada registrada';}
  else if(action==='installation'){inState('En renta');requireText('notes','el resultado de la instalación');requireText('date','la fecha de instalación');r.installation={...fields};text='Instalación registrada';}
  else if(action==='issue'){inState('En renta');requireText('notes','la descripción de la falla');r.issues.push({...fields,at:new Date().toISOString()});text='Falla durante la renta registrada';}
  else if(action==='review'){inState('En renta');requireText('mechanic','quién revisó el equipo');requireText('notes','el resultado de la revisión');r.reviews.push({...fields,at:new Date().toISOString()});text='Revisión con el cliente registrada';}
  else if(action==='collection'){inState('En renta');requireText('date','la fecha de recolección');requireText('contact','el contacto de recolección');r.collection={...fields};text='Recolección coordinada';}
  else if(action==='return'){inState('En renta');requireText('date','la fecha de regreso');requireText('receiver','quién recibe el equipo');r.return={...fields,at:new Date().toISOString()};r.status=u.state='En revisión';text='Devolución registrada. Equipo en revisión';}
  else if(action==='close'){inState('En revisión');requireText('mechanic','quién revisó el equipo');requireText('notes','el resultado de la revisión final');if(!['Disponible','En mantenimiento','Fuera de servicio'].includes(fields.result))throw Error('Selecciona el estado final.');if(fields.result==='Fuera de servicio')requireText('authorization','quién autorizó la baja');r.finalReview={...fields};u.state=fields.result;r.status='Cerrada';text=`Revisión final registrada. Equipo ${u.state.toLowerCase()}`;}
  else throw Error('Operación no reconocida.');
  if(u.state!==data.units.find(unit=>unit.id===u.id)?.state){
    u.stateChangedAt=new Date().toISOString();
    if(u.state==='En mantenimiento')u.maintenanceStartedAt=u.stateChangedAt;
  }
  r.events.push({at:new Date().toISOString(),text,by:'Administrador'});return next;
}
export function bucketRentals(data,bucket) { return data.rentals.filter(r=>bucket==='apartados'?r.status==='Apartado':bucket==='rentas'?r.status==='En renta':bucket==='preparacion'?r.status==='En preparación':bucket==='recolecciones'?r.status==='En renta'&&r.collection:bucket==='revision'?r.status==='En revisión':bucket==='mantenimiento'?r.status==='En mantenimiento':true); }
