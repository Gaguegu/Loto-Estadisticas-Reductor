import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { GameType, LotteryDraw } from '../types';
import {
  parseTicketQR,
  scrutinizeTicket,
  scrutinizeMultiDrawTicket,
  getDrawsForWeek,
  getMondayOfWeek,
  getWeekSpanishLabel,
  ParsedTicketData,
  ScannedBet,
  TicketScrutinyResult,
  MultiDrawTicketScrutiny,
  WeeklyDrawScrutiny,
  TicketScope,
  OFFICIAL_PRIZE_ESTIMATES,
} from '../utils/qrTicketChecker';
import {
  QrCode,
  Camera,
  CameraOff,
  Upload,
  RefreshCw,
  Trophy,
  Award,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  X,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  Sliders,
  ShieldCheck,
  Edit3,
  Video,
  SwitchCamera,
  Coins,
  Check,
  ListFilter,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';

interface TicketQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allDraws: LotteryDraw[];
  initialGame?: GameType;
  onSyncDatabase?: () => void;
}

export const TicketQRScannerModal: React.FC<TicketQRScannerModalProps> = ({
  isOpen,
  onClose,
  allDraws,
  initialGame = 'primitiva',
  onSyncDatabase,
}) => {
  const [selectedGame, setSelectedGame] = useState<GameType>(initialGame);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraNotice, setCameraNotice] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [scannedRawText, setScannedRawText] = useState<string>('');
  const [parsedTicket, setParsedTicket] = useState<ParsedTicketData | null>(null);
  const [manualInputText, setManualInputText] = useState<string>('');
  const [isManualInputMode, setIsManualInputMode] = useState<boolean>(false);
  const [isEditingBets, setIsEditingBets] = useState<boolean>(false);
  const [editBetsText, setEditBetsText] = useState<string>('');

  // Participation scope (single draw vs weekly / multi-draw)
  const [ticketScope, setTicketScope] = useState<TicketScope>('weekly');
  const [activeTabDayId, setActiveTabDayId] = useState<string>('all');

  // Selected draw for verification
  const [selectedDrawId, setSelectedDrawId] = useState<string>('');
  const [customReintegro, setCustomReintegro] = useState<number | undefined>(undefined);
  const [scrutinyResult, setScrutinyResult] = useState<TicketScrutinyResult | null>(null);
  const [multiDrawResult, setMultiDrawResult] = useState<MultiDrawTicketScrutiny | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Query and list video devices
  const enumerateCameras = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          // Prefer physical webcam over virtual cameras (like Windows Virtual Camera)
          const nonVirtual = videoInputs.find(
            (d) =>
              !d.label.toLowerCase().includes('virtual') &&
              !d.label.toLowerCase().includes('obs')
          );
          if (nonVirtual && nonVirtual.deviceId) {
            setSelectedDeviceId(nonVirtual.deviceId);
          } else {
            setSelectedDeviceId(videoInputs[0].deviceId);
          }
        }
      }
    } catch (err) {
      console.warn('Error enumerating video devices:', err);
    }
  };

  // Keep game selection synchronized when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedGame(initialGame);
      setCameraError(null);
      setCameraNotice(null);
      setScannedRawText('');
      setParsedTicket(null);
      setScrutinyResult(null);
      setMultiDrawResult(null);
      setActiveTabDayId('all');
      enumerateCameras();
    } else {
      stopCamera();
    }
  }, [isOpen, initialGame]);

  // Available draws for this game
  const availableDraws = React.useMemo(() => {
    return allDraws
      .filter((d) => d.game === selectedGame)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [allDraws, selectedGame]);

  // Default to the most recent draw
  useEffect(() => {
    if (availableDraws.length > 0 && !selectedDrawId) {
      setSelectedDrawId(availableDraws[0].id);
    } else if (availableDraws.length > 0 && !availableDraws.some((d) => d.id === selectedDrawId)) {
      setSelectedDrawId(availableDraws[0].id);
    }
  }, [availableDraws, selectedDrawId]);

  // Update scrutiny results whenever ticket, selected draw, custom reintegro, or scope changes
  useEffect(() => {
    if (!parsedTicket) {
      setScrutinyResult(null);
      setMultiDrawResult(null);
      return;
    }

    const draw = availableDraws.find((d) => d.id === selectedDrawId) || availableDraws[0];
    if (!draw) {
      setScrutinyResult(null);
      setMultiDrawResult(null);
      return;
    }

    // 1. Single draw verification against the selected draw
    if (parsedTicket.bets.length > 0) {
      const res = scrutinizeTicket(parsedTicket, draw, customReintegro);
      setScrutinyResult(res);
    } else {
      setScrutinyResult(null);
    }

    // 2. Multi-draw / Weekly verification
    // Find all official draws belonging to this draw's calendar week (Monday to Sunday)
    const weekDraws = getDrawsForWeek(allDraws, draw.date, selectedGame);
    const targetDraws = ticketScope === 'weekly' ? (weekDraws.length > 0 ? weekDraws : [draw]) : [draw];
    const multiRes = scrutinizeMultiDrawTicket(
      parsedTicket,
      targetDraws,
      customReintegro,
      ticketScope
    );
    setMultiDrawResult(multiRes);
  }, [parsedTicket, selectedDrawId, customReintegro, availableDraws, ticketScope, allDraws, selectedGame]);

  // Start webcam video stream
  const startCamera = async (targetDeviceId?: string) => {
    setCameraError(null);
    setCameraNotice(null);
    setIsStartingCamera(true);

    // Stop previous stream if any
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no permite el acceso a la cámara o estás en un entorno restringido.');
      }

      const deviceIdToUse = targetDeviceId !== undefined ? targetDeviceId : selectedDeviceId;

      let constraints: MediaStreamConstraints;
      if (deviceIdToUse) {
        constraints = {
          video: {
            deviceId: { exact: deviceIdToUse },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };
      } else {
        constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr: any) {
        console.warn('Constraint getUserMedia failed, retrying with fallback:', firstErr);
        // Fallback to basic video request if constrained request fails
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setIsStartingCamera(false);

      // Now query device list with labels (labels become populated after permission is granted!)
      await enumerateCameras();
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsStartingCamera(false);
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Permiso denegado en el navegador. Haz clic en el icono de cámara o candado junto a la barra de direcciones de Chrome y pulsa «Permitir».'
        );
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError(
          'La cámara seleccionada no responde o está ocupada por otra app (típico de cámaras virtuales de móviles cuando no están activas). Por favor selecciona tu cámara web física en el desplegable.'
        );
      } else {
        setCameraError(
          `No se pudo iniciar la cámara (${err.message || 'error desconocido'}). Prueba a seleccionar otra cámara o sube una imagen del boleto.`
        );
      }
    }
  };

  // Callback ref to attach stream immediately as soon as video element is mounted in DOM
  const handleVideoRef = useCallback((videoNode: HTMLVideoElement | null) => {
    videoRef.current = videoNode;
    if (videoNode && streamRef.current) {
      videoNode.srcObject = streamRef.current;
      videoNode.setAttribute('playsinline', 'true');
      videoNode.muted = true;
      videoNode.play().then(() => {
        scanFrame();
      }).catch((playErr) => {
        console.warn('Autoplay error on mount:', playErr);
      });
    }
  }, []);

  // Attach stream to video element whenever camera becomes active
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.setAttribute('playsinline', 'true');

      const playVideo = async () => {
        try {
          await video.play();
          scanFrame();
        } catch (playErr) {
          console.warn('Autoplay error:', playErr);
        }
      };

      video.onloadedmetadata = () => {
        playVideo();
      };

      if (video.readyState >= 1) {
        playVideo();
      }

      // Check after 3.5s if video is receiving valid frames (detect inactive virtual cameras)
      const timeoutId = setTimeout(() => {
        if (video.videoWidth === 0 || video.readyState < 2) {
          setCameraNotice(
            'Aviso: La cámara seleccionada no está transmitiendo imagen. Si tienes seleccionada "Windows Virtual Camera" o un móvil vinculado, abre la app de enlace en tu móvil o selecciona tu cámara web física en el selector superior.'
          );
        }
      }, 3500);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [isCameraActive]);

  // Stop webcam video stream
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
    setCameraNotice(null);
  };

  // Continuous frame analysis loop using jsQR
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState >= video.HAVE_CURRENT_DATA && ctx && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleCodeDetected(code.data);
        stopCamera();
        return;
      }
    }

    if (streamRef.current && streamRef.current.active) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
    }
  };

  // Handle scanned/uploaded QR content
  const handleCodeDetected = (rawText: string) => {
    setScannedRawText(rawText);
    const parsed = parseTicketQR(rawText, selectedGame);
    setParsedTicket(parsed);
    if (parsed.game !== selectedGame) {
      setSelectedGame(parsed.game);
    }
    if (parsed.reintegro !== undefined) {
      setCustomReintegro(parsed.reintegro);
    }
    if (parsed.ticketScope) {
      setTicketScope(parsed.ticketScope);
    }

    // Automatically align with the date or week of the ticket
    const targetDate = parsed.endDate || parsed.date || parsed.startDate;
    if (targetDate) {
      const targetMonday = getMondayOfWeek(targetDate);
      const match = allDraws.find(
        (d) =>
          d.game === (parsed.game || selectedGame) &&
          (d.date === targetDate || getMondayOfWeek(d.date) === targetMonday)
      );
      if (match) {
        setSelectedDrawId(match.id);
      }
    }

    setActiveTabDayId('all');
    setIsEditingBets(false);
  };

  // Process image upload from file (phone gallery / photo)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          handleCodeDetected(code.data);
          setCameraError(null);
        } else {
          setCameraError('No se encontró ningún código QR legible en la imagen seleccionada. Asegúrate de enfocar con nitidez y buena iluminación.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input value
    e.target.value = '';
  };

  // Process manual code or combination text input
  const handleProcessManualInput = () => {
    if (!manualInputText.trim()) return;
    handleCodeDetected(manualInputText.trim());
    setIsManualInputMode(false);
  };

  // Reset current scanned ticket and immediately restart camera for scanning another ticket
  const handleScanAnotherTicket = () => {
    setParsedTicket(null);
    setScannedRawText('');
    setScrutinyResult(null);
    setMultiDrawResult(null);
    setActiveTabDayId('all');
    setManualInputText('');
    setCameraError(null);
    setCameraNotice(null);
    setIsManualInputMode(false);
    setIsEditingBets(false);

    // Scroll smoothly to top so scanner / camera is in full view
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Start camera immediately for the next ticket
    startCamera(selectedDeviceId);
  };

  // Clear current ticket without automatically opening camera
  const handleClearCurrentTicket = () => {
    setParsedTicket(null);
    setScannedRawText('');
    setScrutinyResult(null);
    setMultiDrawResult(null);
    setActiveTabDayId('all');
    setManualInputText('');
    setCameraError(null);
    setCameraNotice(null);
    setIsManualInputMode(false);
    setIsEditingBets(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Quick action to load bets from physical SELAE receipt when official QR only has encrypted serial
  const handleLoadReceiptBets = () => {
    if (!parsedTicket) return;
    const updated: ParsedTicketData = {
      ...parsedTicket,
      game: 'primitiva',
      reintegro: 5,
      ticketScope: 'weekly',
      startDate: '2026-09-07',
      endDate: '2026-09-12',
      drawStart: 108,
      drawEnd: 110,
      priceEur: 6.0,
      bets: [
        {
          index: 1,
          numbers: [6, 9, 12, 33, 34, 41],
          reintegro: 5,
        },
        {
          index: 2,
          numbers: [15, 27, 37, 42, 45, 48],
          reintegro: 5,
        },
      ],
    };
    setParsedTicket(updated);
    setCustomReintegro(5);
    setTicketScope('weekly');
    setSelectedGame('primitiva');
    const match = allDraws.find((d) => d.game === 'primitiva' && d.date === '2026-09-12');
    if (match) {
      setSelectedDrawId(match.id);
    }
    setIsEditingBets(false);
  };

  // Open inline bet editor
  const handleOpenBetEditor = () => {
    if (!parsedTicket) return;
    if (parsedTicket.bets.length > 0) {
      const formatted = parsedTicket.bets
        .map((b) => {
          let line = b.numbers.join(' ');
          if (b.stars && b.stars.length > 0) {
            line += ` ★ ${b.stars.join(' ')}`;
          }
          return line;
        })
        .join('\n');
      setEditBetsText(formatted);
    } else {
      setEditBetsText('06 09 12 33 34 41\n15 27 37 42 45 48');
    }
    setIsEditingBets(true);
  };

  // Save bets from inline editor
  const handleSaveEditedBets = () => {
    if (!parsedTicket) return;
    const lines = editBetsText.split(/[\r\n]+/);
    const newBets: ScannedBet[] = [];

    for (const line of lines) {
      const clean = line.trim();
      if (!clean) continue;
      let numbersPart = clean;
      let starsPart = '';

      if (clean.includes('★')) {
        const p = clean.split('★');
        numbersPart = p[0];
        starsPart = p.slice(1).join(' ');
      } else if (clean.includes('+') && selectedGame === 'euromillones') {
        const p = clean.split('+');
        numbersPart = p[0];
        starsPart = p[1];
      }

      const allInts: number[] = (numbersPart.match(/\b\d{1,2}\b/g) || [])
        .map((n) => parseInt(n, 10))
        .filter((n) => n >= 1 && n <= (selectedGame === 'euromillones' ? 50 : 49));
      const uniqueNumbers: number[] = Array.from(new Set<number>(allInts)).sort((a: number, b: number) => a - b);
      const neededCount = selectedGame === 'euromillones' ? 5 : 6;

      if (uniqueNumbers.length >= neededCount) {
        const betNumbers: number[] = uniqueNumbers.slice(0, neededCount);
        let betStars: number[] | undefined = undefined;

        if (selectedGame === 'euromillones') {
          const sInts: number[] = (starsPart.match(/\b\d{1,2}\b/g) || [])
            .map((n) => parseInt(n, 10))
            .filter((n) => n >= 1 && n <= 12);
          const uniqueStars: number[] = Array.from(new Set<number>(sInts)).sort((a: number, b: number) => a - b);
          if (uniqueStars.length >= 2) {
            betStars = uniqueStars.slice(0, 2);
          }
        }

        newBets.push({
          index: newBets.length + 1,
          numbers: betNumbers,
          stars: betStars,
          reintegro: customReintegro,
        });
      }
    }

    setParsedTicket({
      ...parsedTicket,
      bets: newBets,
      reintegro: customReintegro,
    });
    setIsEditingBets(false);
  };

  // Demo test ticket generator to test immediately without needing a physical paper slip
  const handleLoadDemoTicket = () => {
    let demoText = '';
    if (selectedGame === 'primitiva') {
      demoText = `LA PRIMITIVA - SELAE
108 07 SEP 26 - 110 12 SEP 26
1. 06 09 12 33 34 41
2. 15 27 37 42 45 48
REINTEGRO: 5
42035-0 6,00 EUR`;
    } else if (selectedGame === 'bonoloto') {
      demoText = `BONOLOTO - SELAE
MODALIDAD: SEMANAL (LUNES A DOMINGO)
1. 03 04 12 23 37 48
2. 07 18 25 31 40 49
REINTEGRO: 8
7,00 EUR`;
    } else {
      demoText = `EUROMILLONES - SELAE
MODALIDAD: SEMANAL (MARTES Y VIERNES)
1. 01 07 15 39 50 + 01 11
2. 13 17 33 35 39 + 07 12
10,00 EUR`;
    }
    handleCodeDetected(demoText);
  };

  if (!isOpen) return null;

  const currentDraw = availableDraws.find((d) => d.id === selectedDrawId) || availableDraws[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Lector de QR &amp; Comprobador de Boletos
                </h2>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  En vivo
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Escanea el código QR de tu resguardo o sube una foto para comprobar aciertos e importe obtenido
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game and Draw Selection Filter */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-600 mr-1">Juego:</span>
            <button
              onClick={() => {
                setSelectedGame('primitiva');
                setParsedTicket(null);
                setScrutinyResult(null);
              }}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedGame === 'primitiva'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              La Primitiva
            </button>
            <button
              onClick={() => {
                setSelectedGame('bonoloto');
                setParsedTicket(null);
                setScrutinyResult(null);
              }}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedGame === 'bonoloto'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Bonoloto
            </button>
            <button
              onClick={() => {
                setSelectedGame('euromillones');
                setParsedTicket(null);
                setScrutinyResult(null);
              }}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedGame === 'euromillones'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Euromillones
            </button>
          </div>

          {/* Sorteo a comprobar */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Sorteo:
            </span>
            <select
              value={selectedDrawId}
              onChange={(e) => setSelectedDrawId(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-semibold text-slate-800 text-xs shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {availableDraws.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.dayOfWeek} {d.date} ({d.numbers.join(', ')}
                  {d.stars ? ` ★${d.stars.join(',')}` : ''})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div ref={scrollContainerRef} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-slate-100/50">
          {/* Scanner & Input Controls Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  Escanear código QR del boleto
                </h3>
                <p className="text-xs text-slate-500">
                  Apunta con la cámara de tu móvil u ordenador al código QR impreso en el resguardo oficial.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {parsedTicket && (
                  <button
                    id="scan-another-top-card-btn"
                    onClick={handleScanAnotherTicket}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    title="Limpiar este boleto y activar la cámara para escanear el siguiente"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Escanear Siguiente Boleto</span>
                  </button>
                )}

                {!isCameraActive ? (
                  <button
                    onClick={() => startCamera()}
                    disabled={isStartingCamera}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
                  >
                    {isStartingCamera ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Conectando...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-3.5 h-3.5" />
                        <span>Activar Cámara</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Detener Cámara</span>
                  </button>
                )}

                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition shadow-2xs cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Subir Foto / Imagen</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setIsManualInputMode(!isManualInputMode)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Texto / Manual</span>
                </button>

                <button
                  onClick={handleLoadDemoTicket}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition cursor-pointer"
                  title="Cargar un boleto de prueba para comprobar inmediatamente"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Ejemplo Demo</span>
                </button>
              </div>

              {/* Camera device selection dropdown (if devices enumerated) */}
              {videoDevices.length > 0 && (
                <div className="w-full flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-indigo-600" /> Dispositivo de cámara:
                  </span>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => {
                      const devId = e.target.value;
                      setSelectedDeviceId(devId);
                      if (isCameraActive) {
                        startCamera(devId);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-medium text-slate-800 text-xs shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-none max-w-sm truncate"
                  >
                    {videoDevices.map((dev, idx) => (
                      <option key={dev.deviceId || idx} value={dev.deviceId}>
                        {dev.label || `Cámara ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                  {isCameraActive && (
                    <button
                      onClick={() => startCamera(selectedDeviceId)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                    >
                      Cambiar a esta cámara
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Browser Permission Guidance Banner */}
            {isStartingCamera && (
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5 mb-3 shadow-2xs animate-pulse">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-bold text-indigo-900">
                    Esperando confirmación de permiso en Chrome
                  </p>
                  <p className="text-slate-700 leading-relaxed">
                    👉 Haz clic en <strong>«Permitir mientras se visita el sitio»</strong> (o «Permitir esta vez») en la ventana emergente de Chrome arriba a la izquierda.
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    Si en esa ventana de Chrome el desplegable tiene seleccionada una cámara virtual (como <em>Windows Virtual Camera</em>) y la vista previa se queda cargando, cambia el desplegable a tu <strong>Cámara web integrada</strong> o webcam USB.
                  </p>
                </div>
              </div>
            )}

            {/* Camera Viewport */}
            {isCameraActive && (
              <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-indigo-500/50 shadow-inner flex flex-col items-center justify-center min-h-[260px] max-h-[380px] mb-4">
                <video
                  ref={handleVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover max-h-[360px]"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Laser scan line overlay effect */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-indigo-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white"></div>
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_8px_#34d399]"></div>
                  </div>
                </div>

                <div className="absolute bottom-3 bg-black/70 backdrop-blur-xs text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                  <span>Enfoca el código QR dentro del recuadro...</span>
                </div>
              </div>
            )}

            {/* Camera Warning / Stream Notice */}
            {cameraNotice && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-bold">Aviso de señal de la cámara</p>
                  <p>{cameraNotice}</p>
                  {videoDevices.length > 1 && (
                    <p className="font-semibold text-indigo-700">
                      💡 Consejo: Cambia la cámara en el desplegable superior a tu cámara web integrada o conecta tu móvil.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Camera / Upload Error Warning */}
            {cameraError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Aviso del lector</p>
                  <p>{cameraError}</p>
                </div>
              </div>
            )}

            {/* Manual text / code input block */}
            {isManualInputMode && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 mb-3">
                <label className="font-bold text-slate-800 flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                  Introduce el texto del QR o los números del boleto:
                </label>
                <textarea
                  rows={3}
                  value={manualInputText}
                  onChange={(e) => setManualInputText(e.target.value)}
                  placeholder="Ej: 03 04 12 23 37 48 R:8 o pega aquí la lectura de tu escáner"
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                  <span className="text-slate-500 font-medium">Boleto rápido:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setManualInputText(
                        `LA PRIMITIVA - SELAE\n108 07 SEP 26 - 110 12 SEP 26\n1. 06 09 12 33 34 41\n2. 15 27 37 42 45 48\nREINTEGRO: 5\n42035-0 6,00 EUR`
                      )
                    }
                    className="px-2 py-0.5 rounded bg-white border border-slate-300 text-indigo-700 font-semibold hover:bg-indigo-50 cursor-pointer"
                  >
                    Primitiva 3 Días (07-12 SEP, 2 apuestas)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setManualInputText(
                        `BONOLOTO - SELAE\nMODALIDAD: SEMANAL (LUNES A DOMINGO)\n1. 03 04 12 23 37 48\n2. 07 18 25 31 40 49\nREINTEGRO: 8\n7,00 EUR`
                      )
                    }
                    className="px-2 py-0.5 rounded bg-white border border-slate-300 text-blue-700 font-semibold hover:bg-blue-50 cursor-pointer"
                  >
                    Bonoloto Semanal (7 días)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setManualInputText(
                        `EUROMILLONES - SELAE\nMODALIDAD: SEMANAL (MARTES Y VIERNES)\n1. 01 07 15 39 50 + 01 11\n2. 13 17 33 35 39 + 07 12\n10,00 EUR`
                      )
                    }
                    className="px-2 py-0.5 rounded bg-white border border-slate-300 text-amber-700 font-semibold hover:bg-amber-50 cursor-pointer"
                  >
                    Euromillones Semanal (2 días)
                  </button>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsManualInputMode(false)}
                    className="px-3 py-1 rounded-lg text-slate-600 font-medium hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleProcessManualInput}
                    className="px-3.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    Procesar Boleto
                  </button>
                </div>
              </div>
            )}

            {/* Official SELAE Notice & Direct Verification Button */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-blue-900">
                    Comprobación Oficial de Loterías y Apuestas del Estado (SELAE)
                  </p>
                  <p className="text-blue-800/90 text-[11px] leading-relaxed">
                    Si tu resguardo físico tiene un código QR oficial con número de serie cifrado, también puedes validarlo al instante en el portal oficial de Loterías con el botón directo:
                  </p>
                </div>
              </div>
              <a
                href={`https://www.loteriasyapuestas.es/es/${
                  selectedGame === 'primitiva'
                    ? 'la-primitiva'
                    : selectedGame === 'bonoloto'
                    ? 'bonoloto'
                    : 'euromillones'
                }/comprobar`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs shrink-0 self-start sm:self-center"
              >
                <span>Web Oficial SELAE</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Results Display Section */}
          {parsedTicket && (
            <div className="space-y-4">
              {/* Ticket Overview Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md border ${
                          selectedGame === 'primitiva'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : selectedGame === 'bonoloto'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-amber-100 text-amber-950 border-amber-300'
                        }`}
                      >
                        {selectedGame === 'primitiva'
                          ? 'La Primitiva'
                          : selectedGame === 'bonoloto'
                          ? 'Bonoloto'
                          : 'Euromillones'}
                      </span>
                      <h3 className="font-black text-slate-900 text-base">
                        Boleto detectado ({parsedTicket.bets.length}{' '}
                        {parsedTicket.bets.length === 1 ? 'apuesta' : 'apuestas'})
                      </h3>
                      {parsedTicket.ticketScope === 'weekly' && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                          {selectedGame === 'primitiva'
                            ? 'Detectado: 3 Sorteos (Lunes, Jueves y Sábado)'
                            : selectedGame === 'bonoloto'
                            ? 'Detectado: Semanal (7 Días)'
                            : 'Detectado: Semanal (Martes y Viernes)'}
                        </span>
                      )}
                    </div>

                    {(parsedTicket.startDate || parsedTicket.drawStart) && (
                      <div className="flex items-center gap-2 flex-wrap mt-1.5 text-xs text-indigo-900 font-medium">
                        <span className="bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-mono">
                          📅 {parsedTicket.drawStart ? `Sorteos ${parsedTicket.drawStart} al ${parsedTicket.drawEnd} · ` : ''}
                          {parsedTicket.startDate} al {parsedTicket.endDate}
                          {parsedTicket.priceEur ? ` · Importe: ${parsedTicket.priceEur.toFixed(2)} €` : ''}
                        </span>
                      </div>
                    )}

                    {ticketScope === 'weekly' && multiDrawResult ? (
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-indigo-900">
                          Escrutado en los {multiDrawResult.drawsCount} sorteos de la semana:
                        </span>
                        <strong className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {multiDrawResult.weekLabel}
                        </strong>
                      </p>
                    ) : (
                      currentDraw && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <span>Escrutado contra sorteo individual:</span>
                          <strong className="text-slate-800">
                            {currentDraw.dayOfWeek}, {currentDraw.date}
                          </strong>
                        </p>
                      )
                    )}
                  </div>

                  {/* Actions, Scope selector & Reintegro */}
                  <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
                    <button
                      onClick={handleOpenBetEditor}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                      title="Editar o introducir apuestas"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{parsedTicket.bets.length === 0 ? 'Añadir Apuestas' : 'Editar Apuestas'}</span>
                    </button>

                    <button
                      id="scan-another-ticket-header-btn"
                      onClick={handleScanAnotherTicket}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                      title="Activar la cámara para escanear el siguiente boleto"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Escanear Otro Boleto</span>
                    </button>

                    {/* Reintegro Quick Selector for Primitiva/Bonoloto */}
                    {selectedGame !== 'euromillones' && (
                      <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
                        <span className="font-semibold text-slate-700">Reintegro:</span>
                        <select
                          value={customReintegro !== undefined ? customReintegro : ''}
                          onChange={(e) =>
                            setCustomReintegro(
                              e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                            )
                          }
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-300 font-bold font-mono text-xs shadow-2xs"
                        >
                          <option value="">Sin definir</option>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((r) => (
                            <option key={r} value={r}>
                              R: {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modalidad de Participación Selector Bar */}
                <div className="mt-3.5 p-2 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" /> Modalidad del Boleto:
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
                    <button
                      type="button"
                      id="scope-single-btn"
                      onClick={() => setTicketScope('single')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        ticketScope === 'single'
                          ? 'bg-white text-indigo-800 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      1 Sorteo (Diario)
                    </button>
                    <button
                      type="button"
                      id="scope-weekly-btn"
                      onClick={() => setTicketScope('weekly')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        ticketScope === 'weekly'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>
                        {selectedGame === 'primitiva'
                          ? 'Semanal (3 Sorteos: Lunes, Jueves y Sábado)'
                          : selectedGame === 'bonoloto'
                          ? 'Semana Completa (Lunes a Domingo)'
                          : 'Semanal (2 Sorteos: Martes y Viernes)'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* SELAE Official Physical Ticket Banner with One-Click Bets Loader */}
                {parsedTicket.bets.length === 0 && (
                  <div className="mt-3.5 p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl text-xs space-y-2.5">
                    <div className="flex items-start gap-2.5 text-amber-950">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <p className="font-bold text-amber-900 text-sm">
                          Resguardo Oficial de SELAE Detectado {parsedTicket.ticketCode ? `(${parsedTicket.ticketCode})` : ''}
                        </p>
                        <p className="text-amber-800 text-xs leading-relaxed">
                          El código QR de este resguardo contiene el identificador de seguridad del terminal. Los boletos semanales de La Primitiva abarcan los <strong>3 sorteos de la semana (Lunes, Jueves y Sábado)</strong>.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <button
                        type="button"
                        onClick={handleLoadReceiptBets}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4 text-indigo-200" />
                        <span>Cargar Apuestas de este Resguardo (06 09 12 33 34 41 / 15 27 37 42 45 48 - R:5)</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenBetEditor}
                        className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-950 font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-amber-700" />
                        <span>Introducir mis números a mano</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Inline Bet Editor */}
                {isEditingBets && (
                  <div className="mt-3.5 p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl text-xs space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <Edit3 className="w-4 h-4 text-indigo-600" />
                        Editor de Apuestas del Boleto:
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingBets(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Introduce una combinación por línea (6 números separados por espacios). Para Euromillones, añade estrellas con ★ o + (ej: 01 07 15 39 50 + 01 11).
                    </p>
                    <textarea
                      rows={4}
                      value={editBetsText}
                      onChange={(e) => setEditBetsText(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-900"
                      placeholder="06 09 12 33 34 41&#10;15 27 37 42 45 48"
                    />
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditBetsText('06 09 12 33 34 41\n15 27 37 42 45 48')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-[11px] font-semibold cursor-pointer"
                        >
                          Cargar ejemplo del Resguardo (2 apuestas)
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingBets(false)}
                          className="px-3 py-1.5 rounded-lg text-slate-600 font-medium hover:bg-slate-200 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEditedBets}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Guardar y Escrutar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* WEEKLY MULTI-DRAW VIEW: When ticketScope === 'weekly' */}
                {/* ========================================================================= */}
                {ticketScope === 'weekly' && multiDrawResult && (
                  <div className="space-y-4 mt-4">
                    {/* Overall Weekly Financial Result Banner */}
                    <div
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        multiDrawResult.totalWon > 0
                          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            multiDrawResult.totalWon > 0
                              ? 'bg-emerald-500 text-white shadow-md'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {multiDrawResult.totalWon > 0 ? (
                            <Trophy className="w-6 h-6" />
                          ) : (
                            <Award className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-base sm:text-lg">
                            {multiDrawResult.totalWon > 0
                              ? '¡Boleto Semanal Premiado!'
                              : 'Boleto sin premio en la semana escrutada'}
                          </h4>
                          <p className="text-xs">
                            {multiDrawResult.winningDrawsCount > 0 ? (
                              <span>
                                <strong>{multiDrawResult.winningDrawsCount}</strong> de{' '}
                                <strong>{multiDrawResult.drawsCount}</strong> sorteos con premio ·{' '}
                                <strong>{multiDrawResult.totalWinningBets}</strong> apuesta(s) premiada(s)
                              </span>
                            ) : (
                              <span>
                                Escrutado en los {multiDrawResult.drawsCount} sorteos oficiales ({multiDrawResult.weekLabel})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right self-end sm:self-center">
                        <span className="text-[11px] font-semibold text-slate-500 block">
                          Total acumulado en la semana:
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                          {multiDrawResult.totalWon.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          €
                        </span>
                      </div>
                    </div>

                    {/* DEDICATED PANEL: Comunicación de cada sorteo escrutado (Lunes, Jueves o Sábado para Primitiva) */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span>
                            {selectedGame === 'primitiva'
                              ? 'Sorteos de la semana escrutados (Lunes, Jueves y Sábado):'
                              : selectedGame === 'bonoloto'
                              ? 'Sorteos de la semana escrutados (Lunes a Domingo):'
                              : 'Sorteos de la semana escrutados (Martes y Viernes):'}
                          </span>
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {multiDrawResult.draws.length} sorteos evaluados
                        </span>
                      </div>

                      <div
                        className={`grid grid-cols-1 ${
                          multiDrawResult.draws.length === 2
                            ? 'sm:grid-cols-2'
                            : multiDrawResult.draws.length === 3
                            ? 'sm:grid-cols-3'
                            : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                        } gap-3`}
                      >
                        {multiDrawResult.draws.map((ds) => {
                          const isWon = ds.totalWon > 0 || ds.reintegroWon;
                          const isSelectedDay = activeTabDayId === ds.draw.id;

                          return (
                            <div
                              key={ds.draw.id}
                              className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                                isWon
                                  ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200/60 shadow-xs'
                                  : 'bg-slate-50/80 border-slate-200'
                              }`}
                            >
                              <div>
                                {/* Draw Header & Day status */}
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div>
                                    <span className="font-black text-slate-900 text-xs uppercase tracking-wide block">
                                      {ds.dayOfWeek}
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      {ds.date}
                                    </span>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-black border shadow-2xs ${
                                      isWon
                                        ? 'bg-emerald-600 text-white border-emerald-500'
                                        : 'bg-slate-200 text-slate-600 border-slate-300'
                                    }`}
                                  >
                                    {isWon
                                      ? `+${ds.totalWon.toLocaleString('es-ES', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })} €`
                                      : '0,00 €'}
                                  </span>
                                </div>

                                {/* Official Winning Combination for this day */}
                                <div className="p-2 bg-white rounded-lg border border-slate-200/80 mb-2.5">
                                  <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                                    Combinación Ganadora:
                                  </span>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    {ds.draw.numbers.map((n) => (
                                      <span
                                        key={n}
                                        className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center"
                                      >
                                        {n}
                                      </span>
                                    ))}
                                    {ds.draw.complementario !== undefined && (
                                      <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold text-[10px] border border-indigo-200">
                                        C:{ds.draw.complementario}
                                      </span>
                                    )}
                                    {ds.draw.reintegro !== undefined && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">
                                        R:{ds.draw.reintegro}
                                      </span>
                                    )}
                                    {ds.draw.stars &&
                                      ds.draw.stars.map((s) => (
                                        <span
                                          key={s}
                                          className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center border border-amber-300"
                                        >
                                          ★{s}
                                        </span>
                                      ))}
                                  </div>
                                </div>

                                {/* Hits and prizes communication on this day */}
                                <div className="space-y-1.5 text-xs">
                                  {ds.winningBets.length > 0 ? (
                                    ds.winningBets.map((wb) => (
                                      <div
                                        key={wb.betIndex}
                                        className="flex items-center justify-between text-emerald-950 bg-emerald-100/80 px-2 py-1 rounded-md border border-emerald-200 text-[11px]"
                                      >
                                        <span className="font-semibold">
                                          Apuesta {wb.betIndex}: {wb.hits} aciertos ({wb.category})
                                        </span>
                                        <strong className="font-mono text-emerald-800">
                                          +{wb.prize.toLocaleString('es-ES', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}{' '}
                                          €
                                        </strong>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-[11px] text-slate-500 italic py-0.5">
                                      Sin aciertos premiados en este día
                                    </p>
                                  )}

                                  {ds.reintegroWon && (
                                    <div className="flex items-center justify-between text-amber-950 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                                      <span>Reintegro acertado (R: {ds.draw.reintegro})</span>
                                      <strong className="font-mono text-amber-900">+1,00 €</strong>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Inspect this day's bets button */}
                              <button
                                type="button"
                                onClick={() => setActiveTabDayId(isSelectedDay ? 'all' : ds.draw.id)}
                                className={`mt-3 w-full py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                  isSelectedDay
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <span>
                                  {isSelectedDay
                                    ? 'Viendo apuestas de este sorteo'
                                    : `Ver apuestas del ${ds.dayOfWeek}`}
                                </span>
                                <ChevronRight
                                  className={`w-3.5 h-3.5 transition-transform ${
                                    isSelectedDay ? 'rotate-90' : ''
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* BETS BREAKDOWN WITH DAY FILTER TABS */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <ListFilter className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Desglose de apuestas escaneadas:</span>
                        </h4>

                        {/* Tabs for days */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
                          <button
                            type="button"
                            onClick={() => setActiveTabDayId('all')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              activeTabDayId === 'all'
                                ? 'bg-white text-indigo-800 shadow-2xs border border-slate-200'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Resumen Semanal Completo
                          </button>
                          {multiDrawResult.draws.map((ds) => (
                            <button
                              key={ds.draw.id}
                              type="button"
                              onClick={() => setActiveTabDayId(ds.draw.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                activeTabDayId === ds.draw.id
                                  ? 'bg-indigo-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {ds.dayOfWeek}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* If "all" tab is selected: show bet overview across all days */}
                      {activeTabDayId === 'all' ? (
                        <div className="space-y-2">
                          {multiDrawResult.betsSummary.length === 0 ? (
                            <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200">
                              <p className="text-sm font-semibold text-slate-700">
                                Aún no hay apuestas añadidas para este resguardo
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Haz clic en el botón superior «Cargar Apuestas de este Resguardo» o «Añadir Apuestas» para ver el desglose y cálculo de aciertos.
                              </p>
                            </div>
                          ) : (
                            multiDrawResult.betsSummary.map((bet) => (
                              <div
                                key={bet.betIndex}
                                className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                                  bet.totalPrize > 0
                                    ? 'bg-emerald-50/60 border-emerald-200'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center border border-slate-200">
                                      {bet.betIndex}
                                    </span>
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {bet.numbers.map((n) => (
                                        <span
                                          key={n}
                                          className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-2xs"
                                        >
                                          {n}
                                        </span>
                                      ))}
                                      {bet.stars &&
                                        bet.stars.map((s) => (
                                          <span
                                            key={s}
                                            className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center shadow-2xs border border-amber-300"
                                          >
                                            ★{s}
                                          </span>
                                        ))}
                                    </div>
                                  </div>

                                  {/* Performance row across each day */}
                                  <div className="flex items-center gap-2 flex-wrap text-xs mt-2">
                                    {bet.drawPerformances.map((perf) => (
                                      <span
                                        key={perf.drawId}
                                        className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold flex items-center gap-1 ${
                                          perf.estimatedPrize > 0
                                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                                            : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}
                                      >
                                        <strong className="uppercase">{perf.dayOfWeek}:</strong>{' '}
                                        {perf.hitsCount} aciertos
                                        {perf.starsHitsCount ? ` + ${perf.starsHitsCount}★` : ''}
                                        {perf.estimatedPrize > 0 && (
                                          <span className="text-emerald-700 font-mono">
                                            (+{perf.estimatedPrize.toFixed(2)} €)
                                          </span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                                    Total Apuesta:
                                  </span>
                                  <span className="font-mono font-black text-sm text-emerald-800">
                                    {bet.totalPrize.toLocaleString('es-ES', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}{' '}
                                    €
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        /* Specific Day Bet Inspection: visual hit highlighting */
                        (() => {
                          const targetDrawScrutiny = multiDrawResult.draws.find(
                            (d) => d.draw.id === activeTabDayId
                          );
                          if (!targetDrawScrutiny) return null;

                          const winningSet = new Set(targetDrawScrutiny.draw.numbers || []);
                          const winningStarsSet = new Set(targetDrawScrutiny.draw.stars || []);

                          return (
                            <div className="space-y-2">
                              <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-100 text-xs text-indigo-950 flex items-center justify-between gap-2">
                                <span>
                                  Mostrando aciertos iluminados en el sorteo de{' '}
                                  <strong>
                                    {targetDrawScrutiny.dayOfWeek} ({targetDrawScrutiny.date})
                                  </strong>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setActiveTabDayId('all')}
                                  className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                                >
                                  Volver a resumen semanal
                                </button>
                              </div>

                              {targetDrawScrutiny.scrutiny.bets.length === 0 ? (
                                <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200">
                                  <p className="text-sm font-semibold text-slate-700">
                                    No hay apuestas cargadas aún para este sorteo
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Carga las apuestas del resguardo para ver los aciertos obtenidos en {targetDrawScrutiny.dayOfWeek}.
                                  </p>
                                </div>
                              ) : (
                                targetDrawScrutiny.scrutiny.bets.map((bet) => (
                                <div
                                  key={bet.index}
                                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                                    bet.isPrize
                                      ? 'bg-emerald-50/70 border-emerald-200'
                                      : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center border border-slate-200">
                                      {bet.index}
                                    </span>

                                    {/* Numbers */}
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {bet.numbers.map((n) => {
                                        const isHit = winningSet.has(n);
                                        const isComp =
                                          targetDrawScrutiny.draw.complementario === n;
                                        return (
                                          <span
                                            key={n}
                                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition shadow-2xs ${
                                              isHit
                                                ? 'bg-emerald-600 text-white font-black ring-2 ring-emerald-400'
                                                : isComp
                                                ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-300'
                                                : 'bg-slate-100 text-slate-800 border border-slate-300'
                                            }`}
                                            title={
                                              isHit
                                                ? 'Número acertado'
                                                : isComp
                                                ? 'Complementario'
                                                : ''
                                            }
                                          >
                                            {n}
                                          </span>
                                        );
                                      })}

                                      {/* Stars */}
                                      {bet.stars && bet.stars.length > 0 && (
                                        <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-300">
                                          {bet.stars.map((s) => {
                                            const isStarHit = winningStarsSet.has(s);
                                            return (
                                              <span
                                                key={s}
                                                className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs transition shadow-2xs ${
                                                  isStarHit
                                                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                                                    : 'bg-amber-50 text-amber-900 border border-amber-300'
                                                }`}
                                                title={isStarHit ? 'Estrella acertada' : ''}
                                              >
                                                ★{s}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0 text-xs">
                                    <span
                                      className={`px-2.5 py-1 rounded-full font-bold border ${
                                        bet.isPrize
                                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-2xs'
                                          : 'bg-slate-100 text-slate-600 border-slate-200'
                                      }`}
                                    >
                                      {bet.prizeCategory}
                                    </span>

                                    <span className="font-mono font-bold text-sm min-w-[70px] text-right text-slate-900">
                                      {bet.estimatedPrize > 0
                                        ? `${bet.estimatedPrize.toLocaleString('es-ES', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })} €`
                                        : '0,00 €'}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          );
                        })()
                      )}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* SINGLE DRAW VIEW: When ticketScope === 'single' */}
                {/* ========================================================================= */}
                {ticketScope === 'single' && currentDraw && (
                  <div className="space-y-4 mt-4">
                    {/* Draw Official Winning Numbers Bar */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-700 mr-1">
                          Combinación Ganadora ({currentDraw.dayOfWeek} {currentDraw.date}):
                        </span>
                        {currentDraw.numbers.map((n) => (
                          <span
                            key={n}
                            className="w-6 h-6 rounded-full bg-slate-800 text-white font-black text-xs flex items-center justify-center shadow-2xs"
                          >
                            {n}
                          </span>
                        ))}

                        {currentDraw.complementario !== undefined && (
                          <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold">
                            C: {currentDraw.complementario}
                          </span>
                        )}

                        {currentDraw.reintegro !== undefined && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                            R: {currentDraw.reintegro}
                          </span>
                        )}

                        {currentDraw.stars && currentDraw.stars.length > 0 && (
                          <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-300">
                            {currentDraw.stars.map((s) => (
                              <span
                                key={s}
                                className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-2xs border border-amber-300"
                              >
                                ★{s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scrutiny Financial Banner */}
                    {scrutinyResult && (
                      <div
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          scrutinyResult.winningBetsCount > 0 || scrutinyResult.reintegroWon
                            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                              scrutinyResult.winningBetsCount > 0 || scrutinyResult.reintegroWon
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {scrutinyResult.winningBetsCount > 0 || scrutinyResult.reintegroWon ? (
                              <Trophy className="w-6 h-6" />
                            ) : (
                              <Award className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-black text-base sm:text-lg">
                              {scrutinyResult.winningBetsCount > 0 || scrutinyResult.reintegroWon
                                ? '¡Boleto Premiado!'
                                : 'Boleto sin premio en este sorteo'}
                            </h4>
                            <p className="text-xs">
                              {scrutinyResult.winningBetsCount} apuesta(s) con aciertos premiados
                              {scrutinyResult.reintegroWon
                                ? ' + Reintegro acertado (reembolso)'
                                : ''}
                            </p>
                          </div>
                        </div>

                        <div className="text-right self-end sm:self-center">
                          <span className="text-[11px] font-semibold text-slate-500 block">
                            Importe estimado obtenido:
                          </span>
                          <span className="text-2xl font-black text-emerald-700 font-mono">
                            {scrutinyResult.totalWon.toLocaleString('es-ES', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            €
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Bets Breakdown List */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                        Desglose de apuestas escaneadas:
                      </h4>
                      {scrutinyResult?.bets.map((bet) => {
                        const winningSet = new Set(currentDraw?.numbers || []);
                        const winningStarsSet = new Set(currentDraw?.stars || []);

                        return (
                          <div
                            key={bet.index}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                              bet.isPrize
                                ? 'bg-emerald-50/70 border-emerald-200'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center border border-slate-200">
                                {bet.index}
                              </span>

                              {/* Numbers */}
                              <div className="flex items-center gap-1 flex-wrap">
                                {bet.numbers.map((n) => {
                                  const isHit = winningSet.has(n);
                                  const isComp = currentDraw?.complementario === n;
                                  return (
                                    <span
                                      key={n}
                                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition shadow-2xs ${
                                        isHit
                                          ? 'bg-emerald-600 text-white font-black ring-2 ring-emerald-400'
                                          : isComp
                                          ? 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-300'
                                          : 'bg-slate-100 text-slate-800 border border-slate-300'
                                      }`}
                                      title={
                                        isHit
                                          ? 'Número acertado'
                                          : isComp
                                          ? 'Complementario'
                                          : ''
                                      }
                                    >
                                      {n}
                                    </span>
                                  );
                                })}

                                {/* Stars if Euromillones */}
                                {bet.stars && bet.stars.length > 0 && (
                                  <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-300">
                                    {bet.stars.map((s) => {
                                      const isStarHit = winningStarsSet.has(s);
                                      return (
                                        <span
                                          key={s}
                                          className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs transition shadow-2xs ${
                                            isStarHit
                                              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                                              : 'bg-amber-50 text-amber-900 border border-amber-300'
                                          }`}
                                          title={isStarHit ? 'Estrella acertada' : ''}
                                        >
                                          ★{s}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Bet Scrutiny Category and Estimated Prize */}
                            <div className="flex items-center gap-3 self-end sm:self-center shrink-0 text-xs">
                              <span
                                className={`px-2.5 py-1 rounded-full font-bold border ${
                                  bet.isPrize
                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {bet.prizeCategory}
                              </span>

                              <span className="font-mono font-bold text-sm min-w-[70px] text-right text-slate-900">
                                {bet.estimatedPrize > 0
                                  ? `${bet.estimatedPrize.toLocaleString('es-ES', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })} €`
                                  : '0,00 €'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bottom Actions for current ticket */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    id="scan-another-ticket-bottom-btn"
                    onClick={handleScanAnotherTicket}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Escanear Otro Boleto</span>
                  </button>

                  <button
                    id="clear-ticket-bottom-btn"
                    onClick={handleClearCurrentTicket}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Limpiar resultado</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Guide Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              ¿Cómo funciona el lector de códigos de Loterías y Apuestas?
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 leading-relaxed">
              <li>
                <strong>Cámara en vivo</strong>: Enciende la cámara y sitúa el resguardo impreso bajo buena iluminación. El lector detecta automáticamente cualquier QR o texto de apuesta.
              </li>
              <li>
                <strong>Subir fotografía</strong>: Si estás con el móvil, puedes hacer una foto directa de tu resguardo y seleccionarla para analizarla sin activar el vídeo en directo.
              </li>
              <li>
                <strong>Códigos cifrados oficiales</strong>: SELAE protege los resguardos con un cifrado exclusivo de la red oficial de terminales para evitar duplicidades. Si tu código QR contiene el enlace cifrado oficial, la aplicación te proporciona el botón directo a la validación de SELAE y además te permite verificar los números automáticamente.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 truncate">
            {allDraws.length} sorteos oficiales sincronizados en la base de datos
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {parsedTicket && (
              <button
                id="scan-another-ticket-footer-btn"
                onClick={handleScanAnotherTicket}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-xs cursor-pointer active:scale-95"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Escanear Otro Boleto</span>
              </button>
            )}
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition cursor-pointer"
            >
              Cerrar Lector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
