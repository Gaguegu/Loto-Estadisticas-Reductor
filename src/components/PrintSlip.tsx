import React from 'react';
import { ReductionResult } from '../types';
import { REDUCTION_PLANS } from '../utils/reductions';
import ansamaLogo from '../assets/images/ansama_lottery_logo_1788692658153.jpg';

interface PrintSlipProps {
  result: ReductionResult;
}

export const PrintSlip: React.FC<PrintSlipProps> = ({ result }) => {
  const gameTitles: Record<string, string> = {
    primitiva: 'LOTERÍA PRIMITIVA',
    bonoloto: 'BONOLOTO',
    euromillones: 'EUROMILLONES',
  };

  const plan = REDUCTION_PLANS[result.guarantee];
  const formattedDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="print-only hidden print:block p-6 text-slate-900 bg-white font-sans max-w-2xl mx-auto">
      {/* Header formatted like an official lottery receipt */}
      <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-center justify-between gap-4">
        <img
          src={ansamaLogo}
          alt="ANSAMA Lotería"
          className="w-16 h-16 object-contain rounded-xl border border-slate-300 p-0.5"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 text-center">
          <h1 className="text-xl font-black uppercase tracking-wider">
            {gameTitles[result.game] || result.game.toUpperCase()}
          </h1>
          <p className="text-xs font-semibold text-slate-700 uppercase mt-0.5">
            BOLETO DE COMBINACIONES REDUCIDAS &bull; ANSAMA
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Generado el: {formattedDate}</p>
        </div>
        <div className="w-16 h-16 flex items-center justify-center font-black text-xs text-slate-500 border border-slate-200 rounded-lg">
          LOTO
        </div>
      </div>

      {/* Technical Configuration Summary */}
      <div className="bg-slate-100 p-3 rounded-lg border border-slate-300 text-xs mb-4 grid grid-cols-2 gap-2">
        <div>
          <span className="font-bold">Garantía del Sistema:</span> {plan.name}
        </div>
        <div>
          <span className="font-bold">Total Apuestas:</span> {result.columnsCount} columnas
        </div>
        <div>
          <span className="font-bold">Precio por Apuesta:</span> {result.pricePerBet.toFixed(2)} €
        </div>
        <div>
          <span className="font-bold">IMPORTE TOTAL:</span>{' '}
          <strong className="text-sm font-black">{result.totalCost.toFixed(2)} €</strong>
        </div>
        <div className="col-span-2 pt-1 border-t border-slate-200">
          <span className="font-bold">Números del Pronóstico ({result.selectedNumbers.length}):</span>{' '}
          <span className="font-mono font-bold">{result.selectedNumbers.join(', ')}</span>
        </div>
        {result.selectedStars && result.selectedStars.length > 0 && (
          <div className="col-span-2">
            <span className="font-bold">Estrellas ({result.selectedStars.length}):</span>{' '}
            <span className="font-mono font-bold">★ {result.selectedStars.join(', ★ ')}</span>
          </div>
        )}
      </div>

      {/* Columns Grid */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
          Desglose de Columnas ({result.columnsCount} apuestas)
        </h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
          {result.columns.map((col) => (
            <div
              key={col.id}
              className="flex items-center justify-between py-1 px-2 border-b border-slate-200"
            >
              <span className="font-bold text-slate-600 text-[11px]">C{col.id.toString().padStart(2, '0')}:</span>
              <span className="font-bold text-slate-900 tracking-wider">
                {col.numbers.map((n) => n.toString().padStart(2, '0')).join(' ')}
              </span>
              {col.stars && col.stars.length > 0 && (
                <span className="text-amber-700 font-bold ml-1">
                  ★ {col.stars.join(' ')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer receipt info */}
      <div className="border-t-2 border-dashed border-slate-400 pt-3 text-center text-[10px] text-slate-600">
        <p className="font-semibold">
          Comprueba tus apuestas en los puntos oficiales de Loterías y Apuestas del Estado.
        </p>
        <p className="mt-1 font-mono tracking-widest text-[9px] text-slate-400">
          *** SISTEMA REDUCIDO MATEMÁTICO - {result.columnsCount} APUESTAS ***
        </p>
      </div>
    </div>
  );
};
