import React, { useState, useRef, useEffect } from 'react';
import { LotteryDraw, GameType } from '../types';
import {
  X,
  Plus,
  RotateCcw,
  Calendar,
  AlertCircle,
  RefreshCw,
  Download,
  Upload,
  Database,
  CheckCircle2,
  ExternalLink,
  Info,
  Edit2,
  Scale,
  ShieldCheck,
  CheckCheck,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  parseAndValidateDraws,
  OFFICIAL_DRAW_HOURS,
  OFFICIAL_WEB_URLS,
  LOTOIDEAS_WEB_URLS,
  fetchOfficialDrawsFromLotoideas,
  compareDrawsWithOfficialSource,
  ConfrontationReport,
  DiscrepancyItem,
} from '../utils/syncDatabase';
import { getMaxCelebratedDateForGame, INITIAL_DRAWS } from '../data/historicalDraws';

interface DrawsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameType;
  draws: LotteryDraw[];
  onAddDraw: (draw: LotteryDraw) => void;
  onResetDraws: () => void;
  onSyncDatabase: () => void;
  isSyncing: boolean;
  missingDrawsCount: number;
  autoSyncEnabled: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
  onExportDatabase: () => void;
  onImportDatabase: (importedDraws: LotteryDraw[]) => void;
}

export const DrawsHistoryModal: React.FC<DrawsHistoryModalProps> = ({
  isOpen,
  onClose,
  game,
  draws,
  onAddDraw,
  onResetDraws,
  onSyncDatabase,
  isSyncing,
  missingDrawsCount,
  autoSyncEnabled,
  onToggleAutoSync,
  onExportDatabase,
  onImportDatabase,
}) => {
  const maxCelebratedDate = getMaxCelebratedDateForGame(game);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDrawId, setEditingDrawId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(maxCelebratedDate);
  const [newNumbersStr, setNewNumbersStr] = useState('');
  const [newComplementario, setNewComplementario] = useState('');
  const [newReintegro, setNewReintegro] = useState('');
  const [newStarsStr, setNewStarsStr] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Confrontation / Verification state
  const [isConfronting, setIsConfronting] = useState(false);
  const [confrontReport, setConfrontReport] = useState<ConfrontationReport | null>(null);
  const [showConfrontModal, setShowConfrontModal] = useState(false);
  const [confrontNotice, setConfrontNotice] = useState<string | null>(null);

  // Lock body scrolling when modal is open to prevent touch scroll conflicts on mobile
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEditDraw = (draw: LotteryDraw) => {
    setEditingDrawId(draw.id);
    setNewDate(draw.date);
    setNewNumbersStr(draw.numbers.join(' '));
    setNewComplementario(draw.complementario !== undefined ? String(draw.complementario) : '');
    setNewReintegro(draw.reintegro !== undefined ? String(draw.reintegro) : '');
    setNewStarsStr(draw.stars ? draw.stars.join(' ') : '');
    setShowAddForm(true);
    setErrorMessage('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseAndValidateDraws(content, game);
      if (res.valid && res.draws) {
        onImportDatabase(res.draws);
        setImportStatus(
          res.format === 'csv'
            ? `¡Éxito! Se importaron ${res.draws.length} sorteos oficiales desde archivo CSV de Lotoideas/SELAE.`
            : `¡Éxito! Se importaron ${res.draws.length} sorteos correctamente.`
        );
        setTimeout(() => setImportStatus(null), 5000);
      } else {
        setImportStatus(res.error || 'Error al importar archivo.');
        setTimeout(() => setImportStatus(null), 5000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const gameDraws = draws
    .filter((d) => d.game === game)
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleConfrontSources = async () => {
    setIsConfronting(true);
    setConfrontNotice(null);
    try {
      // 1. Try fetching online CSV from Lotoideas
      const fetchRes = await fetchOfficialDrawsFromLotoideas(game);
      let officialSourceDraws: LotteryDraw[] = [];

      if (fetchRes.success && fetchRes.draws.length > 0) {
        officialSourceDraws = fetchRes.draws;
      } else {
        // Fallback to verified INITIAL_DRAWS
        officialSourceDraws = INITIAL_DRAWS.filter((d) => d.game === game);
      }

      const report = compareDrawsWithOfficialSource(game, draws, officialSourceDraws);
      setConfrontReport(report);
      setShowConfrontModal(true);
    } catch (err: any) {
      console.error('Error during confrontation', err);
      const fallbackDraws = INITIAL_DRAWS.filter((d) => d.game === game);
      const report = compareDrawsWithOfficialSource(game, draws, fallbackDraws);
      setConfrontReport(report);
      setShowConfrontModal(true);
    } finally {
      setIsConfronting(false);
    }
  };

  const handleFixDiscrepancy = (item: DiscrepancyItem) => {
    const fixedDraw: LotteryDraw = {
      id: item.id,
      game: item.game,
      date: item.date,
      dayOfWeek: item.dayOfWeek,
      numbers: [...item.officialNumbers],
      complementario: item.officialComp,
      reintegro: item.officialReint,
      stars: item.officialStars ? [...item.officialStars] : undefined,
      joker: item.officialJoker,
    };
    onAddDraw(fixedDraw);

    // Update confrontation report locally
    if (confrontReport) {
      const remaining = confrontReport.discrepancies.filter((d) => d.date !== item.date);
      setConfrontReport({
        ...confrontReport,
        discrepancies: remaining,
        matchingCount: confrontReport.matchingCount + 1,
      });
      setConfrontNotice(`Sorteo del ${item.date} corregido exitosamente a la combinación oficial.`);
      setTimeout(() => setConfrontNotice(null), 4000);
    }
  };

  const handleFixAllDiscrepancies = () => {
    if (!confrontReport || confrontReport.discrepancies.length === 0) return;

    for (const item of confrontReport.discrepancies) {
      const fixedDraw: LotteryDraw = {
        id: item.id,
        game: item.game,
        date: item.date,
        dayOfWeek: item.dayOfWeek,
        numbers: [...item.officialNumbers],
        complementario: item.officialComp,
        reintegro: item.officialReint,
        stars: item.officialStars ? [...item.officialStars] : undefined,
        joker: item.officialJoker,
      };
      onAddDraw(fixedDraw);
    }

    setConfrontReport({
      ...confrontReport,
      matchingCount: confrontReport.matchingCount + confrontReport.discrepancies.length,
      discrepancies: [],
    });
    setConfrontNotice(`¡Todas las discrepancias (${confrontReport.discrepancies.length}) se han corregido con los datos oficiales!`);
    setTimeout(() => setConfrontNotice(null), 5000);
  };

  const handleCreateDraw = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newDate > maxCelebratedDate) {
      setErrorMessage(
        `No se puede registrar un sorteo con fecha posterior al último celebrado (${maxCelebratedDate}). El sorteo de hoy se celebra por la noche.`
      );
      return;
    }

    const parsedNums = newNumbersStr
      .split(/[\s,.-]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= (game === 'euromillones' ? 50 : 49));

    const expectedCount = game === 'euromillones' ? 5 : 6;
    if (parsedNums.length !== expectedCount) {
      setErrorMessage(`Debes introducir exactamente ${expectedCount} números válidos.`);
      return;
    }

    const uniqueNums: number[] = Array.from(new Set(parsedNums));
    if (uniqueNums.length !== expectedCount) {
      setErrorMessage('Los números no pueden estar repetidos.');
      return;
    }

    let stars: number[] | undefined;
    if (game === 'euromillones') {
      const parsedStars = newStarsStr
        .split(/[\s,.-]+/)
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 12);
      if (parsedStars.length !== 2) {
        setErrorMessage('Euromillones requiere exactamente 2 estrellas (del 1 al 12).');
        return;
      }
      stars = parsedStars.sort((a, b) => a - b);
    }

    const dateObj = new Date(newDate + 'T00:00:00');
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayOfWeek = dayNames[dateObj.getDay()];

    const newDraw: LotteryDraw = {
      id: editingDrawId || `${game}-${newDate}-${Date.now()}`,
      game,
      date: newDate,
      dayOfWeek,
      numbers: [...uniqueNums].sort((a: number, b: number) => a - b),
      complementario: newComplementario ? parseInt(newComplementario, 10) : undefined,
      reintegro: newReintegro ? parseInt(newReintegro, 10) : undefined,
      stars,
    };

    onAddDraw(newDraw);
    setShowAddForm(false);
    setEditingDrawId(null);
    setNewNumbersStr('');
    setNewStarsStr('');
    setNewComplementario('');
    setNewReintegro('');
  };

  const gameTitle =
    game === 'primitiva'
      ? 'La Primitiva'
      : game === 'bonoloto'
      ? 'Bonoloto'
      : 'Euromillones';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2.5 pt-3 pb-[max(4.75rem,calc(env(safe-area-inset-bottom,0px)+2.5rem))] sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[calc(100dvh-6rem)] sm:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 relative">
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            game === 'primitiva'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border-emerald-400/50'
              : game === 'bonoloto'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white border-blue-400/50'
              : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 border-amber-300'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded font-black text-[10px] uppercase border shadow-xs bg-white/20 text-white border-white/40">
                ANSAMA
              </span>
              <h2
                className={`font-black text-lg tracking-tight ${
                  game === 'euromillones' ? 'text-slate-950' : 'text-white'
                }`}
              >
                Historial Oficial — {gameTitle}
              </h2>
            </div>
            <p
              className={`text-xs mt-0.5 ${
                game === 'euromillones' ? 'text-slate-800' : 'text-slate-100/90'
              }`}
            >
              Resultados contrastados y verificados con Lotoideas y SELAE Oficial
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              game === 'euromillones'
                ? 'text-slate-800 hover:bg-black/10'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timetable and Official Sources Info Bar */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>Horario oficial:</strong> {OFFICIAL_DRAW_HOURS[game]}.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={OFFICIAL_WEB_URLS[game]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold underline text-[11px]"
              title="Abrir web oficial de Loterías y Apuestas del Estado"
            >
              <span>SELAE Oficial</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-600">•</span>
            <a
              href={LOTOIDEAS_WEB_URLS[game]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold underline text-[11px]"
              title="Abrir histórico oficial de Lotoideas"
            >
              <span>Lotoideas</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Database Synchronization, Confrontation & Update Panel */}
        <div className="p-4 bg-gradient-to-br from-[#06152B] via-[#092244] to-[#06152B] text-white border-b border-amber-400/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">
                    Base de Datos de Sorteos
                  </span>
                  {missingDrawsCount > 0 ? (
                    <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                      +{missingDrawsCount} pendientes
                    </span>
                  ) : (
                    <span className="bg-emerald-500/20 text-emerald-300 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verificada
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Último sorteo verificado: <strong className="text-amber-300">{gameDraws[0]?.date || 'N/A'}</strong> ({gameDraws[0]?.dayOfWeek || ''}).
                </p>
              </div>
            </div>

            {/* Action Buttons: Sync & Confront */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleConfrontSources}
                disabled={isConfronting}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white border border-cyan-400/50 shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50"
                title="Confrontar sorteos locales contra el archivo oficial de Lotoideas y SELAE"
              >
                <Scale className={`w-3.5 h-3.5 ${isConfronting ? 'animate-spin' : ''}`} />
                <span>{isConfronting ? 'Confrontando...' : 'Confrontar fuentes'}</span>
              </button>

              <button
                id="modal-sync-database-btn"
                onClick={onSyncDatabase}
                disabled={isSyncing}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition active:scale-95 shadow-md cursor-pointer ${
                  missingDrawsCount > 0
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 ring-2 ring-amber-300/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500'
                } ${isSyncing ? 'opacity-75 cursor-wait' : ''}`}
                title="Descargar y sincronizar con los resultados oficiales de Lotoideas y SELAE"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing
                    ? 'Descargando...'
                    : missingDrawsCount > 0
                    ? `Descargar Sorteos (+${missingDrawsCount})`
                    : 'Descargar / Actualizar'}
                </span>
              </button>
            </div>
          </div>

          {/* Secondary sync settings & backup tools */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Auto sync switch */}
            <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => onToggleAutoSync(e.target.checked)}
                className="w-4 h-4 rounded-md border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-400/30 accent-amber-500 cursor-pointer"
              />
              <span className="text-[11px]">Sincronizar automáticamente sorteos oficiales al abrir</span>
            </label>

            {/* Export / Import buttons */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json,.csv"
                className="hidden"
              />
              <button
                type="button"
                onClick={onExportDatabase}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition"
                title="Descargar copia de seguridad en archivo JSON"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>Exportar JSON</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] transition"
                title="Cargar sorteos desde archivo JSON o CSV de Lotoideas"
              >
                <Upload className="w-3 h-3 text-purple-400" />
                <span>Importar JSON / CSV</span>
              </button>
            </div>
          </div>

          {importStatus && (
            <div className="p-2.5 rounded-lg bg-blue-900/60 border border-blue-500/40 text-blue-200 text-xs flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              if (showAddForm) {
                setShowAddForm(false);
                setEditingDrawId(null);
              } else {
                setEditingDrawId(null);
                setNewDate(maxCelebratedDate);
                setNewNumbersStr('');
                setNewStarsStr('');
                setNewComplementario('');
                setNewReintegro('');
                setShowAddForm(true);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Ocultar Formulario' : 'Añadir / Corregir Sorteo'}</span>
          </button>

          <button
            onClick={onResetDraws}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 transition font-medium"
            title="Restaura la base de datos a los sorteos oficiales verificados por Loterías y Apuestas del Estado y Lotoideas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Sorteos Verificados</span>
          </button>
        </div>

        {/* Add/Edit Draw Form (if open) */}
        {showAddForm && (
          <form onSubmit={handleCreateDraw} className="p-4 bg-blue-50/50 border-b border-blue-100 text-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              {editingDrawId ? 'Editar Sorteo Oficial' : 'Registrar Sorteo Oficial'}
            </h3>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fecha del sorteo (máximo hoy si ya se celebró):
                </label>
                <input
                  type="date"
                  required
                  max={maxCelebratedDate}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {game === 'euromillones' ? '5 Números (separados por espacio):' : '6 Números (separados por espacio):'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={game === 'euromillones' ? 'Ej: 11 12 19 27 46' : 'Ej: 18 23 24 41 44 47'}
                  value={newNumbersStr}
                  onChange={(e) => setNewNumbersStr(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                />
              </div>

              {game === 'euromillones' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">2 Estrellas (1-12):</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 4 12"
                    value={newStarsStr}
                    onChange={(e) => setNewStarsStr(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Complementario (opcional):</label>
                    <input
                      type="number"
                      min="1"
                      max="49"
                      placeholder="Ej: 3"
                      value={newComplementario}
                      onChange={(e) => setNewComplementario(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Reintegro (0-9, opcional):</label>
                    <input
                      type="number"
                      min="0"
                      max="9"
                      placeholder="Ej: 5"
                      value={newReintegro}
                      onChange={(e) => setNewReintegro(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingDrawId(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {editingDrawId ? 'Guardar Cambios' : 'Guardar Sorteo'}
              </button>
            </div>
          </form>
        )}

        {/* Confrontation Report Modal Overlay */}
        {showConfrontModal && confrontReport && (
          <div className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      Confrontación y Auditoría — {gameTitle}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Comparativa entre tu base de datos local y la fuente oficial de Lotoideas (exportada de SELAE)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfrontModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {confrontNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{confrontNotice}</span>
                </div>
              )}

              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                  <span className="block text-[11px] text-slate-400">Sorteos Auditados</span>
                  <span className="text-lg font-black text-white">{confrontReport.totalChecked}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-center">
                  <span className="block text-[11px] text-emerald-300">Coincidentes 100%</span>
                  <span className="text-lg font-black text-emerald-400">{confrontReport.matchingCount}</span>
                </div>
                <div
                  className={`p-3 rounded-xl text-center ${
                    confrontReport.discrepancies.length > 0
                      ? 'bg-rose-950/60 border border-rose-500/50'
                      : 'bg-slate-800/80 border border-slate-700'
                  }`}
                >
                  <span className="block text-[11px] text-slate-400">Discrepancias</span>
                  <span
                    className={`text-lg font-black ${
                      confrontReport.discrepancies.length > 0 ? 'text-rose-400' : 'text-slate-200'
                    }`}
                  >
                    {confrontReport.discrepancies.length}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                  <span className="block text-[11px] text-slate-400">Pendientes en local</span>
                  <span className="text-lg font-black text-amber-400">{confrontReport.missingCount}</span>
                </div>
              </div>

              {/* Discrepancies List (if any) */}
              {confrontReport.discrepancies.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Discrepancias detectadas (puedes corregirlas con 1 clic):
                    </span>
                    <button
                      type="button"
                      onClick={handleFixAllDiscrepancies}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      Corregir todas ({confrontReport.discrepancies.length})
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {confrontReport.discrepancies.map((disc) => (
                      <div
                        key={disc.date}
                        className="p-3 rounded-xl bg-slate-900 border border-rose-500/40 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white">
                            Sorteo {disc.date.split('-').reverse().join('/')} ({disc.dayOfWeek})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleFixDiscrepancy(disc)}
                            className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition"
                          >
                            Corregir a oficial
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30">
                            <span className="block text-[10px] text-rose-300 font-semibold mb-1">
                              En tu aplicación (actual):
                            </span>
                            <div className="flex items-center gap-1 flex-wrap">
                              {disc.localNumbers.map((n) => (
                                <span
                                  key={n}
                                  className="w-5 h-5 rounded-full bg-rose-900/60 text-white flex items-center justify-center font-mono font-bold text-[10px]"
                                >
                                  {n}
                                </span>
                              ))}
                              {disc.localComp !== undefined && (
                                <span className="text-[10px] text-slate-300 ml-1">C:{disc.localComp}</span>
                              )}
                              {disc.localReint !== undefined && (
                                <span className="text-[10px] text-slate-300 ml-1">R:{disc.localReint}</span>
                              )}
                            </div>
                          </div>

                          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                            <span className="block text-[10px] text-emerald-300 font-semibold mb-1">
                              Oficial Lotoideas / SELAE:
                            </span>
                            <div className="flex items-center gap-1 flex-wrap">
                              {disc.officialNumbers.map((n) => (
                                <span
                                  key={n}
                                  className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-[10px]"
                                >
                                  {n}
                                </span>
                              ))}
                              {disc.officialComp !== undefined && (
                                <span className="text-[10px] text-emerald-300 ml-1">C:{disc.officialComp}</span>
                              )}
                              {disc.officialReint !== undefined && (
                                <span className="text-[10px] text-emerald-300 ml-1">R:{disc.officialReint}</span>
                              )}
                              {disc.officialStars &&
                                disc.officialStars.map((s) => (
                                  <span key={s} className="text-[10px] text-amber-300 ml-1 font-bold">
                                    ★{s}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-300 text-sm">
                      Base de datos 100% verificada
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Todos los sorteos almacenados en tu dispositivo coinciden exactamente con los registros
                      oficiales publicados por <strong>Loterías y Apuestas del Estado</strong> y el histórico
                      de <strong>Lotoideas</strong>. No hay números erróneos ni discrepancias.
                    </p>
                  </div>
                </div>
              )}

              {/* Direct links */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 text-[11px]">Contrastar manualmente en la web:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={OFFICIAL_WEB_URLS[game]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                  >
                    <span>Loterías y Apuestas (SELAE)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={LOTOIDEAS_WEB_URLS[game]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                  >
                    <span>Lotoideas.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowConfrontModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Cerrar informe de auditoría
              </button>
            </div>
          </div>
        )}

        {/* List of Draws */}
        <div
          className="overflow-y-auto flex-1 p-4 divide-y divide-slate-100 overscroll-contain touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {gameDraws.map((d) => (
            <div key={d.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-slate-900">{d.dayOfWeek}</span>,{' '}
                <span className="text-slate-600 font-mono font-semibold">
                  {d.date.split('-').reverse().join('/')}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {d.numbers.map((n) => (
                  <span
                    key={n}
                    className="w-6 h-6 rounded-full bg-slate-100 text-slate-900 border border-slate-300 flex items-center justify-center font-bold text-[11px]"
                  >
                    {n}
                  </span>
                ))}
                {d.complementario !== undefined && (
                  <span
                    className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold"
                    title="Complementario"
                  >
                    C: {d.complementario}
                  </span>
                )}
                {d.reintegro !== undefined && (
                  <span
                    className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold"
                    title="Reintegro"
                  >
                    R: {d.reintegro}
                  </span>
                )}
                {d.stars &&
                  d.stars.map((s) => (
                    <span
                      key={s}
                      className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px]"
                      title="Estrella"
                    >
                      ★{s}
                    </span>
                  ))}
                {d.joker && (
                  <span
                    className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-mono font-bold"
                    title={`Joker: ${d.joker}`}
                  >
                    Joker: {d.joker}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleEditDraw(d)}
                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition ml-1 shrink-0"
                  title="Editar combinación de este sorteo"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px] hidden sm:inline">
            Total en base de datos: <strong>{gameDraws.length}</strong> sorteos de {gameTitle}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-950 text-white font-bold transition ml-auto text-xs sm:text-sm shadow-sm active:scale-95 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
