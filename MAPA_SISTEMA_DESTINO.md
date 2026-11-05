# Mapa del sistema destino — repositorio `cotizador-renta-equipos` (rama `EquipoRenta`)

Prototipo **comercial**: catálogo público, cotización (web y panel) y, desde los commits `5f0ea9b` y `d2a77e5`, una versión preliminar de apartados/entrega.

## 1. Arquitectura

| Elemento | Valor |
|---|---|
| Framework | React **18.3.1** + Vite **5.4** + `@vitejs/plugin-react` 4.3 |
| Router | `react-router-dom` 6.28 (`BrowserRouter`, layouts con `<Outlet>`) |
| Dependencias extra | `jspdf` 4.2 (carga dinámica para PDFs) |
| Persistencia | `localStorage` (`cotizador:cotizaciones`, `cotizador:carrito`, `cotizador:apartados`, `cotizador:aceptaciones-simuladas`) + IndexedDB `cotizador-apartados` (cartas firmadas) |
| Backend / API | No hay. Sin autenticación |
| Pruebas | No hay script de pruebas |
| Convenciones | Código en español; capas `paginas/ → componentes/ → servicios/ → logica/`. **`logica/` es pura** (sin `document`/`localStorage`). Las pantallas nunca usan `localStorage` directo, siempre vía `servicios/`. Archivos con dueño por rama (README) |

```
src/
  App.jsx, main.jsx, constantes.js, estilos.css (tokens --naranja, --fondo…)
  componentes/  LayoutCliente, LayoutAdmin, FormularioCliente, SelectorEquipos,
                CamposCotizacion, DesgloseCostos, Pendiente
  datos/        equipos.js (catálogo por modelo), cotizacionesSemilla.js
  logica/       calcularCotizacion, calculoRenta, calculoEnvio, filtrarEquipos, validarCliente
  servicios/    almacen.js (cotizaciones + carrito), apartados.js
  utilidades/   formato, generarCartaResponsiva (jsPDF), generarDocumentoCobro (jsPDF)
  paginas/cliente/  Catalogo, DetalleEquipo, SolicitarCotizacion, MisRentas
  paginas/admin/    Cotizaciones, CrearCotizacion, EditarCotizacion, Apartados, DetalleApartado
```

## 2. Rutas y funcionalidades

| Ruta | Layout | Funcionalidad | Origen |
|---|---|---|---|
| `/` | Cliente | Catálogo con filtros (texto, tipo, disponible, fechas) | comercial |
| `/equipos/:id` | Cliente | Detalle y agregar a "Mi cotización" | comercial |
| `/cotizar` | Cliente | Carrito multi-equipo + datos del cliente → cotización `web` | comercial |
| `/mis-rentas` | Cliente | Consulta por correo; el cliente confirma recepción y condición | **preliminar** |
| `/admin/cotizaciones` | Admin | Lista, reiniciar datos de prueba | comercial |
| `/admin/cotizaciones/nueva` | Admin | Cotización `panel` | comercial |
| `/admin/cotizaciones/:id/editar` | Admin | Modificar (solo Pendiente) | comercial |
| `/admin/apartados` | Admin | Simular aceptación, crear apartado desde cotización aceptada | **preliminar** |
| `/admin/apartados/:id` | Admin | Preparación, carta responsiva (PDF + WhatsApp), carta firmada (IndexedDB), documento de cobro (PDF + WhatsApp) | **preliminar** |

## 3. Modelos

- **Equipo** (`datos/equipos.js`): por **modelo**, no por unidad física. `id` `EQ-001…`, `nombre`, `modelo`, `tipo` (Grúa, Montacargas, Retroexcavadora, Excavadora, Plataforma), `precioPorDia`, `disponible` (booleano), `fotos`, `caracteristicas`.
- **Cotización**: `id` `COT-0001`, `origen` web|panel, `estado` Pendiente|Aprobada|Rechazada, `cliente {nombreCompleto, telefono, correo, municipio}`, `lineas [{equipoId, cantidad}]`, `fechaInicio`, `fechaFin`, `desglose` (recalculado en servicio).
- **Apartado** (preliminar): `id` `APT-0001`, `cotizacionId`, `cliente`, `equipos [{equipoId, nombre, modelo, cantidad}]`, fechas, `municipio`, `estado` (Apartado → Preparación pendiente → Listo para entrega → Pendiente de confirmación → Entregado → En renta → Pendiente de devolución → Devuelto → Cerrado), `montoCotizado`, `preparacionCompletada`, `cartaGeneradaEn`, `cartaEnviadaEn`, `entrega {condicion, observaciones}`.

## 4. Roles

Sin autenticación. Dos "áreas" por URL: **Cliente** (público) y **Panel administrativo** (rotulado "Área comercial · Administrador"). En `/mis-rentas` el correo solo simula identidad.

## 5. Qué se conserva (núcleo comercial)

`App.jsx` (rutas), layouts, `estilos.css`, `constantes.js`, `datos/`, todo `logica/`, `servicios/almacen.js`, componentes de formulario/cotización, páginas Catálogo, DetalleEquipo, SolicitarCotizacion, Cotizaciones, CrearCotizacion, EditarCotizacion. Reglas de equipo del README (PR, dueños, `logica/` pura).

## 6. Qué es preliminar (candidato a reemplazo)

Introducido en `5f0ea9b` y ampliado en `d2a77e5`:
`servicios/apartados.js`, `paginas/admin/Apartados.jsx`, `paginas/admin/DetalleApartado.jsx`, `paginas/admin/apartados.css`, `paginas/cliente/MisRentas.jsx`, `utilidades/generarCartaResponsiva.js`, `utilidades/generarDocumentoCobro.js`, y las líneas añadidas en `App.jsx`, `LayoutAdmin.jsx`, `LayoutCliente.jsx`, `README.md`, `package.json` (jspdf).

## 7. Reutilizable para la integración

- Router y `LayoutAdmin` (agregar sección de operación).
- Tokens de `estilos.css`: la identidad del origen ya se basó en este proyecto (naranja, gris claro, menú blanco).
- `obtenerCotizacion`, `obtenerEquipo` como fuente para crear rentas operativas.
- Patrón de evento `window` para refrescar pantallas (ya usado en carrito y apartados).
- Idea "aceptación de cotización → apartado" (`obtenerCotizacionesParaApartado`, `crearApartado`) como **puente** Comercial → Operación.

## 8. Incompatibilidades detectadas

1. **IDs de equipo chocan**: destino `EQ-001` = modelo de catálogo (Grúa Grove); origen `EQ-001` = unidad física (Montacargas Toyota).
2. **Granularidad**: destino cotiza modelos con `cantidad`; origen opera **una renta por unidad física**.
3. **Tipos de equipo distintos**: destino no tiene Minicargador; origen no tiene Grúa ni Excavadora.
4. **Estados distintos** entre apartado preliminar y origen; el cliente confirma la entrega en destino, el administrador la registra en origen.
5. **Cliente**: destino `{nombreCompleto, telefono, correo, municipio}`; origen `client/contact/phone/address/site` (sin correo, con dirección y obra).
6. **Navegación**: hash + `App.jsx` monolítico vs `react-router` + páginas separadas.
7. **Versiones**: React 19 / Vite 6 vs React 18 / Vite 5 (el origen no usa APIs exclusivas de React 19 detectadas; por confirmar al compilar).
8. **Disponibilidad**: `filtrarEquipos` usa cotizaciones Aprobadas + booleano `disponible`; el origen usa estado real de cada unidad.
9. **Idioma de identificadores**: inglés en origen vs español en destino.
10. **Persistencia**: dos claves/estructuras independientes en `localStorage`; fotos base64 del origen en `localStorage` vs IndexedDB en destino.
