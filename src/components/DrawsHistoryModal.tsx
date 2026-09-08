import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { parseAndValidateDraws, OFFICIAL_DRAW_HOURS } from '../utils/syncDatabase';
import { getMaxCelebratedDateForGame } from '../data/historicalDraws';

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

const OFFICIAL_GAME_URLS: Record<GameType, string> = {
  primitiva: 'https://www.loteriasyapuestas.es/es/resultados/la-primitiva',
  bonoloto: 'https://www.loteriasyapuestas.es/es/resultados/bonoloto',
  euromillones: 'https://www.loteriasyapuestas.es/es/resultados/euromillones',
};

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
  const [newDate, setNewDate] = useState(maxCelebratedDate);
  const [newNumbersStr, setNewNumbersStr] = useState('');
  const [newComplementario, setNewComplementario] = useState('');
  const [newReintegro, setNewReintegro] = useState('');
  const [newStarsStr, setNewStarsStr] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseAndValidateDraws(content);
      if (res.valid && res.draws) {
        onImportDatabase(res.draws);
        setImportStatus(`¡Éxito! Se importaron ${res.draws.length} sorteos correctamente.`);
        setTimeout(() => setImportStatus(null), 4000);
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

  const handleCreateDraw = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newDate > maxCelebratedDate) {
      setErrorMessage(`No se puede registrar un sorteo con fecha posterior al último celebrado (${maxCelebratedDate}). El sorteo de hoy se celebra por la noche.`);
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
      id: `${game}-${newDate}-${Date.now()}`,
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
    setNewNumbersStr('');
    setNewStarsStr('');
    setNewComplementario('');
    setNewReintegro('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
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
                className={`text-base sm:text-lg font-black tracking-tight flex items-center gap-2 ${
                  game === 'euromillones' ? 'text-slate-950' : 'text-white'
                }`}
              >
                <span>Historial de Sorteos Oficiales</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-black uppercase bg-white/20 text-white border border-white/30">
                  {game}
                </span>
              </h2>
            </div>
            <p
              className={`text-xs mt-0.5 ${
                game === 'primitiva'
                  ? 'text-emerald-100'
                  : game === 'bonoloto'
                  ? 'text-blue-100'
                  : 'text-amber-950/85 font-medium'
              }`}
            >
              {gameDraws.length} sorteos verificados de Loterías y Apuestas del Estado
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition ${
              game === 'euromillones'
                ? 'text-slate-950 hover:bg-slate-950/15'
                : 'text-white/80 hover:text-white hover:bg-white/15'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info banner about schedules */}
        <div className="bg-slate-900 text-slate-200 px-4 py-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Horario oficial:</strong> {OFFICIAL_DRAW_HOURS[game]}. Los sorteos de hoy no se incorporan hasta celebrarse por la noche.
            </span>
          </div>
          <a
            href={OFFICIAL_GAME_URLS[game] || 'https://www.loteriasyapuestas.es'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-semibold underline shrink-0 text-[11px]"
          >
            <span>Ver resultados oficiales</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Database Synchronization & Update Panel */}
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
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Al día
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Último sorteo verificado: <strong className="text-amber-300">{gameDraws[0]?.date || 'N/A'}</strong> ({gameDraws[0]?.dayOfWeek || ''}).
                </p>
              </div>
            </div>

            {/* Main Update Button */}
            <button
              id="modal-sync-database-btn"
              onClick={onSyncDatabase}
              disabled={isSyncing}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition active:scale-95 shadow-md shrink-0 ${
                missingDrawsCount > 0
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 ring-2 ring-amber-300/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              } ${isSyncing ? 'opacity-75 cursor-wait' : ''}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing
                  ? 'Verificando...'
                  : missingDrawsCount > 0
                  ? `Sincronizar Oficiales (+${missingDrawsCount})`
                  : 'Verificar Base de Datos'}
              </span>
            </button>
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
              <span className="text-[11px]">Verificar sorteos automáticamente al abrir la aplicación</span>
            </label>

            {/* Export / Import buttons */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
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
                title="Cargar sorteos desde archivo JSON"
              >
                <Upload className="w-3 h-3 text-purple-400" />
                <span>Importar JSON</span>
              </button>
            </div>
          </div>

          {importStatus && (
            <div className="p-2 rounded-lg bg-blue-900/60 border border-blue-500/40 text-blue-200 text-xs">
              {importStatus}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setNewDate(maxCelebratedDate);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Ocultar Formulario' : 'Añadir Sorteo Oficial'}</span>
          </button>

          <button
            onClick={onResetDraws}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 transition font-medium"
            title="Restaura la base de datos a los sorteos oficiales verificados por Loterías y Apuestas del Estado"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Sorteos Oficiales Verificados</span>
          </button>
        </div>

        {/* Add Draw Form (if open) */}
        {showAddForm && (
          <form onSubmit={handleCreateDraw} className="p-4 bg-blue-50/50 border-b border-blue-100 text-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1">
              <Calendar className="w-4 h-4 text-blue-600" /> Registrar Sorteo Oficial
            </h3>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fecha del sorteo (máximo hoy si ya se celebró):</label>
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
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Reintegro (0-9):</label>
                    <input
                      type="number"
                      min="0"
                      max="9"
                      placeholder="Ej: 2"
                      value={newReintegro}
                      onChange={(e) => setNewReintegro(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700"
              >
                Guardar Sorteo
              </button>
            </div>
          </form>
        )}

        {/* List of Draws */}
        <div className="overflow-y-auto flex-1 p-4 divide-y divide-slate-100">
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
                {d.stars && d.stars.map((s) => (
                  <span
                    key={s}
                    className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px]"
                    title="Estrella"
                  >
                    ★{s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Total en base de datos: <strong>{gameDraws.length}</strong> sorteos de {game}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
