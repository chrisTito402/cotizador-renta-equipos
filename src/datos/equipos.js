// Catálogo de equipos de ejemplo. Cuando haya backend, esto vendrá de la base de datos.
export const EQUIPOS = [
  {
    "id": "EQ-001",
    "nombre": "Grúa telescópica 25 t",
    "modelo": "Grove RT530E",
    "tipo": "Grúa",
    "precioPorDia": 9500,
    "disponible": true,
    "fotos": ["/fotos/eq-001.svg"],
    "caracteristicas": {
      "Capacidad": "25 toneladas",
      "Pluma": "31 m",
      "Motor": "Diésel 173 hp"
    }
  },
  {
    "id": "EQ-002",
    "nombre": "Grúa articulada 12 t",
    "modelo": "Fassi F215A",
    "tipo": "Grúa",
    "precioPorDia": 6200,
    "disponible": true,
    "fotos": ["/fotos/eq-002.svg"],
    "caracteristicas": {
      "Capacidad": "12 toneladas",
      "Alcance": "18 m",
      "Montaje": "Sobre camión"
    }
  },
  {
    "id": "EQ-003",
    "nombre": "Montacargas Toyota",
    "modelo": "8FG25",
    "tipo": "Montacargas",
    "precioPorDia": 1800,
    "disponible": true,
    "fotos": ["/fotos/eq-003.svg"],
    "caracteristicas": {
      "Capacidad": "2.5 toneladas",
      "Altura de elevación": "4.7 m",
      "Combustible": "Gas LP"
    }
  },
  {
    "id": "EQ-004",
    "nombre": "Montacargas eléctrico Hyster",
    "modelo": "J50XN",
    "tipo": "Montacargas",
    "precioPorDia": 2100,
    "disponible": true,
    "fotos": ["/fotos/eq-004.svg"],
    "caracteristicas": {
      "Capacidad": "2.2 toneladas",
      "Altura de elevación": "5.5 m",
      "Batería": "48 V"
    }
  },
  {
    "id": "EQ-005",
    "nombre": "Retroexcavadora John Deere",
    "modelo": "310L",
    "tipo": "Retroexcavadora",
    "precioPorDia": 4300,
    "disponible": true,
    "fotos": ["/fotos/eq-005.svg"],
    "caracteristicas": {
      "Profundidad de excavación": "4.3 m",
      "Motor": "Diésel 93 hp",
      "Peso": "7 toneladas"
    }
  },
  {
    "id": "EQ-006",
    "nombre": "Excavadora CAT",
    "modelo": "320D",
    "tipo": "Excavadora",
    "precioPorDia": 7800,
    "disponible": false,
    "fotos": ["/fotos/eq-006.svg"],
    "caracteristicas": {
      "Profundidad de excavación": "6.7 m",
      "Motor": "Diésel 148 hp",
      "Peso": "21 toneladas"
    }
  },
  {
    "id": "EQ-007",
    "nombre": "Plataforma de tijera Genie",
    "modelo": "GS-3246",
    "tipo": "Plataforma",
    "precioPorDia": 1500,
    "disponible": true,
    "fotos": ["/fotos/eq-007.svg"],
    "caracteristicas": {
      "Altura de trabajo": "11.6 m",
      "Capacidad": "318 kg",
      "Energía": "Eléctrica"
    }
  },
  {
    "id": "EQ-008",
    "nombre": "Plataforma articulada JLG",
    "modelo": "450AJ",
    "tipo": "Plataforma",
    "precioPorDia": 3200,
    "disponible": true,
    "fotos": ["/fotos/eq-008.svg"],
    "caracteristicas": {
      "Altura de trabajo": "15.7 m",
      "Capacidad": "230 kg",
      "Energía": "Diésel"
    }
  }
];
