# Plan de integración — Operación (ProyectoMetodologia) → Cotizador (destino)

**Objetivo:** un solo sistema. El destino (React Router, capas en español) es la base comercial; la operación funcional de `ProyectoMetodologia` reemplaza la versión preliminar de apartados/entrega (commits `5f0ea9b` y `d2a77e5`). Ver [MAPA_SISTEMA_ORIGEN.md](MAPA_SISTEMA_ORIGEN.md) y [MAPA_SISTEMA_DESTINO.md](MAPA_SISTEMA_DESTINO.md).

## 1. Funcionalidades a incorporar (desde origen)

Dashboard operativo, máquina de estados de renta (`applyOperation`), unidades físicas con horómetro/serie, preparación con inventario, responsiva imprimible + foto, entrega, firma, instalación, fallas, revisiones, recolección, devolución, revisión final/baja, alertas (campana + aviso emergente), registros activos/históricos, directorio de clientes, catálogo de unidades con calendario, mantenimiento (consulta), buscador global, pruebas `node:assert`.

## 2. Duplicadas — se queda una sola versión

| Funcionalidad | Destino preliminar | Origen | Decisión propuesta |
|---|---|---|---|
| Apartado / lista | `Apartados.jsx` | Inicio → Reservaciones | **Origen** |
| Preparación | `marcarPreparacionCompletada` | `prepare` con mecánico e inventario | **Origen** |
| Carta responsiva | PDF jsPDF + WhatsApp + carta firmada en IndexedDB | Plantilla imprimible + foto + registro de firma | **Origen** (ver pregunta 3) |
| Entrega | La confirma el cliente en `/mis-rentas` | La registra el administrador | **Origen** (ver pregunta 2) |
| Estados de renta | 9 estados propios | `STATES` + Cerrada | **Origen** |
| Documento de cobro | PDF no fiscal + WhatsApp | Fuera de alcance | Por decidir (pregunta 3) |
| Puente Comercial → apartado | `crearApartado` desde cotización aceptada | Simulado con semilla | **Destino** (adaptado para crear rentas operativas) |

## 3. Componentes a adaptar

- `App.jsx` origen (monolito, hash) → dividir en páginas bajo `src/paginas/operacion/` y componentes en `src/componentes/operacion/`, con rutas `react-router` bajo `/admin/operacion/*` (inicio, alertas, registros, rentas/:id, equipos, equipos/:id, mantenimiento, clientes, buscar). Modales se conservan como componentes.
- `operations.js`, `records.js`, `calendar.js`, `search.js`, `alerts.js` → `src/logica/operacion/` (ya son puras; se respeta la regla del README). Persistencia (`loadData`/guardar) → nuevo `src/servicios/operacion.js`, único que toca `localStorage`.
- `components/*.jsx` origen → `src/componentes/operacion/`.
- `index.css` origen → `src/paginas/operacion/operacion.css`, con prefijo/ámbito para no chocar con `estilos.css`; reutilizar tokens `--naranja`, `--fondo`, etc.
- `LayoutAdmin.jsx` → menú con dos grupos: Comercial (Cotizaciones, Nueva) y Operación (Inicio, Alertas, Registros, Equipos, Mantenimiento, Clientes) + campana y buscador.
- Nombres: se propone **mantener los identificadores en inglés del código importado** para no reescribir lógica probada (pregunta 4).

## 4. Puente Comercial → Operación (nuevo, mínimo)

`crearRentasDesdeCotizacion(cotizacionId)` en `servicios/operacion.js`:
1. Cotización Aprobada (o aceptación simulada, ya existente) → folio `commercial` = id de cotización.
2. Por cada línea y por cada `cantidad`, asignar una **unidad física Disponible** cuyo modelo corresponda al `equipoId` del catálogo → crear `rental` en estado Apartado.
3. Cliente: `client` = `nombreCompleto`, `phone` = `telefono`, `address` = municipio (se completa dirección/obra en operación), conservar `correo`.
4. Si no hay unidades suficientes, error claro sin crear nada parcial.

Requiere: agregar `modeloId` a cada unidad y renombrar IDs de unidades a un prefijo distinto (p. ej. `UN-001`) o los modelos — **resolver el choque `EQ-xxx`**. La semilla de unidades del origen se rehace con los modelos del catálogo destino (no se inventan equipos nuevos: se usan los del catálogo).

## 5. Archivos a modificar / crear / retirar

| Acción | Archivos |
|---|---|
| Crear | `src/logica/operacion/*.js`, `src/servicios/operacion.js`, `src/componentes/operacion/*.jsx`, `src/paginas/operacion/*.jsx`, `src/paginas/operacion/operacion.css`, `pruebas/*.test.mjs` |
| Modificar | `src/App.jsx` (rutas), `src/componentes/LayoutAdmin.jsx`, `src/componentes/LayoutCliente.jsx` (enlace Mis rentas según pregunta 2), `src/paginas/admin/Cotizaciones.jsx` (acción "Enviar a operación" y reinicio conjunto), `src/logica/filtrarEquipos.js` (disponibilidad por unidades, coordinar con su dueño), `package.json` (script `test`), `README.md` |
| Retirar (se eliminan al fusionar, sin revert) | `src/servicios/apartados.js`, `src/paginas/admin/Apartados.jsx`, `DetalleApartado.jsx`, `apartados.css`, `src/paginas/cliente/MisRentas.jsx`, `src/utilidades/generarCartaResponsiva.js`, `generarDocumentoCobro.js`, dependencia `jspdf` — según respuestas 1–3 |
| No tocar | `ProyectoMetodologia/` (queda como referencia; no se borra) |

## 6. Dependencias y conflictos

- **React/Vite**: se mantiene React 18 / Vite 5 del destino; verificar que el código origen compile (no se detectaron APIs exclusivas de React 19).
- **Rutas hash → router**: `navigate`, `openRental`, `backToSearch` y el `hashchange` se reemplazan por `useNavigate`/parámetros de ruta.
- **CSS global del origen** (`body`, `.button`, `.panel`, `.badge`) puede pisar `estilos.css` → aislar bajo `.operacion`.
- **Estado compartido**: el origen mantiene `data` en un solo `useState` de `App`; en el destino se expone vía `servicios/operacion.js` + evento `window` (patrón existente) o un contexto en el layout de operación.
- **Fotos base64 en `localStorage`** (~1 MB c/u) → riesgo de cuota; aceptado como en el origen o mover a IndexedDB después.
- **Dueños de archivos** (README): `filtrarEquipos.js` es de Héctor; `App.jsx`, layouts y `Cotizaciones.jsx` son "Base".

## 7. Orden recomendado

1. Fusionar sobre `EquipoRenta` (sin revert): se eliminan los archivos preliminares en el mismo cambio.
2. Copiar lógica pura a `logica/operacion/` + pruebas; `npm test` en verde.
3. Resolver modelo unidad ↔ catálogo (IDs, `modeloId`, semilla).
4. `servicios/operacion.js` (cargar/guardar/aplicar operación/reiniciar).
5. Componentes del origen a `componentes/operacion/`.
6. Dividir `App.jsx` origen en páginas + rutas + `LayoutAdmin`.
7. CSS aislado.
8. Puente cotización → rentas.
9. Disponibilidad en catálogo cliente.
10. `npm run build`, recorrido manual completo, README.

## 8. Preguntas antes de empezar

1. ~~¿Revert de los commits preliminares?~~ Decidido: fusionar sin revert; se quita la parte del cliente (`/mis-rentas`).
2. ¿Se elimina `/mis-rentas` (confirmación de entrega por el cliente) o se conserva como vista de consulta para el cliente sobre las rentas operativas?
3. ¿Se conservan el PDF de cobro y el envío por WhatsApp del destino, aunque el origen los declara fuera de alcance?
4. ¿Se aceptan identificadores en inglés en el código operativo importado, o se traducen al español?

> **Estado (2026-11-04):** integración realizada. Operaciones vive en el panel único `/admin` (ver README). La carpeta `ProyectoMetodologia` ya no forma parte del repositorio.
