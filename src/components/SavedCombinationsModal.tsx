import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

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

  // Reload saved combinations from storage every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      const fresh = getSavedCombinations();
      setCombinations(fresh);
      onCountChange?.(fresh.length);
    }
  }, [isOpen, onCountChange]);

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
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(combinations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mis_combinaciones_loterias_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <FolderHeart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Mis Combinaciones y Peñas</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-bold border border-slate-700">
                  {combinations.length} {combinations.length === 1 ? 'guardada' : 'guardadas'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Guarda tus jugadas habituales de peña o combinaciones fijas y cárgalas o escrútalas en 1 clic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action and Filter Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600 mr-1">Filtrar por:</span>
            <button
              onClick={() => setFilterGame('all')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterGame === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Todas ({combinations.length})
            </button>
            <button
              onClick={() => setFilterGame('primitiva')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterGame === 'primitiva'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Primitiva ({combinations.filter((c) => c.game === 'primitiva').length})
            </button>
            <button
              onClick={() => setFilterGame('bonoloto')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterGame === 'bonoloto'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Bonoloto ({combinations.filter((c) => c.game === 'bonoloto').length})
            </button>
            <button
              onClick={() => setFilterGame('euromillones')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                filterGame === 'euromillones'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Euromillones ({combinations.filter((c) => c.game === 'euromillones').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer font-medium shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Importar JSON</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={handleExport}
              disabled={combinations.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer font-medium shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Copia de seguridad</span>
            </button>
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
        <div className="p-6 overflow-y-auto flex-1 space-y-3 bg-slate-100/50">
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
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>Las combinaciones se guardan localmente en tu navegador de forma segura.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
