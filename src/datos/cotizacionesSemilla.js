// Cotizaciones de ejemplo con las que arranca el localStorage.
export const COTIZACIONES_SEMILLA = [
  {
    "id": "COT-0001",
    "origen": "web",
    "estado": "Aprobada",
    "fechaCreacion": "2026-10-05T10:00:00.000Z",
    "cliente": {
      "nombreCompleto": "Martín Robles Ibarra",
      "telefono": "6441234567",
      "correo": "martin@ejemplo.com",
      "municipio": "Cajeme"
    },
    "lineas": [
      {
        "equipoId": "EQ-005",
        "cantidad": 1
      }
    ],
    "fechaInicio": "2026-11-03",
    "fechaFin": "2026-11-06",
    "desglose": {
      "lineas": [
        {
          "equipoId": "EQ-005",
          "nombre": "Retroexcavadora John Deere",
          "cantidad": 1,
          "precioPorDia": 4300,
          "fechaInicio": "2026-11-03",
          "fechaFin": "2026-11-06",
          "dias": 4,
          "importe": 17200
        }
      ],
      "subtotalRenta": 17200,
      "costoEnvio": 500,
      "total": 17700
    }
  },
  {
    "id": "COT-0002",
    "origen": "web",
    "estado": "Pendiente",
    "fechaCreacion": "2026-10-07T16:30:00.000Z",
    "cliente": {
      "nombreCompleto": "Constructora Valle del Yaqui",
      "telefono": "6449876543",
      "correo": "contacto@valleyaqui.com",
      "municipio": "Navojoa"
    },
    "lineas": [
      {
        "equipoId": "EQ-001",
        "cantidad": 1
      },
      {
        "equipoId": "EQ-003",
        "cantidad": 2
      }
    ],
    "fechaInicio": "2026-10-25",
    "fechaFin": "2026-10-28",
    "desglose": {
      "lineas": [
        {
          "equipoId": "EQ-001",
          "nombre": "Grúa telescópica 25 t",
          "cantidad": 1,
          "precioPorDia": 9500,
          "fechaInicio": "2026-10-25",
          "fechaFin": "2026-10-28",
          "dias": 4,
          "importe": 38000
        },
        {
          "equipoId": "EQ-003",
          "nombre": "Montacargas Toyota",
          "cantidad": 2,
          "precioPorDia": 1800,
          "fechaInicio": "2026-10-25",
          "fechaFin": "2026-10-28",
          "dias": 4,
          "importe": 14400
        }
      ],
      "subtotalRenta": 52400,
      "costoEnvio": 1200,
      "total": 53600
    }
  }
];
