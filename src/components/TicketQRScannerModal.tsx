import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { GameType, LotteryDraw } from '../types';
import {
  parseTicketQR,
  scrutinizeTicket,
  ParsedTicketData,
  TicketScrutinyResult,
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

  // Selected draw for verification
  const [selectedDrawId, setSelectedDrawId] = useState<string>('');
  const [customReintegro, setCustomReintegro] = useState<number | undefined>(undefined);
  const [scrutinyResult, setScrutinyResult] = useState<TicketScrutinyResult | null>(null);

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

  // Update scrutiny result whenever ticket, selected draw, or custom reintegro changes
  useEffect(() => {
    if (!parsedTicket || parsedTicket.bets.length === 0) {
      setScrutinyResult(null);
      return;
    }

    const draw = availableDraws.find((d) => d.id === selectedDrawId) || availableDraws[0];
    if (!draw) {
      setScrutinyResult(null);
      return;
    }

    const res = scrutinizeTicket(parsedTicket, draw, customReintegro);
    setScrutinyResult(res);
  }, [parsedTicket, selectedDrawId, customReintegro, availableDraws]);

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
    setManualInputText('');
    setCameraError(null);
    setCameraNotice(null);
    setIsManualInputMode(false);

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
    setManualInputText('');
    setCameraError(null);
    setCameraNotice(null);
    setIsManualInputMode(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Demo test ticket generator to test immediately without needing a physical paper slip
  const handleLoadDemoTicket = () => {
    let demoText = '';
    if (selectedGame === 'primitiva') {
      demoText = `LA PRIMITIVA - SELAE
Apuesta 1: 03 04 22 26 40 44
Apuesta 2: 10 15 28 33 42 47
Reintegro: 8`;
    } else if (selectedGame === 'bonoloto') {
      demoText = `BONOLOTO - SELAE
Apuesta 1: 03 04 12 23 37 48
Apuesta 2: 07 18 25 31 40 49
Reintegro: 8`;
    } else {
      demoText = `EUROMILLONES - SELAE
Apuesta 1: 01 07 15 39 50 + 01 11
Apuesta 2: 12 18 24 33 45 + 04 09`;
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
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
                    </div>
                    {currentDraw && (
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <span>Escrutado contra el sorteo oficial:</span>
                        <strong className="text-slate-800">
                          {currentDraw.dayOfWeek}, {currentDraw.date}
                        </strong>
                      </p>
                    )}
                  </div>

                  {/* Actions & Reintegro */}
                  <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
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
                      <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
                        <span className="font-semibold text-slate-700">Reintegro (R):</span>
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
                              R: {r} {currentDraw?.reintegro === r ? '★ (Premio)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Draw Official Winning Numbers Bar */}
                {currentDraw && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-700 mr-1">Combinación Ganadora:</span>
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
                )}

                {/* Scrutiny Financial Banner */}
                {scrutinyResult && (
                  <div
                    className={`mt-4 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      scrutinyResult.winningBetsCount > 0 || scrutinyResult.reintegroWon
                        ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300 text-emerald-950'
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
                          {scrutinyResult.reintegroWon ? ' + Reintegro acertado (reembolso)' : ''}
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
                <div className="mt-4 space-y-2">
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
                                  title={isHit ? 'Número acertado' : isComp ? 'Complementario' : ''}
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
