import React, { useState, useEffect, useRef } from 'react';
import { GameType, SavedCombination } from '../types';
import {
  getSavedCombinations,
  deleteSavedCombination,
  saveCombination,
} from '../utils/savedCombinations';
import {
  FolderHeart,
  X,
  Play,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Upload,
  Coins,
  CheckCircle2,
  ArrowUp,
} from 'lucide-react';
import { downloadBlob } from '../utils/fileDownloader';

interface SavedCombinationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCombination: (combo: SavedCombination, autoScrutinize?: boolean) => void;
  activeGame: GameType;
  onCountChange?: (count: number) => void;
}

export const SavedCombinationsModal: React.FC<SavedCombinationsModalProps> = ({
  isOpen,
  onClose,
  onLoadCombination,
  activeGame,
  onCountChange,
}) => {
  const [combinations, setCombinations] = useState<SavedCombination[]>(() => getSavedCombinations());
  const [filterGame, setFilterGame] = useState<GameType | 'all'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Lock background body scrolling when modal is open to prevent touch scroll hijacking on mobile
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Reload saved combinations from storage every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      const fresh = getSavedCombinations();
      setCombinations(fresh);
      onCountChange?.(fresh.length);
    }
  }, [isOpen, onCountChange]);

  // Automatically scroll back to top whenever filter category changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
      setShowScrollTop(false);
    }
  }, [filterGame]);

  const handleScroll = () => {
    if (listRef.current) {
      setShowScrollTop(listRef.current.scrollTop > 80);
    }
  };

  const scrollToTop = () => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filtered = filterGame === 'all' ? combinations : combinations.filter((c) => c.game === filterGame);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la combinación guardada "${name}"?`)) {
      const updated = deleteSavedCombination(id);
      setCombinations(updated);
      onCountChange?.(updated.length);
      showToast('Combinación eliminada con éxito');
    }
  };

  const handleExport = () => {
    const jsonStr = JSON.stringify(combinations, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `mis_combinaciones_loterias_${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const current = getSavedCombinations();
          const merged = [...parsed, ...current].filter(
            (item, index, self) => index === self.findIndex((t) => t.id === item.id)
          );
          localStorage.setItem('loto_saved_combinations_v1', JSON.stringify(merged));
          setCombinations(merged);
          onCountChange?.(merged.length);
          showToast(`Se han importado ${parsed.length} combinaciones correctamente`);
        }
      } catch (err) {
        console.error(err);
        alert('Archivo JSON no válido');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 pt-3 pb-[max(4.75rem,calc(env(safe-area-inset-bottom,0px)+2.5rem))] sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-6rem)] sm:max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <FolderHeart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-black text-white truncate">
                  Mis Combinaciones y Peñas
                </h2>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-bold border border-slate-700 whitespace-nowrap">
                  {combinations.length} {combinations.length === 1 ? 'guardada' : 'guardadas'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-2 sm:line-clamp-none">
                Guarda tus jugadas habituales de peña o combinaciones fijas y cárgalas o escrútalas en 1 clic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action and Filter Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col gap-2.5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Filter buttons with clean wrap and mobile responsiveness */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-600 mr-0.5 shrink-0 text-xs">Filtrar por:</span>
              <button
                type="button"
                onClick={() => setFilterGame('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                  filterGame === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Todas ({combinations.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterGame('primitiva')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                  filterGame === 'primitiva'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Primitiva ({combinations.filter((c) => c.game === 'primitiva').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterGame('bonoloto')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                  filterGame === 'bonoloto'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Bonoloto ({combinations.filter((c) => c.game === 'bonoloto').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterGame('euromillones')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                  filterGame === 'euromillones'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs ring-1 ring-amber-500/50'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Euromillones ({combinations.filter((c) => c.game === 'euromillones').length})
              </button>
            </div>

            {/* Import / Backup actions */}
            <div className="flex items-center gap-2 shrink-0">
              <label className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer font-medium shadow-2xs text-xs">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Importar JSON</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
              <button
                type="button"
                onClick={handleExport}
                disabled={combinations.length === 0}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer font-medium shadow-2xs text-xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Copia de seguridad</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-6 py-2 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="cursor-pointer text-emerald-200 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Combination Cards List */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-3 bg-slate-100/50 overscroll-contain touch-pan-y relative"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FolderHeart className="w-8 h-8 stroke-1" />
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1">
                No tienes combinaciones guardadas en esta categoría
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Genera cualquier combinación reducida y haz clic en el botón «Guardar en Mis Combinaciones» para tenerla siempre a mano y escrutarla automáticamente sorteo tras sorteo.
              </p>
            </div>
          ) : (
            filtered.map((combo) => {
              const gameTheme =
                combo.game === 'primitiva'
                  ? {
                      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                      ball: 'bg-emerald-600 text-white',
                      name: 'Primitiva',
                    }
                  : combo.game === 'bonoloto'
                  ? {
                      badge: 'bg-blue-100 text-blue-900 border-blue-300',
                      ball: 'bg-blue-600 text-white',
                      name: 'Bonoloto',
                    }
                  : {
                      badge: 'bg-amber-100 text-amber-950 border-amber-300',
                      ball: 'bg-amber-400 text-slate-950 font-black',
                      name: 'Euromillones',
                    };

              const guaranteeText =
                combo.guarantee === 'direct'
                  ? 'Apuesta Directa'
                  : combo.guarantee === 'guarantee_5'
                  ? 'Reducida al 5 (100% si 6)'
                  : combo.guarantee === 'guarantee_4'
                  ? 'Reducida al 4 (100% si 6)'
                  : 'Reducida al 3 (100% si 6)';

              return (
                <div
                  key={combo.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md border ${gameTheme.badge}`}>
                        {gameTheme.name}
                      </span>
                      <h4 className="font-black text-slate-900 text-sm sm:text-base">{combo.name}</h4>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(combo.createdAt).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Numbers and Stars Display */}
                    <div className="flex flex-wrap items-center gap-1">
                      {combo.selectedNumbers.map((num) => (
                        <span
                          key={num}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-2xs ${gameTheme.ball}`}
                        >
                          {num}
                        </span>
                      ))}

                      {combo.selectedStars && combo.selectedStars.length > 0 && (
                        <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-300">
                          {combo.selectedStars.map((star) => (
                            <span
                              key={star}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black bg-amber-400 text-slate-950 shadow-2xs border border-amber-300"
                            >
                              ★{star}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Details Pill */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        {combo.columnsCount} {combo.columnsCount === 1 ? 'columna' : 'columnas'} ({guaranteeText})
                      </span>
                      <span>•</span>
                      <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-emerald-600" />
                        Coste: {combo.totalCost.toFixed(2)} €
                      </span>
                      {combo.notes && (
                        <>
                          <span>•</span>
                          <span className="italic text-slate-500">"{combo.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => onLoadCombination(combo, false)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      title="Cargar números y generar columnas en la aplicación"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                      <span>Cargar</span>
                    </button>
                    <button
                      onClick={() => onLoadCombination(combo, true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      title="Cargar y abrir el comprobador/escrutador directamente"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Escrutar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(combo.id, combo.name)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Eliminar de mis combinaciones"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Quick Floating Scroll-to-Top Button for mobile */}
          {showScrollTop && (
            <div className="sticky bottom-2 inset-x-0 flex justify-center z-30 pointer-events-none py-1">
              <button
                type="button"
                onClick={scrollToTop}
                className="pointer-events-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900/95 hover:bg-slate-900 active:bg-black text-white text-xs font-bold shadow-xl border border-slate-700/60 backdrop-blur-md transition-all active:scale-95 cursor-pointer animate-in fade-in zoom-in-95 duration-150"
                title="Volver arriba para ver filtros y combinaciones superiores"
              >
                <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Volver arriba</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="hidden sm:inline">Las combinaciones se guardan localmente en tu navegador de forma segura.</span>
          <div className="flex items-center gap-2 ml-auto">
            {showScrollTop && (
              <button
                type="button"
                onClick={scrollToTop}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold transition flex items-center gap-1.5 cursor-pointer text-xs"
                title="Volver arriba"
              >
                <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                <span>Arriba</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-950 text-white font-bold transition cursor-pointer text-xs sm:text-sm shadow-sm active:scale-95"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
