import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { bookingService } from '../services/bookingService';
import { Booking, BookingStatus } from '../types';
import { 
  Camera, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  User, 
  Calendar, 
  Clock, 
  Tag, 
  Info,
  Car,
  Coffee,
  Gamepad2,
  Trophy,
  Monitor,
  Check,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QRScannerProps {
  onStatusUpdated?: () => void;
  onClose: () => void;
}

// Client-side beep synthesizer using the Web Audio API
const playBeep = (type: 'success' | 'error') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    
    if (type === 'success') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Clear high tone
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } else {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, audioCtx.currentTime); // Low warning buzzer
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    }
  } catch (e) {
    console.warn('Audio feedback failed:', e);
  }
};

const getServiceIcon = (type: string) => {
  switch (type) {
    case 'cafe': return <Coffee className="text-amber-500" size={18} />;
    case 'carWash': return <Car className="text-blue-500" size={18} />;
    case 'game': return <Gamepad2 className="text-purple-500" size={18} />;
    case 'badminton': return <Trophy className="text-emerald-500" size={18} />;
    case 'theatre': return <Monitor className="text-red-500" size={18} />;
    default: return <Tag className="text-zinc-500" size={18} />;
  }
};

const getServiceLabel = (type: string) => {
  switch (type) {
    case 'cafe': return 'Aura Cafe';
    case 'carWash': return 'Luxe Detailing';
    case 'game': return 'Gaming Lounge';
    case 'badminton': return 'Badminton Court';
    case 'theatre': return 'Private Theatre';
    default: return type;
  }
};

export default function QRScanner({ onStatusUpdated, onClose }: QRScannerProps) {
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scannerActive, setScannerActive] = useState<boolean>(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  
  // Scanning state
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<boolean>(false);
  
  const qrRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader-element";

  // Request camera list on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices.map(d => ({ id: d.id, label: d.label || `Camera ${devices.indexOf(d) + 1}` })));
          // Prefer environment/back camera if available
          const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setScannerError("No cameras detected on this device.");
        }
      })
      .catch((err) => {
        console.error("Camera retrieval error:", err);
        setScannerError("Camera permission denied or camera not available.");
      });

    return () => {
      stopScanner();
    };
  }, []);

  // Handle auto-starting scanner when camera is selected
  useEffect(() => {
    if (selectedCameraId && !scannedId) {
      startScanner(selectedCameraId);
    }
  }, [selectedCameraId, scannedId]);

  const startScanner = async (cameraId: string) => {
    try {
      setScannerError(null);
      if (qrRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(containerId);
      qrRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 15,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.75;
            return { width: size, height: size };
          }
        },
        async (decodedText) => {
          // Success callback
          if (decodedText && decodedText !== scannedId) {
            handleQRDetected(decodedText.trim());
          }
        },
        () => {
          // Silent failure - typical during continuous polling frame-by-frame
        }
      );

      setScannerActive(true);
    } catch (err: any) {
      console.error("Error starting camera scanner:", err);
      setScannerError(err?.message || "Failed to initiate camera video stream.");
      setScannerActive(false);
    }
  };

  const stopScanner = async () => {
    if (qrRef.current && qrRef.current.isScanning) {
      try {
        await qrRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner stream:", err);
      }
    }
    qrRef.current = null;
    setScannerActive(false);
  };

  const handleQRDetected = async (id: string) => {
    // Stop the scanner immediately on successful detection to prevent double triggering
    await stopScanner();
    setScannedId(id);
    setLoading(true);
    setScannerError(null);

    try {
      const bData = await bookingService.getBooking(id);
      if (bData) {
        playBeep('success');
        setBooking(bData);
      } else {
        playBeep('error');
        setScannerError(`No active booking found with ID: ${id.slice(-8).toUpperCase()}`);
      }
    } catch (err) {
      playBeep('error');
      setScannerError("An error occurred while validating this booking ID.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: BookingStatus) => {
    if (!scannedId) return;
    setActionLoading(true);
    try {
      // For car wash completed status, we default payment status to paid
      const extra: any = {};
      if (status === 'completed') {
        extra.paymentStatus = 'paid';
      }
      
      await bookingService.updateBookingStatus(scannedId, status, extra);
      setActionSuccess(true);
      playBeep('success');
      
      if (onStatusUpdated) {
        onStatusUpdated();
      }

      // Automatically reset to scanning mode after a brief delay
      setTimeout(() => {
        handleReset();
      }, 1800);
    } catch (err) {
      console.error("Failed status update:", err);
      playBeep('error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = () => {
    setScannedId(null);
    setBooking(null);
    setScannerError(null);
    setActionSuccess(false);
    setActionLoading(false);
    if (selectedCameraId) {
      startScanner(selectedCameraId);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 shadow-3xl text-slate-100 overflow-hidden relative">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 border border-accent/20 text-accent rounded-full flex items-center justify-center">
            <Camera size={18} />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-wider">Gate Check-In</h3>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Real-time QR Verification</p>
          </div>
        </div>
        
        <button
          onClick={() => {
            stopScanner();
            onClose();
          }}
          className="p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white rounded-xl transition-all font-black text-[9px] uppercase tracking-wider"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left/Middle Column: Camera Stream Frame */}
        <div className="md:col-span-6 flex flex-col items-center">
          
          {/* Custom Camera Dropdown selector */}
          {cameras.length > 1 && !scannedId && (
            <div className="w-full mb-3 flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl">
              <RefreshCw size={12} className="text-zinc-500 animate-spin-slow" />
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-zinc-300 w-full outline-none cursor-pointer"
              >
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id} className="bg-zinc-950 text-zinc-300">
                    {cam.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scanner Outer Container */}
          <div className="relative w-full aspect-square max-w-[280px] bg-zinc-900 border-2 border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center">
            
            {/* Standard HTML5-QR Element */}
            <div 
              id={containerId} 
              className={`w-full h-full object-cover transition-opacity duration-300 ${scannedId ? 'opacity-25' : 'opacity-100'}`}
            />

            {/* Aesthetic Scan Overlay */}
            {!scannedId && scannerActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                {/* 4 Corner Angles of the scanner box */}
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-accent rounded-tl" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-accent rounded-tr" />
                </div>
                
                {/* Scan animated line */}
                <div className="w-full h-0.5 bg-accent/70 shadow-[0_0_12px_#00E5FF] animate-bounce" />
                
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-accent rounded-bl" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-accent rounded-br" />
                </div>
              </div>
            )}

            {/* Scanned/Loading States inside camera preview */}
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
                >
                  <RefreshCw size={24} className="text-accent animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Loading Booking...</span>
                </motion.div>
              )}

              {scannedId && !loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-4 text-center"
                >
                  {booking ? (
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-3 border border-emerald-500/20">
                        <CheckCircle2 size={24} />
                      </div>
                      <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">Valid Code</span>
                      <span className="text-[8px] font-bold text-zinc-500 uppercase mt-1">ID: {scannedId.slice(-8).toUpperCase()}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-3 border border-red-500/20">
                        <XCircle size={24} />
                      </div>
                      <span className="text-xs font-black uppercase text-red-500 tracking-wider">Invalid Code</span>
                      <button 
                        onClick={handleReset}
                        className="mt-4 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-800"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="mt-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-center leading-relaxed">
            {!scannedId 
              ? "Center the visitor's QR code within the target zone" 
              : "Verify details on the right card"
            }
          </p>
        </div>

        {/* Right Column: Scanned Result Card & Status Updating Actions */}
        <div className="md:col-span-6 flex flex-col justify-between h-full min-h-[280px]">
          <AnimatePresence mode="wait">
            {booking ? (
              <motion.div
                key="booking-details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 flex flex-col gap-4 relative"
              >
                {/* Header detail */}
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/60">
                  <div className="w-9 h-9 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-800">
                    {getServiceIcon(booking.type)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">
                      {getServiceLabel(booking.type)}
                    </h4>
                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                      {booking.resourceName}
                    </p>
                  </div>
                  <span className={`ml-auto text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                    booking.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                    booking.status === 'ongoing' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                    'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  }`}>
                    {booking.status}
                  </span>
                </div>

                {/* Main Client Details */}
                <div className="grid grid-cols-1 gap-2.5 text-[9px] uppercase tracking-wider font-black text-zinc-500">
                  <div className="flex items-center gap-2">
                    <User size={13} className="text-zinc-600" />
                    <div>
                      <span className="text-zinc-600 mr-1">User:</span>
                      <span className="text-slate-300">{booking.userName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-zinc-600" />
                    <div>
                      <span className="text-zinc-600 mr-1">Date:</span>
                      <span className="text-slate-300">{booking.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-zinc-600" />
                    <div>
                      <span className="text-zinc-600 mr-1">Time:</span>
                      <span className="text-slate-300">{booking.startTime} - {booking.endTime} ({booking.duration} hr)</span>
                    </div>
                  </div>

                  {booking.vehicleNumber && (
                    <div className="flex items-center gap-2">
                      <Car size={13} className="text-zinc-600" />
                      <div>
                        <span className="text-zinc-600 mr-1">Vehicle:</span>
                        <span className="text-blue-400">{booking.vehicleNumber} ({booking.vehicleModel})</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Info size={13} className="text-zinc-600" />
                    <div>
                      <span className="text-zinc-600 mr-1">Payment:</span>
                      <span className={`font-bold ${booking.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {booking.paymentStatus === 'paid' ? 'Paid' : `Unpaid (₹${booking.price})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="pt-3 border-t border-zinc-800/60 mt-2">
                  {actionSuccess ? (
                    <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                      <Check size={14} className="animate-bounce" />
                      Status Updated Successfully
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {booking.status === 'pending' && (
                        <button
                          disabled={actionLoading}
                          onClick={() => handleStatusUpdate('ongoing')}
                          className="w-full py-3 bg-accent text-zinc-950 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-accent/90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {actionLoading ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                          Check-In & Start Session
                        </button>
                      )}

                      {booking.status === 'ongoing' && (
                        <button
                          disabled={actionLoading}
                          onClick={() => handleStatusUpdate('completed')}
                          className="w-full py-3 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {actionLoading ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                          Complete & Settle Bill
                        </button>
                      )}

                      {booking.status === 'completed' && (
                        <div className="text-center py-2 text-[9px] text-zinc-500 font-bold uppercase tracking-widest bg-zinc-950/60 border border-zinc-800/40 rounded-xl">
                          ✓ This Booking is fully completed.
                        </div>
                      )}

                      <button
                        onClick={handleReset}
                        className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-slate-200 border border-zinc-800 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all"
                      >
                        Cancel & Scan Next
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : scannerError ? (
              <motion.div
                key="scanner-error"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[220px]"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-red-500 tracking-wider">Scan Error</h4>
                  <p className="text-[9px] text-zinc-400 font-medium uppercase mt-2 max-w-[200px] leading-relaxed">
                    {scannerError}
                  </p>
                </div>
                {scannedId && (
                  <button
                    onClick={handleReset}
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-zinc-800"
                  >
                    Reset & Scan Again
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="awaiting-scan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[260px] gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center animate-pulse">
                  <Camera size={16} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Awaiting Scan</h4>
                  <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1 tracking-widest max-w-[180px] leading-relaxed">
                    Ready to scan. Present a client's Booking QR code to initiate validation.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
