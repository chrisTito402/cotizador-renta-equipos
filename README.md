# Cotizador de renta de equipos

Prototipo en React + Vite para cotizar renta de maquinaria. Por ahora no hay backend:
los equipos están en `src/datos/equipos.js` y las cotizaciones se guardan en el `localStorage` del navegador.

## Cómo correrlo

Necesitas Node 20 o más nuevo.

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Reiniciar los datos de prueba

En `/admin/cotizaciones` hay un botón "Reiniciar datos de prueba".

## Pantallas

| Ruta | Pantalla | Dueño | Rama |
|---|---|---|---|
| `/` | Catálogo de equipos | Héctor | feature/catalogo |
| `/equipos/:id` | Detalle del equipo | Héctor | feature/catalogo |
| `/cotizar` | Mi cotización (web, varios equipos) | Cris | feature/cotizacion-web |
| `/admin/:seccion` | Operaciones en el mismo panel: inicio, apartar, alertas, registros, equipos, mantenimiento, clientes | Operación | EquipoRenta |
| `/admin/cotizaciones` | Lista de cotizaciones | Base | — |
| `/admin/cotizaciones/nueva` | Crear cotización desde el panel | Katia | feature/cotizacion-panel |
| `/admin/cotizaciones/:id/editar` | Modificar cotización | Cris | feature/cotizacion-web |

## Ramas y archivos

| Rama | Dueño | Archivos |
|---|---|---|
| feature/calculo-renta | Héctor | `src/logica/calculoRenta.js` |
| feature/catalogo | Héctor | `src/paginas/cliente/Catalogo.jsx`, `src/paginas/cliente/DetalleEquipo.jsx`, `src/logica/filtrarEquipos.js` |
| feature/formulario-cliente | Katia | `src/logica/validarCliente.js`, `src/componentes/FormularioCliente.jsx`, `src/componentes/SelectorEquipos.jsx` |
| feature/cotizacion-panel | Katia | `src/paginas/admin/CrearCotizacion.jsx` |
| feature/calculo-envio | Cris | `src/logica/calculoEnvio.js`, `src/componentes/DesgloseCostos.jsx` |
| feature/cotizacion-web | Cris | `src/paginas/cliente/SolicitarCotizacion.jsx`, `src/paginas/admin/EditarCotizacion.jsx`, `modificarCotizacion` en `src/servicios/almacen.js` |

Base (sin dueño, no se toca sin avisar): `App.jsx`, `LayoutCliente.jsx`, `LayoutAdmin.jsx`, `Cotizaciones.jsx`,
`calcularCotizacion.js`, `constantes.js`, `datos/` y el resto de `almacen.js`.

Dependencias entre ramas: `feature/cotizacion-web` (Modificar) y `feature/cotizacion-panel` necesitan
`SelectorEquipos` y `FormularioCliente` reales de `feature/formulario-cliente`. Mientras no estén en `main`,
se trabaja con las versiones falsas.

## Reglas del equipo

- Nadie hace commit directo a `main`. Todo entra por Pull Request.
- Solo el dueño edita su archivo. Los demás solo lo importan.
- Antes de abrir un PR: `git merge main` en tu rama y probar que corre.
- Las funciones de `src/logica/` son puras: reciben datos y regresan datos. No usan `document`, `localStorage` ni nada del navegador, para poder moverlas al backend después.

## Área operativa (apartados, rentas y equipos)

Integrada desde `ProyectoMetodologia`; reemplaza la versión preliminar de `/admin/apartados` y `/mis-rentas`. Vive en el mismo panel administrativo (`/admin`), con un menú lateral que agrupa Comercial y Operaciones. `src/paginas/operacion/Operacion.jsx` es el layout de todo `/admin`; las pantallas de cotizaciones se muestran dentro de `.comercial` con `comercial-en-panel.css`, que solo ajusta su apariencia.

- **Por apartar:** cotizaciones aceptadas (Aprobadas o con aceptación simulada). «Crear apartado» asigna una **unidad física disponible** por cada equipo y cantidad, y crea una renta `R-xxx` en estado Apartado.
- **Flujo de cada renta:** preparación (mecánico e inventario) → entrega → firma de responsiva / instalación / fallas / revisiones → recolección → devolución (En revisión) → estado final (Disponible, En mantenimiento o Fuera de servicio).
- **Documentos:** responsiva imprimible y foto de la hoja firmada. Documento de cobro no fiscal en PDF (por cotización) con envío opcional por WhatsApp, disponible después de la entrega; no se guarda y WhatsApp no adjunta el PDF automáticamente.
- **Equipos:** unidades `UN-xxx`; cada una apunta con `modelId` a un modelo del catálogo comercial (`EQ-xxx`).
- Alertas, buscador global, registros históricos, clientes y calendario por unidad.

| Capa | Archivos |
|---|---|
| Lógica pura | `src/logica/operacion/` (`operaciones`, `apartados`, `alertas`, `busqueda`, `registros`, `calendario`) |
| Datos | `src/servicios/operacion.js` (`localStorage`, clave `cotizador:operacion`) |
| Pantallas | `src/paginas/operacion/Operacion.jsx`, `src/componentes/operacion/` |
| Estilos | `operacion.css` (bajo `.operacion`, excluye `.comercial`) y `comercial-en-panel.css` en `src/paginas/operacion/` |
| Pruebas | `pruebas/*.test.mjs` → `npm test` |

MVP local: sin backend ni autenticación; los datos viven en este navegador. «Ayuda → Reiniciar la demostración» recarga los ejemplos operativos.
