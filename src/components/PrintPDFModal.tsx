import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  Share2,
  CheckCircle2,
  QrCode,
  Sparkles,
  Loader2,
  Info,
} from 'lucide-react';
import { ReductionResult } from '../types';
import { REDUCTION_PLANS } from '../utils/reductions';
import {
  generateLotterySlipPDF,
  downloadLotterySlipPDF,
  shareLotterySlipPDF,
} from '../utils/pdfGenerator';

interface PrintPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ReductionResult;
  columnReintegros: Record<number, number | undefined>;
  onClassicPrint?: () => void;
}

export const PrintPDFModal: React.FC<PrintPDFModalProps> = ({
  isOpen,
  onClose,
  result,
  columnReintegros,
  onClassicPrint,
}) => {
  const [includeQRs, setIncludeQRs] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [canShare] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' && Boolean(navigator.canShare);
  });

  if (!isOpen) return null;

  const plan = REDUCTION_PLANS[result.guarantee];
  const dateStr = new Date().toISOString().split('T')[0];
  const pdfFilename = `Boleto_${result.game.toUpperCase()}_${plan.id}_${result.columnsCount}apuestas_${dateStr}.pdf`;

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      setStatusMessage('Generando documento PDF oficial...');
      const doc = await generateLotterySlipPDF(result, columnReintegros, { includeQRs });
      downloadLotterySlipPDF(doc, pdfFilename);
      setStatusMessage('¡Archivo PDF descargado correctamente!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Error generando PDF para descarga:', err);
      setStatusMessage('Hubo un error al generar el PDF. Reintentando...');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    try {
      setIsGenerating(true);
      setStatusMessage('Preparando archivo para compartir...');
      const doc = await generateLotterySlipPDF(result, columnReintegros, { includeQRs });
      const shared = await shareLotterySlipPDF(doc, pdfFilename);
      if (shared) {
        setStatusMessage('¡Boleto compartido con éxito!');
      } else {
        // Fallback to download if share is dismissed or not supported
        downloadLotterySlipPDF(doc, pdfFilename);
        setStatusMessage('Compartición no disponible. Se ha descargado el PDF.');
      }
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Error al compartir PDF:', err);
      handleDownload();
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintSystem = () => {
    if (onClassicPrint) {
      onClassicPrint();
      onClose();
    } else {
      window.print();
    }
  };

  const isEuro = result.game === 'euromillones';
  const themeColor =
    result.game === 'primitiva'
      ? 'from-emerald-600 to-teal-700 text-white'
      : result.game === 'bonoloto'
      ? 'from-blue-600 to-indigo-700 text-white'
      : 'from-amber-400 to-amber-500 text-slate-950 font-black';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 pb-[max(4.5rem,calc(env(safe-area-inset-bottom,0px)+2.5rem))] animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[calc(100dvh-5.5rem)] overflow-hidden">
        {/* Header */}
        <div className={`px-5 py-4 bg-gradient-to-r ${themeColor} flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">
                Imprimir o Guardar en PDF
              </h3>
              <p className="text-xs opacity-90 font-medium">
                {result.game.toUpperCase()} &bull; {result.columnsCount} columnas ({result.totalCost.toFixed(2)} €)
              </p>
            </div>
          </div>
          <button
            id="btn-close-print-pdf-modal"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/20 text-current transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-800">
          {/* Summary pill */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-500 block">Garantía del Sistema</span>
              <span className="font-bold text-slate-900">{plan.name}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-slate-500 block">Boletos Oficiales</span>
              <span className="font-bold text-slate-900">
                {Math.ceil(result.columns.length / 8)} {Math.ceil(result.columns.length / 8) === 1 ? 'boleto' : 'boletos'} (8 col/boleto)
              </span>
            </div>
          </div>

          {/* Option: QR Checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeQRs}
              onChange={(e) => setIncludeQRs(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <div className="flex items-center gap-2 flex-1">
              <QrCode className="w-4 h-4 text-slate-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Incluir Códigos QR en cada boleto</span>
                <span className="text-slate-500 text-[11px]">
                  Permite escanear y comprobar automáticamente las apuestas desde la propia app.
                </span>
              </div>
            </div>
          </label>

          {/* Action Status Feedback */}
          {statusMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Primary Action: Download PDF */}
          <div className="space-y-2">
            <button
              id="btn-modal-download-pdf"
              onClick={handleDownload}
              disabled={isGenerating}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-95 cursor-pointer ${
                result.game === 'primitiva'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white'
                  : result.game === 'bonoloto'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generando Documento PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5" />
                  <span>Descargar Archivo PDF (Recomendado)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              Guarda el resguardo oficial en tu teléfono para abrirlo, guardarlo o imprimirlo en cualquier momento.
            </p>
          </div>

          {/* Secondary Actions: Share & Native Print */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              id="btn-modal-share-pdf"
              onClick={handleShare}
              disabled={isGenerating}
              className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-slate-600" />
              <span>Compartir PDF (WhatsApp)</span>
            </button>

            <button
              id="btn-modal-native-print"
              onClick={handlePrintSystem}
              className="py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Asistente de Impresión</span>
            </button>
          </div>

          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              En teléfonos móviles y la app instalada, la opción <strong>«Descargar Archivo PDF»</strong> genera directamente el documento en tu carpeta de Descargas con formato oficial de Loterías y Apuestas del Estado.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
