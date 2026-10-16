import { fechaCorta } from './formato.js';

export async function crearPDFCartaResponsiva(apartado) {
  const { jsPDF } = await import('jspdf');
  const documento = new jsPDF();
  const margen = 20;
  let y = 22;

  documento.setFont('helvetica', 'bold');
  documento.setFontSize(16);
  documento.text('CARTA RESPONSIVA', 105, y, { align: 'center' });
  y += 12;

  documento.setFont('helvetica', 'normal');
  documento.setFontSize(11);
  documento.text(`Apartado: ${apartado.id}`, margen, y);
  y += 7;
  documento.text(`Cotización: ${apartado.cotizacionId}`, margen, y);
  y += 10;

  documento.setFont('helvetica', 'bold');
  documento.text('Datos del cliente', margen, y);
  y += 7;
  documento.setFont('helvetica', 'normal');
  const cliente = apartado.cliente || {};
  const datosCliente = [
    `Nombre: ${cliente.nombreCompleto || 'Pendiente'}`,
    `Teléfono: ${cliente.telefono || 'Pendiente'}`,
    `Correo: ${cliente.correo || 'Pendiente'}`,
    `Municipio: ${apartado.municipio || 'Pendiente'}`,
  ];
  datosCliente.forEach((linea) => {
    documento.text(linea, margen, y);
    y += 6;
  });
  y += 4;

  documento.setFont('helvetica', 'bold');
  documento.text('Datos de la operación', margen, y);
  y += 7;
  documento.setFont('helvetica', 'normal');
  documento.text(`Fecha de creación: ${fechaCorta(apartado.fechaCreacion) || 'Pendiente'}`, margen, y);
  y += 6;
  documento.text(`Periodo de renta: ${fechaCorta(apartado.fechaInicio) || 'Pendiente'} a ${fechaCorta(apartado.fechaFin) || 'Pendiente'}`, margen, y);
  y += 10;

  documento.setFont('helvetica', 'bold');
  documento.text('Equipo(s)', margen, y);
  y += 7;
  documento.setFont('helvetica', 'normal');
  (apartado.equipos || []).forEach((equipo) => {
    const detalle = `- ${equipo.nombre || 'Pendiente'} | Modelo: ${equipo.modelo || 'Pendiente'} | Cantidad: ${equipo.cantidad || 'Pendiente'}`;
    const lineas = documento.splitTextToSize(detalle, 170);
    if (y + lineas.length * 6 > 250) {
      documento.addPage();
      y = 22;
    }
    documento.text(lineas, margen, y);
    y += lineas.length * 6 + 2;
  });

  if (y + 45 > 275) {
    documento.addPage();
    y = 25;
  } else {
    y += 16;
  }
  documento.setFont('helvetica', 'bold');
  documento.text('Firmas', margen, y);
  y += 20;
  documento.setFont('helvetica', 'normal');
  documento.line(margen, y, 90, y);
  documento.line(120, y, 190, y);
  y += 6;
  documento.text('Firma del cliente', margen, y);
  documento.text('Firma de la empresa', 120, y);
  y += 16;
  documento.text('Fecha: __________________________', margen, y);
  documento.text('Fecha: __________________________', 120, y);
  return documento;
}
