import React, { useState } from 'react';
import { GameType, ReductionGuarantee } from '../types';
import { saveCombination } from '../utils/savedCombinations';
import { FolderPlus, X, Check, Layers, Coins } from 'lucide-react';

interface SaveCombinationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (name: string) => void;
  game: GameType;
  selectedNumbers: number[];
  selectedStars?: number[];
  guarantee: ReductionGuarantee;
  columnsCount: number;
  totalCost: number;
  pricePerBet: number;
}

export const SaveCombinationDialog: React.FC<SaveCombinationDialogProps> = ({
  isOpen,
  onClose,
  onSaved,
  game,
  selectedNumbers,
  selectedStars,
  guarantee,
  columnsCount,
  totalCost,
  pricePerBet,
}) => {
  const [name, setName] = useState(() => {
    const gameName = game === 'primitiva' ? 'Primitiva' : game === 'bonoloto' ? 'Bonoloto' : 'Euromillones';
    const numCount = selectedNumbers.length;
    return `Peña ${gameName} - ${numCount} Números`;
  });
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    saveCombination({
      name: name.trim(),
      game,
      selectedNumbers,
      selectedStars,
      guarantee,
      columnsCount,
      totalCost,
      pricePerBet,
      notes: notes.trim() || undefined,
    });

    onSaved(name.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm">Guardar en Mis Combinaciones</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre de la combinación o peña <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Jugada de amigos Los 12 al 5"
              required
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notas o descripción (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Jugamos todos los jueves 2€ por persona..."
              rows={2}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Summary Preview */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Juego:</span>
              <span className="font-bold text-slate-800 uppercase text-[11px]">
                {game}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Apuestas generadas:</span>
              <span className="font-mono font-bold text-slate-800">{columnsCount} columnas</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Inversión / Coste:</span>
              <span className="font-mono font-black text-emerald-700">{totalCost.toFixed(2)} €</span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 text-[11px] block mb-1">Números incluidos:</span>
              <div className="flex flex-wrap gap-1">
                {selectedNumbers.map((n) => (
                  <span
                    key={n}
                    className="w-5 h-5 rounded-full bg-slate-800 text-white font-mono text-[10px] font-bold flex items-center justify-center"
                  >
                    {n}
                  </span>
                ))}
                {selectedStars &&
                  selectedStars.map((s) => (
                    <span
                      key={s}
                      className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-mono text-[10px] font-bold flex items-center justify-center border border-amber-300"
                    >
                      ★{s}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Guardar Combinación</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
