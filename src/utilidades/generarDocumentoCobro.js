import { fechaCorta, pesos } from './formato.js';

export async function crearPDFDocumentoCobro(apartado) {
  const { jsPDF } = await import('jspdf');
  const documento = new jsPDF();
  const margen = 20;
  let y = 22;

  documento.setFont('helvetica', 'bold');
  documento.setFontSize(16);
  documento.text('DOCUMENTO DE COBRO', 105, y, { align: 'center' });
  y += 9;
  documento.setFontSize(10);
  documento.text('Documento no fiscal · No sustituye una factura fiscal timbrada', 105, y, { align: 'center' });
  y += 14;

  documento.setFont('helvetica', 'normal');
  documento.setFontSize(11);
  documento.text(`Folio de renta: ${apartado.id}`, margen, y);
  y += 7;
  documento.text(`Cotización: ${apartado.cotizacionId}`, margen, y);
  y += 10;

  documento.setFont('helvetica', 'bold');
  documento.text('Cliente', margen, y);
  y += 7;
  documento.setFont('helvetica', 'normal');
  const cliente = apartado.cliente || {};
  [
    `Nombre: ${cliente.nombreCompleto || 'Pendiente'}`,
    `Correo: ${cliente.correo || 'Pendiente'}`,
    `Teléfono: ${cliente.telefono || 'Pendiente'}`,
    `Municipio: ${apartado.municipio || 'Pendiente'}`,
  ].forEach((linea) => {
    const lineas = documento.splitTextToSize(linea, 170);
    documento.text(lineas, margen, y);
    y += lineas.length * 6;
  });
  y += 4;

  documento.setFont('helvetica', 'bold');
  documento.text('Periodo de renta', margen, y);
  y += 7;
  documento.setFont('helvetica', 'normal');
  documento.text(`${fechaCorta(apartado.fechaInicio) || 'Pendiente'} a ${fechaCorta(apartado.fechaFin) || 'Pendiente'}`, margen, y);
  y += 12;

  documento.setFont('helvetica', 'bold');
  documento.text('Equipo(s)', margen, y);
  y += 7;
  documento.setFont('helvetica', 'normal');
  (apartado.equipos || []).forEach((equipo) => {
    const detalle = `${equipo.nombre || 'Pendiente'} · Modelo: ${equipo.modelo || 'Pendiente'} · Cantidad: ${equipo.cantidad || 'Pendiente'}`;
    const lineas = documento.splitTextToSize(detalle, 170);
    if (y + lineas.length * 6 > 265) {
      documento.addPage();
      y = 22;
    }
    documento.text(lineas, margen, y);
    y += lineas.length * 6 + 2;
  });
  y += 8;

  if (y > 265) {
    documento.addPage();
    y = 22;
  }
  documento.setFont('helvetica', 'bold');
  const monto = apartado.montoCotizado === null || apartado.montoCotizado === undefined
    ? 'Pendiente'
    : pesos(apartado.montoCotizado);
  documento.text(`Monto cotizado: ${monto}`, margen, y);
  y += 12;
  documento.setFont('helvetica', 'normal');
  documento.setFontSize(9);
  documento.text(
    documento.splitTextToSize('Documento de cobro generado por el sistema de rentas. No es comprobante fiscal ni acredita timbrado ante el SAT.', 170),
    margen,
    y,
  );
  return documento;
}
