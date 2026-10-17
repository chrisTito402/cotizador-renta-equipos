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
| `/mis-rentas` | Consulta simulada y confirmación de rentas del cliente | — | — |
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

## Apartados, entrega y documentos

El seguimiento administrativo se encuentra en `/admin/apartados`. Desde ahí se prepara el equipo, se registra manualmente el envío de la carta responsiva y se carga la carta firmada. Al completar la preparación, la acción de entrega queda deshabilitada para el administrador: solo el cliente registra la recepción desde `/mis-rentas`, con la condición del equipo y las observaciones. La confirmación aparece en el seguimiento administrativo y habilita la sección «Factura», con dos acciones: generar y descargar el PDF al solicitarlo, o generar/descargar el PDF y abrir el chat de WhatsApp para enviarlo. La factura no se guarda en el sistema.

Este flujo es un MVP local: no hay autenticación ni backend. El correo en `/mis-rentas` solo simula la identidad y no protege datos frente a otros usuarios; cotizaciones, rentas y estados se guardan en `localStorage`, y las cartas firmadas en IndexedDB del mismo navegador/origen. Las pantallas administrativas abiertas en otras pestañas del mismo navegador se actualizan con los cambios; no hay sincronización entre dispositivos o navegadores. El PDF de factura se genera bajo demanda, se identifica como documento no fiscal y WhatsApp no adjunta archivos automáticamente: el usuario debe adjuntar el PDF descargado.
