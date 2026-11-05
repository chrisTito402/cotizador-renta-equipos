# Mapa del sistema origen — `ProyectoMetodologia/ProyectoMetodologia`

Prototipo **operativo** (después de que Comercial confirma un apartado): preparación, entrega, renta, recolección, devolución y revisión final de cada unidad física.

## 1. Tecnologías y dependencias

| Elemento | Valor |
|---|---|
| Framework | React **19.1** + Vite **6.3** + `@vitejs/plugin-react` 4.5 |
| Router | Ninguno. Navegación por `window.location.hash` (`#inicio`, `#alertas`, …) |
| Persistencia | `localStorage` clave `rentaequip-operativo-v1` (todo el estado en un objeto `{version:1, units, rentals}`); `sessionStorage` solo para el aviso de demostración |
| PDF / impresión | `window.print()` + CSS de impresión (sin jsPDF) |
| Backend / API | **No hay.** Sin llamadas `fetch`. Sin autenticación |
| Pruebas | `node:assert` en `operations.test.mjs`, `alerts.test.mjs`, `search.test.mjs` (`npm test`) |
| Idioma del código | Identificadores en inglés; textos de UI en español |
| Zona horaria | `America/Hermosillo` (alertas) |

## 2. Estructura y punto de entrada

```
main.jsx → App.jsx (≈250 líneas muy densas: navegación, pantallas, modales, formularios)
src/operations.js   datos semilla + máquina de estados (applyOperation)
src/records.js      registros activos/históricos, directorio de clientes
src/calendar.js     agenda por unidad
src/search.js       buscador global
src/alerts.js       cálculo de alertas
src/components/     AlertsPage, ClientsPage, DatePicker, EquipmentCalendar,
                    EquipmentCatalog, RecordsPage (exporta RecordRows), SearchResults
src/index.css       identidad visual (naranja / gris claro), móvil e impresión
```

## 3. Modelos de datos

**Unit** (unidad física, una por máquina real)
`id` (`EQ-001`…), `name`, `model`, `type`, `brand`, `serial`, `state`, `hours` (horómetro), `stateChangedAt`, `maintenanceStartedAt`.

**Rental** (una renta = una unidad)
- Identidad: `id` (`R-013`…), `commercial` (folio de Comercial `AP-2026-0089`), `unit`.
- Cliente (texto plano, sin entidad propia): `client`, `contact`, `phone`, `address`, `site`.
- Fechas: `start`, `end`.
- Estado: `status`, `ready`, `preparedBy`, `preparation`, `inventory[]`.
- Documentos: `document` (responsiva: folio `RESP-xxx`, fecha, horómetro, inventario, notas), `documentPhoto` (imagen base64 ≤ ~1 MB), `signature` (nombre, fecha).
- Operación: `delivery`, `installation`, `collection` (fecha, hora, contacto, notas), `return`, `finalReview`, `issues[]`, `reviews[]`.
- Bitácora: `events[]` `{at, text, by:'Administrador'}`.

Constantes: `STATES` = Disponible, Apartado, En preparación, En renta, En revisión, En mantenimiento, Fuera de servicio (+ `Cerrada` para la renta). `INVENTORY` = 8 accesorios a revisar (torreta, extintor, espejo…).

## 4. Lógica de negocio (`applyOperation(data, rentalId, action, fields)`)

Función pura que clona el estado, valida y devuelve el nuevo estado. Cada acción agrega un evento a la bitácora.

| Acción | Estado requerido | Efecto |
|---|---|---|
| `prepare` | Apartado / En preparación | mecánico + notas obligatorios; resultado `ready` → En preparación + listo; `maintenance` → En mantenimiento |
| `document` | En preparación y `ready` | genera responsiva (horómetro ≥ 0) |
| `photo` | cualquiera | adjunta foto de responsiva (jpeg/png/webp) |
| `deliver` | En preparación y `ready` | fecha + receptor → **En renta**. No exige responsiva |
| `signature` | En renta, con responsiva o foto | registra recepción de firma física |
| `installation` | En renta | opcional |
| `issue` / `review` | En renta | falla / revisión con cliente; no cambia estado |
| `collection` | En renta | coordina recolección |
| `return` | En renta | → **En revisión** |
| `close` | En revisión | resultado Disponible / En mantenimiento / Fuera de servicio (baja exige `authorization`); renta → **Cerrada** |

Estado de la unidad y de la renta se actualizan juntos. Otras funciones puras: `bucketRentals`, `rentalRecords`, `clientDirectory`, `equipmentSchedule`, `eventsForDay`, `searchProject`, `buildAlerts`, `businessDay`.

## 5. Pantallas (secciones del menú, por hash)

| Sección | Funcionalidad |
|---|---|
| **Inicio** | Dashboard con categorías: Reservaciones, Rentas activas, Preparación, Recolecciones programadas, Pendientes de revisión |
| **Alertas** | Lista filtrable por tipo/atención; campana en encabezado; aviso emergente (real y de demostración) |
| **Registros** | Rentas activas e históricas (`RecordsPage`) |
| **Equipos** | Catálogo de unidades con filtro de estado; abre calendario por unidad (`EquipmentCatalog`, `EquipmentCalendar`) |
| **Mantenimiento** | Mismo catálogo filtrado a unidades en mantenimiento (solo consulta) |
| **Clientes** | Directorio derivado de las rentas, ficha con sus rentas (`ClientsPage`) |
| **Búsqueda superior** | Global: cliente, contacto, teléfono, folios (R-, AP-, RESP-, EQ-, SER-), modelo, serie, dirección; ignora acentos/guiones (`SearchResults`) |
| **Detalle de renta** | `RentalSummary`, `RentalDocuments`, `RentalActions` (siguiente paso + otras acciones) |
| **Modales** | prepare, document, preview (responsiva imprimible), photo, photoPreview, deliver, signature, installation, issue, review, collection, return, close, equipment, help (reiniciar demo) |

## 6. Alertas (`alerts.js`)

Tipos: documentos, entregas, rentas, recolecciones, revisión de devolución, fallas, mantenimiento. Prioridad alta/media/baja. Reglas: responsiva sin adjuntar > 24 h; firma sin confirmar > 24 h; preparación/entrega para hoy, mañana o vencida; renta que vence en ≤ 3 días o vencida; recolección en ≤ 24 h o vencida; devolución sin revisar > 24 h; falla sin revisión posterior; unidad en mantenimiento. Se recalculan al guardar, cada minuto y al volver a la pestaña. Solo lectura.

## 7. Roles y permisos

No hay autenticación ni roles en código. Todo lo opera el **Administrador** (operación). El **mecánico** y quien recibe/firma solo aparecen como nombres capturados. La baja (Fuera de servicio) exige nombre de quien autoriza.

## 8. Flujo de trabajo

```
[Comercial confirma apartado] → Apartado → prepare → En preparación (ready)
   → (document / photo, opcional) → deliver → En renta
   → signature, installation, issue, review (repetibles) → collection → return → En revisión
   → close → Cerrada  + unidad Disponible | En mantenimiento | Fuera de servicio
```

## 9. Dependencias entre funcionalidades

- Alertas, búsqueda, clientes, registros y calendario dependen **solo** de `{units, rentals}`; no tienen estado propio.
- `deliver` y `document` dependen de `prepare` (ready). `signature` depende de `document` o `photo`. `close` depende de `return`.
- Clientes no es una entidad: se deriva de `rental.client` normalizado.
- La recepción del apartado "desde Comercial" está **simulada** con datos semilla (no hay integración).

## 10. Límites declarados (README)

Sin backend, sin integración con Comercial, sin WhatsApp automático. Registro de reparaciones/liberación de taller, cotizaciones, facturación y reemplazos **fuera de alcance**. La responsiva impresa es una plantilla de demostración.
