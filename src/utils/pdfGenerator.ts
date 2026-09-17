import jsPDF from 'jspdf';
import { ReductionResult } from '../types';
import { REDUCTION_PLANS } from './reductions';
import { generateTicketQRText, generateTicketQRCodeDataUrl } from './qrTicketChecker';
import { downloadBlob } from './fileDownloader';

/**
 * Colors configuration by lottery game.
 */
const GAME_COLORS = {
  primitiva: {
    primary: [4, 120, 87] as [number, number, number], // Emerald 700
    accent: [16, 185, 129] as [number, number, number], // Emerald 500
    light: [236, 253, 245] as [number, number, number], // Emerald 50
    border: [110, 231, 183] as [number, number, number],
    title: 'LOTERÍA PRIMITIVA',
  },
  bonoloto: {
    primary: [29, 78, 216] as [number, number, number], // Blue 700
    accent: [59, 130, 246] as [number, number, number], // Blue 500
    light: [239, 246, 255] as [number, number, number], // Blue 50
    border: [147, 197, 253] as [number, number, number],
    title: 'BONOLOTO',
  },
  euromillones: {
    primary: [180, 83, 9] as [number, number, number], // Amber 700
    accent: [245, 158, 11] as [number, number, number], // Amber 500
    light: [254, 252, 232] as [number, number, number], // Amber 50
    border: [252, 211, 77] as [number, number, number],
    title: 'EUROMILLONES',
  },
};

export interface GeneratePDFOptions {
  includeQRs?: boolean;
}

/**
 * Generates an official, publication-ready PDF slip for the reduction results.
 * 100% compatible with Android WebViews, iOS, and desktop browsers.
 */
export async function generateLotterySlipPDF(
  result: ReductionResult,
  columnReintegros: Record<number, number | undefined> = {},
  options: GeneratePDFOptions = { includeQRs: true }
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm

  const colors = GAME_COLORS[result.game] || GAME_COLORS.primitiva;
  const plan = REDUCTION_PLANS[result.guarantee];
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let currentY = margin;

  // Pre-generate QR codes for each 8-column slip if enabled
  const totalBoletos = Math.ceil(result.columns.length / 8);
  const boletoQRs: Record<number, string> = {};

  if (options.includeQRs) {
    for (let bIdx = 0; bIdx < totalBoletos; bIdx++) {
      const startIdx = bIdx * 8;
      const endIdx = Math.min(startIdx + 8, result.columns.length);
      const boletoCols = result.columns.slice(startIdx, endIdx);
      const firstR = columnReintegros[boletoCols[0]?.id] ?? boletoCols[0]?.reintegro;
      const isUniformR = boletoCols.every((c) => {
        const cr = columnReintegros[c.id] ?? c.reintegro;
        return cr === firstR;
      });
      const boletoR = isUniformR ? firstR : undefined;

      const qrText = generateTicketQRText(result.game, boletoCols, {
        reintegro: boletoR,
        title: `BOLETO ${bIdx + 1} (${startIdx + 1}-${endIdx})`,
      });

      try {
        const qrDataUrl = await generateTicketQRCodeDataUrl(qrText);
        if (qrDataUrl) {
          boletoQRs[bIdx] = qrDataUrl;
        }
      } catch (err) {
        console.warn('No se pudo generar QR para el boleto ' + (bIdx + 1), err);
      }
    }
  }

  // Draw Header Banner on current page
  const drawPageHeader = (isFirstPage: boolean) => {
    if (isFirstPage) {
      // Main Top Banner
      doc.setFillColor(...colors.primary);
      doc.roundedRect(margin, currentY, contentWidth, 22, 2.5, 2.5, 'F');

      // Top logo text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('ANSAMA LOTERÍAS', margin + 5, currentY + 7);

      doc.setFontSize(11);
      doc.text(colors.title, margin + 5, currentY + 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('BOLETO DE COMBINACIONES REDUCIDAS • RESGUARDO OFICIAL', margin + 5, currentY + 18);

      // Date / Info on right side
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`Fecha: ${dateStr} - ${timeStr}`, pageWidth - margin - 5, currentY + 8, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Sistemas Verificados SELAE`, pageWidth - margin - 5, currentY + 13, { align: 'right' });
      doc.text(`Garantía: ${plan.name}`, pageWidth - margin - 5, currentY + 18, { align: 'right' });

      currentY += 25;

      // Summary Details Card
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('Garantía del Sistema:', margin + 4, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(plan.name, margin + 42, currentY + 5);

      doc.setFont('helvetica', 'bold');
      doc.text('Total Apuestas:', margin + 4, currentY + 10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${result.columnsCount} columnas (${totalBoletos} ${totalBoletos === 1 ? 'boleto' : 'boletos'})`, margin + 42, currentY + 10);

      doc.setFont('helvetica', 'bold');
      doc.text('Precio por Columna:', margin + 105, currentY + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${result.pricePerBet.toFixed(2)} €`, margin + 140, currentY + 5);

      doc.setFont('helvetica', 'bold');
      doc.text('IMPORTE TOTAL:', margin + 105, currentY + 10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.primary);
      doc.text(`${result.totalCost.toFixed(2)} €`, margin + 140, currentY + 10);

      // Numbers & Stars
      doc.setTextColor(51, 65, 85); // slate-700
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const numsStr = result.selectedNumbers.map((n) => n.toString().padStart(2, '0')).join(', ');
      doc.text(`Números Pronosticados (${result.selectedNumbers.length}): `, margin + 4, currentY + 16);
      doc.setFont('helvetica', 'normal');
      doc.text(numsStr, margin + 55, currentY + 16);

      if (result.selectedStars && result.selectedStars.length > 0) {
        doc.setFont('helvetica', 'bold');
        const starsStr = result.selectedStars.map((s) => `★ ${s.toString().padStart(2, '0')}`).join(', ');
        doc.text(`Estrellas (${result.selectedStars.length}): ${starsStr}`, margin + 4, currentY + 20);
      }

      currentY += 25;
    } else {
      // Continuation Header
      doc.setFillColor(...colors.primary);
      doc.rect(margin, currentY, contentWidth, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`ANSAMA - ${colors.title} (Continuación de Boletos)`, margin + 4, currentY + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Garantía: ${plan.name} • ${result.columnsCount} columnas`, pageWidth - margin - 4, currentY + 5.5, { align: 'right' });
      currentY += 11;
    }
  };

  // Draw initial page header
  drawPageHeader(true);

  // Group columns into official 8-bet slips
  for (let bIdx = 0; bIdx < totalBoletos; bIdx++) {
    const startIdx = bIdx * 8;
    const endIdx = Math.min(startIdx + 8, result.columns.length);
    const boletoCols = result.columns.slice(startIdx, endIdx);
    const hasQR = Boolean(boletoQRs[bIdx]);

    // Calculate height needed for this boleto
    const lineCount = boletoCols.length;
    const boletoHeaderHeight = 6.5;
    const linesHeight = lineCount * 5.2 + 2;
    const boletoBoxHeight = Math.max(boletoHeaderHeight + linesHeight, hasQR ? 42 : 30);

    // Check if boleto fits on current page (leave 14mm for footer)
    if (currentY + boletoBoxHeight > pageHeight - 14) {
      doc.addPage();
      currentY = margin;
      drawPageHeader(false);
    }

    // Determine boleto reintegro info
    const firstR = columnReintegros[boletoCols[0]?.id] ?? boletoCols[0]?.reintegro;
    const isUniformR = boletoCols.every((c) => {
      const cr = columnReintegros[c.id] ?? c.reintegro;
      return cr === firstR;
    });
    const boletoRText = isUniformR && firstR !== undefined ? `Reintegro del Boleto: R-${firstR}` : '';

    // Draw Boleto Container
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.roundedRect(margin, currentY, contentWidth, boletoBoxHeight, 2, 2, 'FD');

    // Boleto Title Bar
    doc.setFillColor(...colors.light);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(margin, currentY, contentWidth, boletoHeaderHeight, 2, 2, 'FD');

    doc.setTextColor(...colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const boletoLabel = `BOLETO ${bIdx + 1} de ${totalBoletos}  (Apuestas ${startIdx + 1} a ${endIdx})`;
    doc.text(boletoLabel, margin + 4, currentY + 4.5);

    if (boletoRText) {
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(boletoRText, pageWidth - margin - (hasQR ? 44 : 5), currentY + 4.5, { align: 'right' });
    }

    // Draw Columns inside Boleto
    const textWidthAvailable = hasQR ? contentWidth - 40 : contentWidth - 8;
    let colY = currentY + boletoHeaderHeight + 4;

    boletoCols.forEach((col, cSubIdx) => {
      const globalIdx = startIdx + cSubIdx + 1;
      const letter = String.fromCharCode(65 + cSubIdx); // A, B, C, D, E, F, G, H
      const numFormatted = col.numbers.map((n) => n.toString().padStart(2, '0')).join('   ');
      const rVal = columnReintegros[col.id] ?? col.reintegro;
      const rStr = rVal !== undefined && !isUniformR ? ` (R: ${rVal})` : '';
      const starStr = col.stars && col.stars.length > 0 ? `  ★ ${col.stars.map((s) => s.toString().padStart(2, '0')).join(' ')}` : '';

      // Column identifier badge
      doc.setTextColor(71, 85, 105); // slate-600
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`${letter} (${globalIdx.toString().padStart(2, '0')}):`, margin + 4, colY);

      // Numbers
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.text(numFormatted, margin + 22, colY);

      // Stars or individual reintegro
      if (starStr || rStr) {
        doc.setTextColor(...colors.primary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(`${starStr}${rStr}`, margin + 85, colY);
      }

      colY += 4.8;
    });

    // Draw Boleto QR Code if present
    if (hasQR && boletoQRs[bIdx]) {
      const qrSize = 30;
      const qrX = pageWidth - margin - qrSize - 3;
      const qrY = currentY + boletoHeaderHeight + (boletoBoxHeight - boletoHeaderHeight - qrSize) / 2;

      try {
        doc.addImage(boletoQRs[bIdx], 'PNG', qrX, qrY, qrSize, qrSize);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Escanear QR', qrX + qrSize / 2, qrY + qrSize + 2.5, { align: 'center' });
      } catch (err) {
        console.warn('Error rendering QR image in PDF:', err);
      }
    }

    currentY += boletoBoxHeight + 3.5;
  }

  // Add Footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(
      'Documento oficial generado por ANSAMA LotoEstadísticas & Reductor • Loterías y Apuestas del Estado',
      margin,
      pageHeight - 6.5
    );

    doc.setFont('helvetica', 'bold');
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
  }

  return doc;
}

/**
 * Downloads the generated PDF directly to the device.
 * Works seamlessly in Android WebViews, iOS Safari, Chrome, and Desktop.
 */
export function downloadLotterySlipPDF(doc: jsPDF, filename: string): void {
  try {
    const blob = doc.output('blob');
    downloadBlob(blob, filename);
  } catch (err) {
    console.error('Error al generar y descargar PDF con blob, usando doc.save:', err);
    doc.save(filename);
  }
}

/**
 * Shares the PDF using Web Share API (native share on Android/iOS).
 * Falls back to download if sharing is not supported.
 */
export async function shareLotterySlipPDF(doc: jsPDF, filename: string): Promise<boolean> {
  try {
    const blob = doc.output('blob');
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Boleto de Lotería ANSAMA',
        text: 'Aquí tienes el resguardo oficial en PDF con las combinaciones reducidas y códigos QR.',
      });
      return true;
    }
  } catch (err) {
    console.warn('navigator.share falló o fue cancelado:', err);
  }
  return false;
}

/**
 * Generates an official, comprehensive User Manual in PDF format.
 */
export async function generateUserManualPDF(): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;

  // Cover / Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, currentY, contentWidth, 26, 3, 3, 'F');

  doc.setTextColor(245, 158, 11); // amber-500
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DOCUMENTACIÓN OFICIAL & MANUAL DE USO', margin + 6, currentY + 7);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('ANSAMA LOTOESTADÍSTICAS & REDUCTOR PRO', margin + 6, currentY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Guía Completa para Jugadores y Peñas • La Primitiva, Bonoloto y Euromillones', margin + 6, currentY + 21);

  currentY += 32;

  // Introduction Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 28, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('1. Introducción y Fundamentos', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const introText =
    'Esta aplicación profesional permite optimizar las probabilidades de premio en los juegos oficiales de Loterías y Apuestas del Estado mediante dos pilares matemáticos:\n' +
    '• Análisis Estadístico Real: Detección de frecuencias, números calientes y rachas a partir de la base de datos oficial verificada.\n' +
    '• Sistemas Reducidos Certificados: Algoritmos matemáticos que abarcan muchos más números por una fracción mínima del coste de una jugada directa al directo, asegurando premios de 5, 4 o 3 aciertos si entran los números del pronóstico.';
  
  doc.text(doc.splitTextToSize(introText, contentWidth - 8), margin + 4, currentY + 11);

  currentY += 32;

  // Section 2: Systems table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Catálogo de Reducciones Oficiales Disponibles', margin, currentY);
  currentY += 5;

  const reductions = [
    { name: '12 Números al 5 (100% si 6)', bets: '40 columnas', ahorro: '95,7% de ahorro', desc: 'Garantía matemática de 5 aciertos al 100% si los 6 ganadores están en tus 12 elegidos.' },
    { name: '12 Números al 4 (100% si 6)', bets: '6 columnas', ahorro: '99,3% de ahorro', desc: 'Garantiza premio de 4 aciertos por solo 6 apuestas (3,00 € en Bonoloto o 6,00 € en Primitiva).' },
    { name: '12 Números al 3 (100% si 6)', bets: '2 columnas', ahorro: '99,8% de ahorro', desc: 'Juega 12 números con garantía de premio por solo 2 apuestas.' },
    { name: '10 Números y 5 Estrellas (Euromillones)', bets: '14 columnas', ahorro: '97,2% de ahorro', desc: 'Garantiza premio de 4 aciertos y estrellas reducidas para el sorteo europeo.' },
  ];

  reductions.forEach((red) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(red.name, margin + 3, currentY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(`${red.bets} (${red.ahorro})`, pageWidth - margin - 3, currentY + 4.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(red.desc, margin + 3, currentY + 10);

    currentY += 16;
  });

  // Section 3: Step by Step Guide
  currentY += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Guía Paso a Paso para Generar tus Combinaciones', margin, currentY);
  currentY += 5;

  const steps = [
    '1. Selecciona el juego deseado en la barra superior (La Primitiva, Bonoloto o Euromillones).',
    '2. Consulta la tabla estadística: Puedes ordenar por frecuencia para ver los números más repetidos.',
    '3. Marca tus números en la rejilla interactiva o pulsa en «Completar con Más Frecuentes».',
    '4. Escoge la garantía de reducción (al 5, al 4 o al 3 según tu presupuesto).',
    '5. Pulsa en «Generar y Calcular Columnas» para obtener el desglose oficial de apuestas.',
    '6. Puedes guardar la combinación en «Mis Peñas», descargar el resguardo en PDF oficial con códigos QR o escrutar premios al instante tras el sorteo.',
  ];

  steps.forEach((step) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(step, margin + 3, currentY);
    currentY += 5.5;
  });

  // Section 4: Scanner & QR
  currentY += 4;
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

  doc.setTextColor(49, 46, 129); // indigo-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('4. Escáner Oficial de Boletos & Escrutador Automático', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(67, 56, 202);
  const scannerText =
    'La app cuenta con un lector QR de boletos físicos y digitales de Loterías y Apuestas del Estado. Puedes activar la cámara de tu móvil para escanear el boleto sellado en la administración o cargar una foto de la galería. El sistema desglosa automáticamente todas las apuestas, identifica aciertos, complementario y reintegro, y calcula el importe total ganado en euros según el escrutinio oficial.';
  doc.text(doc.splitTextToSize(scannerText, contentWidth - 8), margin + 4, currentY + 10);

  // Footer on page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Manual de Usuario ANSAMA LotoEstadísticas & Reductor • Edición 2026', margin, pageHeight - 6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
  }

  return doc;
}
