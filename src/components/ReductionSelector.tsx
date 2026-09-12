import React from 'react';
import { GameType, ReductionGuarantee, SelectionCriterion } from '../types';
import { REDUCTION_PLANS } from '../utils/reductions';
import { DEFAULT_PRICES } from '../utils/lotteryStats';
import {
  ShieldCheck,
  Coins,
  Sparkles,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Star,
  Flame,
  Clock,
  Zap,
  Scale,
} from 'lucide-react';

interface ReductionSelectorProps {
  game: GameType;
  selectedNumbers: number[];
  selectedStars: number[];
  guarantee: ReductionGuarantee;
  onChangeGuarantee: (g: ReductionGuarantee) => void;
  pricePerBet: number;
  onChangePricePerBet: (price: number) => void;
  onGenerate: () => void;
  onSelectQuickCount: (count: number) => void;
  onSelectQuickStarsCount?: (count: number) => void;
  selectionCriterion?: SelectionCriterion;
  onChangeCriterion?: (criterion: SelectionCriterion) => void;
}

export const ReductionSelector: React.FC<ReductionSelectorProps> = ({
  game,
  selectedNumbers,
  selectedStars,
  guarantee,
  onChangeGuarantee,
  pricePerBet,
  onChangePricePerBet,
  onGenerate,
  onSelectQuickCount,
  onSelectQuickStarsCount,
  selectionCriterion = 'frequency',
  onChangeCriterion,
}) => {
  const minRequired = game === 'euromillones' ? 5 : 6;
  const maxAllowed = game === 'euromillones' ? 10 : 12;
  const isNumbersValid = selectedNumbers.length >= minRequired && selectedNumbers.length <= maxAllowed;
  const isStarsValid = game !== 'euromillones' || (selectedStars.length >= 2 && selectedStars.length <= 5);
  const isSelectionValid = isNumbersValid && isStarsValid;

  const quickCounts = game === 'euromillones' ? [5, 6, 7, 8, 9, 10] : [6, 7, 8, 9, 10, 11, 12];
  const starCounts = [2, 3, 4, 5];

  const plans: ReductionGuarantee[] = ['guarantee_5', 'guarantee_4', 'guarantee_3', 'direct'];

  const defaultPrice = DEFAULT_PRICES[game];

  const criteriaOptions: { id: SelectionCriterion; label: string; icon: React.ReactNode; tooltip: string }[] = [
    {
      id: 'frequency',
      label: 'Más Frecuentes',
      icon: <Flame className="w-3.5 h-3.5 text-amber-500" />,
      tooltip: 'Selecciona los números y estrellas con más apariciones en el histórico',
    },
    {
      id: 'delay_desc',
      label: 'Mayor Atraso',
      icon: <Clock className="w-3.5 h-3.5 text-rose-500" />,
      tooltip: 'Selecciona los números y estrellas que llevan más sorteos seguidos sin salir',
    },
    {
      id: 'streak',
      label: 'En Racha',
      icon: <Zap className="w-3.5 h-3.5 text-yellow-500" />,
      tooltip: 'Selecciona los números y estrellas calientes que han salido en los sorteos más recientes',
    },
    {
      id: 'balanced',
      label: 'Equilibrado (50/50)',
      icon: <Scale className="w-3.5 h-3.5 text-indigo-500" />,
      tooltip: 'Combina 50% frecuentes + 50% mayor atraso para números y estrellas',
    },
  ];

  return (
    <div
      className={`bg-white rounded-2xl p-4 sm:p-5 shadow-xs border transition-colors ${
        game === 'primitiva'
          ? 'border-emerald-200/90'
          : game === 'bonoloto'
          ? 'border-blue-200/90'
          : 'border-amber-300/80'
      }`}
    >
      {/* Title & Game Badge Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl border shadow-2xs ${
              game === 'primitiva'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : game === 'bonoloto'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Sistema de Reducción y Cálculo de Precio</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  game === 'primitiva'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60'
                    : game === 'bonoloto'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300/60'
                    : 'bg-amber-100 text-amber-900 border border-amber-300/70'
                }`}
              >
                {game === 'primitiva' ? 'Primitiva' : game === 'bonoloto' ? 'Bonoloto' : 'Euromillones'}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Elige cantidades a reducir, criterio estadístico y garantía matemática
            </p>
          </div>
        </div>
      </div>

      {/* Statistical Filter & Reduction Quantities Bar */}
      <div className="mt-4 p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3">
        {/* 1. Statistical criterion selector applied to both numbers and stars */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-800">
              Filtro estadístico aplicado{game === 'euromillones' ? ' (números y estrellas)' : ''}:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {criteriaOptions.map((opt) => {
              const isActive = selectionCriterion === opt.id;
              return (
                <button
                  key={opt.id}
                  id={`criterion-btn-${opt.id}`}
                  type="button"
                  onClick={() => onChangeCriterion && onChangeCriterion(opt.id)}
                  title={opt.tooltip}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 border ${
                    isActive
                      ? game === 'primitiva'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : game === 'bonoloto'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-amber-400 text-slate-950 font-black border-amber-400 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Numbers count selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Cantidad de números a reducir:</span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
                selectedNumbers.length >= minRequired && selectedNumbers.length <= maxAllowed
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {selectedNumbers.length} elegidos
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {quickCounts.map((count) => {
              const isActive = selectedNumbers.length === count;
              return (
                <button
                  key={count}
                  id={`quick-count-${count}`}
                  type="button"
                  onClick={() => onSelectQuickCount(count)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 border ${
                    isActive
                      ? game === 'primitiva'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-1 ring-emerald-400/40'
                        : game === 'bonoloto'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-1 ring-blue-400/40'
                        : 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black border-amber-300 ring-1 ring-amber-400/40'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {count} {count === (game === 'euromillones' ? 10 : 12) ? 'números' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Stars count selector (Euromillones only) */}
        {game === 'euromillones' && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/60 bg-amber-50/50 p-2 rounded-lg border">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="text-xs font-bold text-amber-950">Cantidad de estrellas a reducir:</span>
              <span
                className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
                  selectedStars.length >= 2 && selectedStars.length <= 5
                    ? 'bg-amber-200/90 text-amber-950'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {selectedStars.length} elegidas
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {starCounts.map((count) => {
                const isActive = selectedStars.length === count;
                return (
                  <button
                    key={count}
                    id={`quick-star-count-${count}`}
                    type="button"
                    onClick={() => onSelectQuickStarsCount && onSelectQuickStarsCount(count)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 border ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-black border-amber-400 shadow-xs ring-2 ring-amber-400/50'
                        : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100/70'
                    }`}
                  >
                    <Star className="w-3 h-3 fill-current" />
                    <span>{count} estrellas</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Reduction Guarantee Types Grid */}
      <div className="mt-4">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Garantía Matemática de la Reducción:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {plans.map((pKey) => {
            const plan = REDUCTION_PLANS[pKey];
            const isSelected = guarantee === pKey;

            return (
              <div
                key={pKey}
                id={`plan-card-${pKey}`}
                onClick={() => onChangeGuarantee(pKey)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? game === 'primitiva'
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-400/30'
                      : game === 'bonoloto'
                      ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-2 ring-blue-400/30'
                      : 'border-amber-400/90 bg-amber-50/70 shadow-xs ring-2 ring-amber-400/30'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-md ${
                      isSelected
                        ? game === 'primitiva'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white'
                          : game === 'bonoloto'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white'
                          : 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {plan.shortName}
                  </span>
                  {isSelected && (
                    <Sparkles
                      className={`w-4 h-4 ${
                        game === 'primitiva'
                          ? 'text-emerald-600'
                          : game === 'bonoloto'
                          ? 'text-blue-600'
                          : 'text-amber-500'
                      }`}
                    />
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-900 mt-1">
                  {plan.guaranteeText}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {plan.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Configuration & Summary Bar */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Price Per Column input */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="price-per-bet-input" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Coins
                className={`w-4 h-4 ${
                  game === 'primitiva'
                    ? 'text-emerald-600'
                    : game === 'bonoloto'
                    ? 'text-blue-600'
                    : 'text-amber-500'
                }`}
              />
              Precio por apuesta / columna:
            </label>
            {pricePerBet !== defaultPrice && (
              <button
                type="button"
                onClick={() => onChangePricePerBet(defaultPrice)}
                className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                title="Restablecer precio oficial"
              >
                <RotateCcw className="w-3 h-3" /> Oficial ({defaultPrice.toFixed(2)} €)
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="price-per-bet-input"
                type="number"
                step="0.10"
                min="0.10"
                max="100.00"
                value={pricePerBet}
                onChange={(e) => onChangePricePerBet(parseFloat(e.target.value) || 0)}
                className={`w-full text-sm font-bold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-hidden focus:ring-2 ${
                  game === 'primitiva'
                    ? 'focus:ring-emerald-500'
                    : game === 'bonoloto'
                    ? 'focus:ring-blue-500'
                    : 'focus:ring-amber-500'
                }`}
              />
              <span className="absolute right-3 top-1.5 text-xs font-bold text-slate-500">€</span>
            </div>
            <div className="text-[11px] text-slate-500 leading-tight">
              Modificable si LAE varía precios
            </div>
          </div>
        </div>

        {/* Selected numbers status */}
        <div className="text-xs text-slate-600 space-y-1">
          <div>
            <span className="font-semibold text-slate-800">Números elegidos:</span>{' '}
            <strong
              className={`font-mono text-sm px-1.5 py-0.5 rounded border font-black ${
                game === 'primitiva'
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300/80'
                  : game === 'bonoloto'
                  ? 'bg-blue-100 text-blue-950 border-blue-300/80'
                  : 'bg-amber-100 text-amber-950 border-amber-300/80'
              }`}
            >
              {selectedNumbers.length}
            </strong>{' '}
            (mín. {minRequired}, máx. {maxAllowed})
          </div>
          {game === 'euromillones' && (
            <div>
              <span className="font-semibold text-slate-800">Estrellas elegidas:</span>{' '}
              <strong
                className={`font-mono text-sm px-1.5 py-0.5 rounded border font-black ${
                  selectedStars.length >= 2 && selectedStars.length <= 5
                    ? 'text-amber-950 bg-amber-100/90 border-amber-300/80'
                    : 'text-rose-950 bg-rose-100 border-rose-300'
                }`}
              >
                {selectedStars.length}
              </strong>{' '}
              (mín. 2, máx. 5)
            </div>
          )}
          {!isNumbersValid && (
            <div className="text-rose-600 flex items-center gap-1 font-medium text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Selecciona entre {minRequired} y {maxAllowed} números
            </div>
          )}
          {game === 'euromillones' && !isStarsValid && (
            <div className="text-rose-600 flex items-center gap-1 font-medium text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Selecciona entre 2 y 5 estrellas para Euromillones
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div>
          <button
            id="btn-generate-reduction"
            disabled={!isSelectionValid}
            onClick={onGenerate}
            className={`w-full py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 ${
              isSelectionValid
                ? game === 'primitiva'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/60 shadow-emerald-900/20 ring-2 ring-emerald-400/30 cursor-pointer'
                  : game === 'bonoloto'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/60 shadow-blue-900/20 ring-2 ring-blue-400/30 cursor-pointer'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 border border-amber-300 shadow-amber-900/20 ring-2 ring-amber-400/30 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <span>Generar y Calcular Columnas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
