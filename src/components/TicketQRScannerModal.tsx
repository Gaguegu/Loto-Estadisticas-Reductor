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
  Smartphone,
  Grid3X3,
  Image as ImageIcon,
  Dices,
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
  const [isProcessingImage, setIsProcessingImage] = useState(false);
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

  // Primary interaction mode: 'scanner' (camera/file/gallery), 'keypad' (touch number selection), 'manual' (text/paste)
  const [activeMode, setActiveMode] = useState<'scanner' | 'keypad' | 'manual'>('scanner');
  const [keypadNumbers, setKeypadNumbers] = useState<number[]>([]);
  const [keypadStars, setKeypadStars] = useState<number[]>([]);
  const [keypadReintegro, setKeypadReintegro] = useState<number>(0);
  const [keypadBetsList, setKeypadBetsList] = useState<{ numbers: number[]; stars?: number[]; reintegro?: number }[]>([]);

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
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

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
      setActiveMode('scanner');
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

  // Helper with timeout to prevent hanging indefinitely in Android WebViews where permission isn't prompted
  const requestMediaStreamWithTimeout = async (
    constraints: MediaStreamConstraints,
    timeoutMs = 4000
  ): Promise<MediaStream> => {
    let timer: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error('TIMEOUT_CAMERA_ACCESS');
        err.name = 'TimeoutError';
        reject(err);
      }, timeoutMs);
    });

    try {
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia(constraints),
        timeoutPromise,
      ]);
      clearTimeout(timer);
      return stream;
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  };

  // Start webcam / mobile video stream
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
        throw new Error('Tu entorno no admite streaming directo de vídeo. Abriendo selector de cámara del sistema...');
      }

      const deviceIdToUse = targetDeviceId !== undefined ? targetDeviceId : selectedDeviceId;

      let stream: MediaStream | null = null;

      // Strategy 1: If explicit deviceId provided, try deviceId first
      if (deviceIdToUse) {
        try {
          stream = await requestMediaStreamWithTimeout(
            {
              video: {
                deviceId: { exact: deviceIdToUse },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            },
            3500
          );
        } catch (e) {
          console.warn('Exact deviceId failed, falling back to facingMode:', e);
        }
      }

      // Strategy 2: Back camera on mobile phones (facingMode environment) with high resolution for crisp QR codes
      if (!stream) {
        try {
          stream = await requestMediaStreamWithTimeout(
            {
              video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            },
            3500
          );
        } catch (e) {
          console.warn('FacingMode environment failed, trying simpler facingMode:', e);
        }
      }

      // Strategy 3: Standard facingMode without resolution constraints
      if (!stream) {
        try {
          stream = await requestMediaStreamWithTimeout(
            {
              video: { facingMode: 'environment' },
              audio: false,
            },
            3000
          );
        } catch (e) {
          console.warn('Simple facingMode failed, falling back to basic video: true:', e);
        }
      }

      // Strategy 4: Simplest constraint { video: true }
      if (!stream) {
        stream = await requestMediaStreamWithTimeout({ video: true, audio: false }, 3000);
      }

      if (!stream) {
        throw new Error('No se pudo obtener la señal de vídeo de la cámara.');
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setIsStartingCamera(false);

      // Query device list with labels after permission granted
      await enumerateCameras();
    } catch (err: any) {
      console.warn('Live camera stream not available, falling back to direct photo capture:', err);
      setIsStartingCamera(false);
      setIsCameraActive(false);

      // Automatic seamless fallback for APK / WebViews: trigger native camera intent
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|wv/i.test(navigator.userAgent);
      if (isMobile) {
        handleOpenCameraCapture();
      } else {
        setCameraError(
          'No se pudo conectar a la cámara web. Puedes seleccionar una foto del resguardo o pulsar "Hacer Foto".'
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
        inversionAttempts: 'attemptBoth',
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

  // Process image upload from file (phone camera capture / gallery)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setCameraError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Helper to scan canvas at a given scale and optional high-contrast binarization
          const scanAtScale = (scaleFactor: number, applyContrast = false): string | null => {
            const canvas = document.createElement('canvas');
            const targetW = Math.max(100, Math.round(img.width * scaleFactor));
            const targetH = Math.max(100, Math.round(img.height * scaleFactor));
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return null;
            ctx.drawImage(img, 0, 0, targetW, targetH);
            const imgData = ctx.getImageData(0, 0, targetW, targetH);

            if (applyContrast) {
              // High contrast binarization filter to read blurry, low-contrast, or unevenly lit phone photos
              const d = imgData.data;
              let sum = 0;
              const count = d.length / 4;
              for (let i = 0; i < d.length; i += 4) {
                sum += (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
              }
              const avg = sum / count;
              for (let i = 0; i < d.length; i += 4) {
                const gray = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
                const val = gray < avg ? 0 : 255;
                d[i] = val;
                d[i + 1] = val;
                d[i + 2] = val;
              }
            }

            const code = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'attemptBoth',
            });
            return code && code.data ? code.data : null;
          };

          const maxDimension = Math.max(img.width, img.height);
          let primaryScale = 1;
          if (maxDimension > 1280) {
            primaryScale = 1280 / maxDimension;
          }

          // Pass 1: scan at optimal jsQR dimension (~1280px max)
          let qrData = scanAtScale(primaryScale, false);

          // Pass 2: if not found, try with high contrast filter
          if (!qrData) {
            qrData = scanAtScale(primaryScale, true);
          }

          // Pass 3: if not found and original was larger, try slightly higher resolution (1600px)
          if (!qrData && primaryScale < 1) {
            const secondaryScale = Math.min(1, 1600 / maxDimension);
            qrData = scanAtScale(secondaryScale, false);
            if (!qrData) {
              qrData = scanAtScale(secondaryScale, true);
            }
          }

          // Pass 4: if still not found, try original scale if within 2200px
          if (!qrData && maxDimension <= 2200 && primaryScale !== 1) {
            qrData = scanAtScale(1, false);
          }

          setIsProcessingImage(false);

          if (qrData) {
            handleCodeDetected(qrData);
            setCameraError(null);
          } else {
            setCameraError(
              'No se detectó ningún código QR legible en la foto. Consejo: Acerca la cámara más al código QR del resguardo, enfoca con nitidez y asegúrate de que tenga buena iluminación.'
            );
          }
        } catch (err: any) {
          console.error('Error scanning QR image:', err);
          setIsProcessingImage(false);
          setCameraError('Ocurrió un error al procesar la imagen. Por favor, inténtalo de nuevo.');
        }
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        setCameraError('No se pudo cargar la imagen seleccionada.');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsProcessingImage(false);
      setCameraError('Error al leer el archivo de la cámara.');
    };
    reader.readAsDataURL(file);
    // Reset file input value
    e.target.value = '';
  };

  // Trigger native mobile camera capture
  const handleOpenCameraCapture = () => {
    setCameraError(null);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  // Unified single smart scan button: Opens camera on mobile devices / APK or starts webcam on PC
  const handleUnifiedScan = () => {
    setCameraError(null);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|wv/i.test(navigator.userAgent);
    if (isMobile) {
      // Direct native camera capture works universally in Android APK WebViews, Chrome Mobile, Safari, etc.
      handleOpenCameraCapture();
    } else {
      // In PC / Desktop: Start live webcam video stream directly
      startCamera();
    }
  };

  // Trigger gallery image picker (standard picker, highly compatible with Android WebViews)
  const handleOpenGalleryPicker = () => {
    setCameraError(null);
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
      galleryInputRef.current.click();
    }
  };

  // Keypad: Toggle number in current bet
  const handleToggleKeypadNumber = (num: number) => {
    const maxNumbers = selectedGame === 'euromillones' ? 5 : 6;
    setKeypadNumbers((prev) => {
      if (prev.includes(num)) {
        return prev.filter((n) => n !== num);
      }
      if (prev.length >= maxNumbers) {
        return prev;
      }
      return [...prev, num].sort((a, b) => a - b);
    });
  };

  // Keypad: Toggle star for Euromillones
  const handleToggleKeypadStar = (star: number) => {
    setKeypadStars((prev) => {
      if (prev.includes(star)) {
        return prev.filter((s) => s !== star);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, star].sort((a, b) => a - b);
    });
  };

  // Keypad: Clear current active selection
  const handleClearKeypadSelection = () => {
    setKeypadNumbers([]);
    setKeypadStars([]);
  };

  // Keypad: Fill random valid combination
  const handleFillRandomKeypadNumbers = () => {
    const maxNumber = selectedGame === 'euromillones' ? 50 : 49;
    const count = selectedGame === 'euromillones' ? 5 : 6;
    const pool = Array.from({ length: maxNumber }, (_, i) => i + 1);
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const chosen = pool.slice(0, count).sort((a, b) => a - b);
    setKeypadNumbers(chosen);

    if (selectedGame === 'euromillones') {
      const starPool = Array.from({ length: 12 }, (_, i) => i + 1);
      for (let i = starPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [starPool[i], starPool[j]] = [starPool[j], starPool[i]];
      }
      setKeypadStars(starPool.slice(0, 2).sort((a, b) => a - b));
    } else {
      setKeypadReintegro(Math.floor(Math.random() * 10));
    }
  };

  // Keypad: Add current combination to list of bets
  const handleAddKeypadBet = () => {
    const reqNumbers = selectedGame === 'euromillones' ? 5 : 6;
    if (keypadNumbers.length !== reqNumbers) return;
    if (selectedGame === 'euromillones' && keypadStars.length !== 2) return;

    setKeypadBetsList((prev) => [
      ...prev,
      {
        numbers: [...keypadNumbers].sort((a, b) => a - b),
        stars: selectedGame === 'euromillones' ? [...keypadStars].sort((a, b) => a - b) : undefined,
        reintegro: selectedGame !== 'euromillones' ? keypadReintegro : undefined,
      },
    ]);
    setKeypadNumbers([]);
    setKeypadStars([]);
  };

  // Keypad: Remove a saved bet from list
  const handleRemoveKeypadBet = (idxToRemove: number) => {
    setKeypadBetsList((prev) => prev.filter((_, i) => i !== idxToRemove));
  };

  // Keypad: Finalize and scrutinize ticket
  const handleCheckKeypadTicket = () => {
    const reqNumbers = selectedGame === 'euromillones' ? 5 : 6;
    let finalBets = [...keypadBetsList];

    // If user has a valid unadded bet on screen, include it!
    if (keypadNumbers.length === reqNumbers && (selectedGame !== 'euromillones' || keypadStars.length === 2)) {
      finalBets.push({
        numbers: [...keypadNumbers].sort((a, b) => a - b),
        stars: selectedGame === 'euromillones' ? [...keypadStars].sort((a, b) => a - b) : undefined,
        reintegro: selectedGame !== 'euromillones' ? keypadReintegro : undefined,
      });
    }

    if (finalBets.length === 0) return;

    const newTicket: ParsedTicketData = {
      raw: `TECLADO_${selectedGame.toUpperCase()}`,
      game: selectedGame,
      reintegro: selectedGame !== 'euromillones' ? keypadReintegro : undefined,
      ticketScope: ticketScope,
      isOfficialSELAECode: false,
      notes: 'Boleto introducido mediante el teclado táctil',
      bets: finalBets.map((b, idx) => ({
        index: idx + 1,
        numbers: b.numbers,
        stars: b.stars,
        reintegro: b.reintegro ?? keypadReintegro,
      })),
    };

    setParsedTicket(newTicket);
    setCustomReintegro(selectedGame !== 'euromillones' ? keypadReintegro : undefined);
    setIsEditingBets(false);
    setActiveTabDayId('all');

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Process manual code or combination text input
  const handleProcessManualInput = () => {
    if (!manualInputText.trim()) return;
    handleCodeDetected(manualInputText.trim());
    setIsManualInputMode(false);
  };

  // Reset current scanned ticket and return to scanner or keypad smoothly
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
    setKeypadNumbers([]);
    setKeypadStars([]);
    setKeypadBetsList([]);

    // Scroll smoothly to top
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Modify current numbers: returns to keypad with existing numbers pre-loaded
  const handleModifyCurrentNumbers = () => {
    if (parsedTicket && parsedTicket.bets.length > 0) {
      const firstBet = parsedTicket.bets[0];
      setKeypadNumbers([...firstBet.numbers]);
      setKeypadStars(firstBet.stars ? [...firstBet.stars] : []);
      if (firstBet.reintegro !== undefined) {
        setKeypadReintegro(firstBet.reintegro);
      }
      if (parsedTicket.bets.length > 1) {
        setKeypadBetsList(
          parsedTicket.bets.slice(1).map((b) => ({
            numbers: b.numbers,
            stars: b.stars,
            reintegro: b.reintegro,
          }))
        );
      } else {
        setKeypadBetsList([]);
      }
    }
    setParsedTicket(null);
    setActiveMode('keypad');
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    const currentGame = parsedTicket.game || selectedGame;

    if (currentGame === 'bonoloto') {
      const updated: ParsedTicketData = {
        ...parsedTicket,
        game: 'bonoloto',
        reintegro: 0,
        ticketScope: 'single',
        date: '2026-09-08',
        drawNumber: '251',
        priceEur: 4.0,
        bets: [
          { index: 1, numbers: [2, 18, 19, 23, 28, 30], reintegro: 0 },
          { index: 2, numbers: [2, 18, 19, 33, 36, 40], reintegro: 0 },
          { index: 3, numbers: [2, 18, 23, 33, 43, 46], reintegro: 0 },
          { index: 4, numbers: [2, 19, 28, 36, 43, 46], reintegro: 0 },
          { index: 5, numbers: [2, 23, 30, 36, 40, 43], reintegro: 0 },
          { index: 6, numbers: [2, 28, 30, 33, 40, 46], reintegro: 0 },
          { index: 7, numbers: [18, 19, 30, 40, 43, 46], reintegro: 0 },
          { index: 8, numbers: [18, 23, 28, 36, 40, 46], reintegro: 0 },
        ],
      };
      setParsedTicket(updated);
      setCustomReintegro(0);
      setTicketScope('single');
      setSelectedGame('bonoloto');
      const match = allDraws.find((d) => d.game === 'bonoloto' && d.date === '2026-09-08');
      if (match) {
        setSelectedDrawId(match.id);
      }
      setIsEditingBets(false);
      return;
    }

    if (currentGame === 'euromillones') {
      const updated: ParsedTicketData = {
        ...parsedTicket,
        game: 'euromillones',
        ticketScope: 'weekly',
        date: '2026-09-08',
        priceEur: 10.0,
        bets: [
          { index: 1, numbers: [1, 7, 15, 39, 50], stars: [1, 11] },
          { index: 2, numbers: [13, 17, 33, 35, 39], stars: [7, 12] },
        ],
      };
      setParsedTicket(updated);
      setTicketScope('weekly');
      setSelectedGame('euromillones');
      const match = allDraws.find((d) => d.game === 'euromillones' && d.date === '2026-09-08');
      if (match) {
        setSelectedDrawId(match.id);
      }
      setIsEditingBets(false);
      return;
    }

    // Default: Primitiva
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

  if (!isOpen) return null;

  const currentDraw = availableDraws.find((d) => d.id === selectedDrawId) || availableDraws[0];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopCamera();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-2xl shadow-2xl border-0 sm:border sm:border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-3.5 sm:px-5 py-2.5 sm:py-3.5 flex items-center justify-between border-b border-indigo-900/40 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base md:text-lg font-black text-white">
                  Comprobador de Boletos &amp; QR
                </h2>
                <span className="hidden sm:inline text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  SELAE
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-1">
                Comprueba aciertos y premios de tu boleto por foto, escáner o teclado
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              stopCamera();
              onClose();
            }}
            className="p-2 sm:p-2.5 rounded-xl text-white/90 hover:text-white bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/25 transition cursor-pointer shrink-0 flex items-center justify-center active:scale-95"
            title="Cerrar comprobador"
            aria-label="Cerrar comprobador"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game and Draw Selection Filter */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <span className="font-bold text-slate-600 mr-1 hidden xs:inline">Juego:</span>
            <button
              type="button"
              onClick={() => {
                setSelectedGame('primitiva');
                setParsedTicket(null);
                setScrutinyResult(null);
                setKeypadNumbers([]);
                setKeypadStars([]);
                setKeypadBetsList([]);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                selectedGame === 'primitiva'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              La Primitiva
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedGame('bonoloto');
                setParsedTicket(null);
                setScrutinyResult(null);
                setKeypadNumbers([]);
                setKeypadStars([]);
                setKeypadBetsList([]);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                selectedGame === 'bonoloto'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Bonoloto
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedGame('euromillones');
                setParsedTicket(null);
                setScrutinyResult(null);
                setKeypadNumbers([]);
                setKeypadStars([]);
                setKeypadBetsList([]);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                selectedGame === 'euromillones'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Euromillones
            </button>
          </div>

          {/* Sorteo a comprobar */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Sorteo:</span>
            </span>
            <select
              value={selectedDrawId}
              onChange={(e) => setSelectedDrawId(e.target.value)}
              className="max-w-[170px] sm:max-w-none px-2 py-1 rounded-lg bg-white border border-slate-300 font-semibold text-slate-800 text-xs shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-none truncate"
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

        {/* Verification Method Navigation Tabs */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-3 sm:px-5 py-1.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              if (parsedTicket) setParsedTicket(null);
              setActiveMode('scanner');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeMode === 'scanner' && !parsedTicket
                ? 'bg-white text-indigo-950 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
            <span>📸 Escáner Cámara</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (parsedTicket) setParsedTicket(null);
              setActiveMode('keypad');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeMode === 'keypad' && !parsedTicket
                ? 'bg-white text-indigo-950 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>✍️ Teclado Táctil</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (parsedTicket) setParsedTicket(null);
              setActiveMode('manual');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeMode === 'manual' && !parsedTicket
                ? 'bg-white text-indigo-950 shadow-xs border border-slate-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
            <span>📋 Pegar Texto</span>
          </button>

          {parsedTicket && (
            <span className="ml-auto text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Resultados Mostrados</span>
            </span>
          )}
        </div>

        {/* Hidden inputs to trigger mobile camera intent or gallery picker */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
          id="qr-camera-direct-input"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          id="qr-gallery-direct-input"
        />

        {/* Modal Scrollable Body */}
        <div ref={scrollContainerRef} className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-slate-100/50">
          
          {/* TAB 1: SCANNER & PHOTO INPUT - SIMPLIFIED TO ONE DIRECT SCAN BUTTON */}
          {!parsedTicket && activeMode === 'scanner' && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Camera className="w-5 h-5 text-indigo-600" />
                    Escanear Boleto con la Cámara
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pulsa el botón para abrir la cámara y enfocar el código QR de tu boleto.
                  </p>
                </div>

                {parsedTicket && (
                  <button
                    id="scan-another-top-card-btn"
                    onClick={handleScanAnotherTicket}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 self-start sm:self-auto"
                    title="Limpiar este boleto y preparar el lector para el siguiente"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Escanear Siguiente Boleto</span>
                  </button>
                )}
              </div>

              {/* ONE SINGLE MAIN SCAN BUTTON */}
              <div className="pt-1">
                <button
                  type="button"
                  id="unified-scanner-main-btn"
                  onClick={handleUnifiedScan}
                  className="w-full flex items-center justify-center gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer border border-emerald-500/40 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                    <Camera className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block font-black text-base sm:text-lg text-white leading-tight">
                      📸 Abrir Cámara y Escanear
                    </span>
                    <span className="block text-xs text-emerald-100 mt-0.5 font-medium">
                      Enfoca el código QR de tu resguardo oficial
                    </span>
                  </div>
                </button>
              </div>

              {/* Subtle Alternative Options (Direct Video, Gallery & Demo) */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleOpenGalleryPicker}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Elegir foto de galería</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCameraError(null);
                      startCamera();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium border border-indigo-200 transition cursor-pointer"
                    title="Iniciar streaming de vídeo continuo (ideal para PC con webcam o navegadores compatibles)"
                  >
                    <Video className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Vídeo en directo</span>
                  </button>
                </div>
              </div>

              {/* Image processing state indicator */}
              {isProcessingImage && (
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-center gap-3 shadow-2xs animate-pulse">
                  <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-indigo-900">Analizando foto del boleto...</p>
                    <p className="text-slate-600 text-[11px]">
                      Detectando código QR y comprobando apuestas con el sorteo oficial.
                    </p>
                  </div>
                </div>
              )}

              {/* Live Camera Viewport (Active in PC or if WebRTC is supported) */}
              {isCameraActive && (
                <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-indigo-500/50 shadow-inner flex flex-col items-center justify-center min-h-[240px] max-h-[360px]">
                  <video
                    ref={handleVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover max-h-[340px]"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Laser scan line overlay effect */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-56 border-2 border-indigo-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white"></div>
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_8px_#34d399]"></div>
                    </div>
                  </div>

                  <div className="absolute bottom-3 bg-black/75 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                    <span>Enfoca el código QR dentro del recuadro...</span>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="ml-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] px-2 py-0.5 rounded-md font-bold cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}

              {/* Camera Notice/Error Banner if permissions fail */}
              {cameraError && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="font-bold text-amber-950">Aviso sobre la cámara</p>
                    <p className="leading-relaxed text-slate-800">{cameraError}</p>
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCameraError(null);
                          handleOpenCameraCapture();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>📸 Hacer Foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCameraError(null);
                          setActiveMode('keypad');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition"
                      >
                        <Grid3X3 className="w-3.5 h-3.5" />
                        <span>✍️ Usar Teclado Táctil</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE TOUCH KEYPAD (Zero permissions needed, 100% reliable on all phones) */}
          {!parsedTicket && activeMode === 'keypad' && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">
                      Teclado Táctil de Comprobación
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      Rápido y Directo
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Toca los números de tu resguardo para comprobar premios al instante, sin depender de la cámara.
                  </p>
                </div>

                {/* Scope selector */}
                <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-100 p-1 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setTicketScope('weekly')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      ticketScope === 'weekly'
                        ? 'bg-white text-indigo-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semanal (Toda la semana)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketScope('single')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      ticketScope === 'single'
                        ? 'bg-white text-indigo-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1 Sorteo
                  </button>
                </div>
              </div>

              {/* Current Bet Status Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    Apuesta {keypadBetsList.length + 1}:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">
                      {keypadNumbers.length} de {selectedGame === 'euromillones' ? '5' : '6'} números marcados
                    </span>
                    {selectedGame === 'euromillones' && (
                      <span className="text-xs font-semibold text-amber-700">
                        • {keypadStars.length} de 2 estrellas
                      </span>
                    )}
                  </div>
                </div>

                {/* Selected Balls Preview */}
                <div className="flex items-center gap-1.5 flex-wrap min-h-[38px] p-2 bg-white rounded-lg border border-slate-200">
                  {keypadNumbers.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">
                      Toca los números abajo para añadirlos a tu apuesta...
                    </span>
                  ) : (
                    keypadNumbers.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleToggleKeypadNumber(n)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-2xs transition active:scale-95 cursor-pointer ${
                          selectedGame === 'primitiva'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : selectedGame === 'bonoloto'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                        title="Toca para quitar"
                      >
                        {n}
                      </button>
                    ))
                  )}

                  {/* Stars preview for Euromillones */}
                  {selectedGame === 'euromillones' && keypadStars.map((s) => (
                    <button
                      key={`star-${s}`}
                      type="button"
                      onClick={() => handleToggleKeypadStar(s)}
                      className="w-8 h-8 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-2xs transition active:scale-95 cursor-pointer"
                      title="Toca para quitar estrella"
                    >
                      ★{s}
                    </button>
                  ))}

                  {/* Reintegro for Primitiva / Bonoloto */}
                  {selectedGame !== 'euromillones' && (
                    <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300">
                      R: {keypadReintegro}
                    </span>
                  )}
                </div>

                {/* Reintegro Selector for Primitiva & Bonoloto */}
                {selectedGame !== 'euromillones' && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-xs font-bold text-slate-700 mr-1">Reintegro:</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {Array.from({ length: 10 }, (_, i) => i).map((r) => (
                        <button
                          key={`reintegro-${r}`}
                          type="button"
                          onClick={() => setKeypadReintegro(r)}
                          className={`w-7 h-7 rounded-full text-xs font-bold transition cursor-pointer ${
                            keypadReintegro === r
                              ? 'bg-amber-500 text-white shadow-xs scale-105'
                              : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Number Grid: 1 to 49 (or 50) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold px-0.5">
                  <span>Números principales (1 al {selectedGame === 'euromillones' ? '50' : '49'}):</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleFillRandomKeypadNumbers}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      <span>Aleatorio</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearKeypadSelection}
                      className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 sm:gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {Array.from(
                    { length: selectedGame === 'euromillones' ? 50 : 49 },
                    (_, i) => i + 1
                  ).map((num) => {
                    const isSelected = keypadNumbers.includes(num);
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleToggleKeypadNumber(num)}
                        className={`h-9 sm:h-10 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center cursor-pointer active:scale-95 select-none ${
                          isSelected
                            ? selectedGame === 'primitiva'
                              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                              : selectedGame === 'bonoloto'
                              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                              : 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400'
                            : 'bg-white text-slate-800 hover:bg-slate-200 border border-slate-200 shadow-2xs'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stars Grid for Euromillones */}
              {selectedGame === 'euromillones' && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs text-amber-900 font-bold px-0.5">
                    Estrellas (selecciona 2 de 12):
                  </span>
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 p-2 bg-amber-50/50 rounded-xl border border-amber-200">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((star) => {
                      const isSelected = keypadStars.includes(star);
                      return (
                        <button
                          key={`star-btn-${star}`}
                          type="button"
                          onClick={() => handleToggleKeypadStar(star)}
                          className={`h-9 rounded-xl font-black text-xs transition flex items-center justify-center cursor-pointer active:scale-95 select-none ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 shadow-xs ring-2 ring-amber-500 scale-105'
                              : 'bg-white text-slate-700 hover:bg-amber-100 border border-amber-200'
                          }`}
                        >
                          ★{star}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Already Added Bets List (if multi-bet) */}
              {keypadBetsList.length > 0 && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-xs">
                  <span className="font-bold text-indigo-950">
                    Apuestas preparadas ({keypadBetsList.length}):
                  </span>
                  <div className="space-y-1.5">
                    {keypadBetsList.map((bet, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-indigo-100 shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-indigo-900 w-5">#{idx + 1}</span>
                          <span className="font-bold text-slate-800">
                            {bet.numbers.join(', ')}
                          </span>
                          {bet.stars && (
                            <span className="font-extrabold text-amber-700">
                              ★{bet.stars.join(', ')}
                            </span>
                          )}
                          {bet.reintegro !== undefined && (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                              R:{bet.reintegro}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeypadBet(idx)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          title="Eliminar apuesta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Action Bar for Keypad */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {keypadNumbers.length < (selectedGame === 'euromillones' ? 5 : 6) && keypadBetsList.length === 0 && (
                  <p className="text-[11px] text-indigo-700 font-semibold text-center">
                    💡 Marca {(selectedGame === 'euromillones' ? 5 : 6) - keypadNumbers.length} número{(selectedGame === 'euromillones' ? 5 : 6) - keypadNumbers.length === 1 ? '' : 's'} en la cuadrícula para comprobar (o pulsa «Aleatorio»)
                  </p>
                )}
                {selectedGame === 'euromillones' && keypadNumbers.length === 5 && keypadStars.length < 2 && (
                  <p className="text-[11px] text-amber-800 font-semibold text-center">
                    ⭐ Marca {2 - keypadStars.length} estrella{2 - keypadStars.length === 1 ? '' : 's'} más para completar
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleAddKeypadBet}
                      disabled={
                        keypadNumbers.length !== (selectedGame === 'euromillones' ? 5 : 6) ||
                        (selectedGame === 'euromillones' && keypadStars.length !== 2)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-800 font-bold text-xs border border-slate-300 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Añadir otra apuesta</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleFillRandomKeypadNumbers}
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition cursor-pointer"
                      title="Rellenar combinación de prueba al azar"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      <span>Aleatorio</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    id="check-keypad-ticket-btn"
                    onClick={handleCheckKeypadTicket}
                    disabled={
                      keypadBetsList.length === 0 &&
                      (keypadNumbers.length !== (selectedGame === 'euromillones' ? 5 : 6) ||
                        (selectedGame === 'euromillones' && keypadStars.length !== 2))
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer active:scale-95 ml-auto"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>
                      Comprobar Boleto Ahora
                      {keypadBetsList.length > 0 || keypadNumbers.length === (selectedGame === 'euromillones' ? 5 : 6)
                        ? ` (${keypadBetsList.length + (keypadNumbers.length === (selectedGame === 'euromillones' ? 5 : 6) ? 1 : 0)} ap.)`
                        : ''}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TEXT / COPY PASTE MANUAL INPUT */}
          {!parsedTicket && activeMode === 'manual' && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3 text-xs">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                Introduce los números o el texto del código QR:
              </label>
              <textarea
                rows={4}
                value={manualInputText}
                onChange={(e) => setManualInputText(e.target.value)}
                placeholder="Ejemplo: 03 04 12 23 37 48 R:8 o pega aquí la lectura de tu escáner"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              
              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                <span className="text-slate-500 font-medium">Boleto rápido:</span>
                <button
                  type="button"
                  onClick={() =>
                    setManualInputText(
                      `BONOLOTO - SELAE\n251 08 SEP 26\n1. 02 18 19 23 28 30\n2. 02 18 19 33 36 40\n3. 02 18 23 33 43 46\n4. 02 19 28 36 43 46\n5. 02 23 30 36 40 43\n6. 02 28 30 33 40 46\n7. 18 19 30 40 43 46\n8. 18 23 28 36 40 46\nREINTEGRO: 0\n42135-0 4,00 EUR`
                    )
                  }
                  className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold border border-emerald-300 cursor-pointer"
                >
                  ★ Bonoloto 8 Apuestas (Foto)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setManualInputText(
                      `LA PRIMITIVA - SELAE\n108 07 SEP 26 - 110 12 SEP 26\n1. 06 09 12 33 34 41\n2. 15 27 37 42 45 48\nREINTEGRO: 5\n42035-0 6,00 EUR`
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-semibold border border-slate-200 cursor-pointer"
                >
                  Primitiva 3 Días (2 apuestas)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setManualInputText(
                      `BONOLOTO - SELAE\nMODALIDAD: SEMANAL (LUNES A DOMINGO)\n1. 03 04 12 23 37 48\n2. 07 18 25 31 40 49\nREINTEGRO: 8\n7,00 EUR`
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-blue-700 font-semibold border border-slate-200 cursor-pointer"
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
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-amber-50 text-amber-800 font-semibold border border-slate-200 cursor-pointer"
                >
                  Euromillones Semanal
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveMode('scanner')}
                  className="px-3 py-1.5 rounded-lg text-slate-600 font-medium hover:bg-slate-200 cursor-pointer"
                >
                  Volver al Escáner
                </button>
                <button
                  type="button"
                  onClick={handleProcessManualInput}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Procesar Boleto
                </button>
              </div>
            </div>
          )}

          {/* Official SELAE Notice & Mobile Guidance */}
          {!parsedTicket && (
            <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-blue-900">
                    Comprobación Oficial de Loterías y Apuestas del Estado (SELAE)
                  </p>
                  <p className="text-blue-800/90 text-[11px] leading-relaxed">
                    Si tu resguardo físico tiene un código QR oficial con número de serie cifrado, también puedes validarlo en el portal oficial con el botón directo:
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
          )}

          {/* Results Display Section */}
          {parsedTicket && (
            <div className="space-y-4">
              {/* Quick actions top bar */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-2.5 flex-wrap shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-emerald-950">Boleto Comprobado con Éxito</p>
                    <p className="text-[11px] text-emerald-800">
                      Aciertos y categorías escrutados con los datos oficiales
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap ml-auto">
                  <button
                    type="button"
                    onClick={handleModifyCurrentNumbers}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-2xs cursor-pointer active:scale-95 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Modificar Números</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleScanAnotherTicket}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Comprobar Otro Boleto</span>
                  </button>
                </div>
              </div>
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
                          Por motivos de seguridad de Loterías del Estado (SELAE), el código QR impreso en el papel contiene un <strong>código criptográfico del terminal</strong> y no incluye las apuestas ni la fecha en texto libre.
                          {parsedTicket.game === 'bonoloto'
                            ? ' Puedes cargar las 8 apuestas del resguardo con un clic o marcarlas en el teclado:'
                            : ' Puedes cargar las apuestas de ejemplo o introducirlas con el teclado:'}
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
                        <span>
                          {parsedTicket.game === 'bonoloto'
                            ? 'Cargar las 8 Apuestas del Resguardo de Bonoloto (08/09/2026 - R:0)'
                            : parsedTicket.game === 'euromillones'
                            ? 'Cargar Apuestas del Resguardo de Euromillones'
                            : 'Cargar Apuestas de este Resguardo (Primitiva 3 Días - R:5)'}
                        </span>
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
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      id="scan-another-ticket-bottom-btn"
                      onClick={handleScanAnotherTicket}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Escanear Otro Boleto</span>
                    </button>

                    <button
                      type="button"
                      id="clear-ticket-bottom-btn"
                      onClick={handleClearCurrentTicket}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold text-xs border border-slate-200 transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Limpiar resultado</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    id="close-ticket-in-card-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      stopCamera();
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs border border-slate-300 transition cursor-pointer ml-auto active:scale-95"
                  >
                    <X className="w-3.5 h-3.5 text-slate-600" />
                    <span>Cerrar</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Guide Card */}
          {!parsedTicket && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                ¿Cómo comprobar boletos y resguardos de Loterías y Apuestas?
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-600 leading-relaxed">
                <li>
                  <strong>✍️ Teclado Táctil (Recomendado)</strong>: Pulsa directamente sobre los números de tu boleto. Funciona en el 100% de los teléfonos, sin necesidad de permisos de cámara ni problemas de enfoque o reflejos.
                </li>
                <li>
                  <strong>📸 Hacer foto / Galería</strong>: Si prefieres la cámara, pulsa en "Hacer Foto" para abrir la cámara de tu móvil o selecciona una imagen de tu galería.
                </li>
                <li>
                  <strong>Códigos cifrados oficiales SELAE</strong>: Si tu resguardo físico tiene un código QR oficial con número de serie cifrado de terminal, la aplicación te proporciona el botón directo para validarlo al instante en el portal oficial de SELAE.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer with safe area padding elevated above mobile navigation buttons */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-5 pt-3 pb-[max(4.75rem,calc(env(safe-area-inset-bottom,0px)+3rem))] sm:pb-3 flex items-center justify-between gap-3 text-xs shrink-0">
          <span className="text-slate-500 truncate hidden sm:inline">
            {allDraws.length} sorteos oficiales sincronizados en la base de datos
          </span>
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
            {parsedTicket && (
              <button
                type="button"
                id="scan-another-ticket-footer-btn"
                onClick={handleScanAnotherTicket}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold transition shadow-xs cursor-pointer active:scale-95 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Otro Boleto</span>
              </button>
            )}
            <button
              type="button"
              id="modal-footer-close-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                stopCamera();
                onClose();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-950 text-white font-bold text-xs sm:text-sm border border-slate-600 shadow-md transition cursor-pointer active:scale-95 ml-auto"
            >
              <X className="w-4 h-4 text-slate-300" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
