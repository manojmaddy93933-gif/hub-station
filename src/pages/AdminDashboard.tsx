import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { bookingService } from '../services/bookingService';
import { Booking, BookingStatus } from '../types';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PlayCircle, 
  Search,
  Filter,
  MapPin,
  ChevronDown,
  QrCode,
  IndianRupee,
  Lock,
  ArrowRight,
  ShieldAlert,
  CreditCard,
  Banknote,
  Smartphone,
  Phone,
  Mail,
  User,
  Info,
  Bell,
  BellRing,
  Trash2,
  Gamepad2,
  Car,
  Trophy,
  Monitor,
  Coffee,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PaymentQR from '../components/PaymentQR';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'new' | 'update' | 'cancel';
  time: number;
}

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

const getServiceDisplayName = (type: string) => {
  const types: Record<string, string> = {
    'game': 'Game',
    'carWash': 'Car Wash',
    'badminton': 'Badminton',
    'theatre': 'Theatre',
    'cafe': 'Cafe'
  };
  return types[type] || type;
};

const AdminDashboard = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updateTrackingId, setUpdateTrackingId] = useState<string | null>(null);
  const [assignBayBookingId, setAssignBayBookingId] = useState<string | null>(null);
  const [trackingNote, setTrackingNote] = useState('');
  const [showAdminPaymentQR, setShowAdminPaymentQR] = useState<{ amount?: number; bookingId?: string } | boolean>(false);
  const [successAnimationId, setSuccessAnimationId] = useState<string | null>(null);
  
  // Security State
  const [isVerified, setIsVerified] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'last7' | 'custom'>('all');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [activeView, setActiveView] = useState<'bookings' | 'payments'>('bookings');
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const isFirstLoad = React.useRef(true);

  useEffect(() => {
    const unsubscribe = bookingService.subscribeToAllBookings((data, changes) => {
      if (!isVerified) return;

      setBookings(data);

      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
      }

      if (changes) {
        changes.forEach((change: any) => {
          const booking = { id: change.doc.id, ...change.doc.data() } as Booking;
          
          if (change.type === 'added') {
            addNotification({
              id: `new-${booking.id}-${Date.now()}`,
              title: `New Booking: ${booking.userName} - ${getServiceDisplayName(booking.type)}`,
              message: `Reserved ${booking.resourceName}`,
              type: 'new',
              time: Date.now()
            });
          } else if (change.type === 'modified') {
            addNotification({
              id: `update-${booking.id}-${Date.now()}`,
              title: 'Status Updated',
              message: `${booking.userName}'s ${booking.type} is now ${booking.status}`,
              type: 'update',
              time: Date.now()
            });
          }
        });
      }
    });
    return () => unsubscribe();
  }, [isVerified]);

  const addNotification = (notif: Notification) => {
    playNotificationSound();
    
    setNotifications(prev => [notif, ...prev].slice(0, 5));
    setNotificationHistory(prev => [notif, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    }, 5000);
  };

  const handleDeleteBooking = async (id: string) => {
    if (!window.confirm('Delete this booking record permanently?')) return;
    try {
      await bookingService.deleteBooking(id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClearHistory = async () => {
    try {
      const historyBookings = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));
      const promises = historyBookings.map(b => bookingService.deleteBooking(b.id!));
      await Promise.all(promises);
      setIsClearHistoryModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      if (response.ok) {
        setIsVerified(true);
        localStorage.setItem('office_session', 'active_' + Date.now());
      } else {
        setError('Incorrect security passcode');
      }
    } catch (err) {
      setError('Connection error. Try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Optional: Check for existing session
  useEffect(() => {
    const session = localStorage.getItem('office_session');
    if (session && session.startsWith('active_')) {
      const timestamp = parseInt(session.split('_')[1]);
      // Session valid for 1 hour
      if (Date.now() - timestamp < 3600000) {
        setIsVerified(true);
      } else {
        localStorage.removeItem('office_session');
      }
    }
  }, []);

  if (!isVerified) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-zinc-900 rounded-[3rem] p-10 border border-zinc-800 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-accent/30" />
          
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 bg-zinc-950 rounded-[2rem] border border-zinc-800 flex items-center justify-center text-accent mb-6 shadow-inner ring-4 ring-zinc-900/50">
              <Lock size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-100 uppercase tracking-tighter italic mb-2">Office Access</h2>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black">Authorized Staff Personnel Only</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Security Passcode</label>
              <input 
                type="password"
                placeholder="••••"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl py-5 px-6 text-2xl font-black tracking-[0.5em] text-center text-slate-100 focus:border-accent/50 focus:ring-0 transition-all placeholder:text-zinc-800"
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500"
              >
                <ShieldAlert size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isVerifying || !passcode}
              className={`w-full py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all ${
                isVerifying || !passcode 
                  ? 'bg-zinc-800 text-zinc-600 grayscale cursor-not-allowed' 
                  : 'bg-accent text-zinc-950 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <span className="text-[12px] font-black uppercase tracking-widest">Verify & Enter</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-8 text-center text-[8px] font-bold text-zinc-600 uppercase tracking-widest leading-loose">
            Security logs are recorded. <br />
            Unauthorized access attempts are reported.
          </p>
        </motion.div>
      </div>
    );
  }

  const handleStatusUpdate = async (id: string, status: BookingStatus, extraData?: any) => {
    if (status === 'completed') {
      setSuccessAnimationId(id);
      await bookingService.updateBookingStatus(id, status, { 
        ...extraData,
        paymentStatus: extraData?.paymentStatus || 'paid' // Default to paid on completion if not specified
      });
      setTimeout(() => setSuccessAnimationId(null), 1500);
    } else {
      await bookingService.updateBookingStatus(id, status, extraData);
    }
  };

  const handlePaymentUpdate = async (id: string, paymentStatus: 'unpaid' | 'pending' | 'paid', paymentMethod?: 'upi' | 'cash' | 'card') => {
    await bookingService.updateBookingStatus(id, bookings.find(b => b.id === id)?.status || 'pending', { 
      paymentStatus,
      paymentMethod 
    });
  };

  const handleStartCarWash = async (bookingId: string, bay: string) => {
    await handleStatusUpdate(bookingId, 'ongoing', { 
      bay,
      tracking: {
        statusUpdate: `Car is in ${bay}`,
        lastUpdated: Date.now()
      }
    });
    setAssignBayBookingId(null);
  };

  const handleTrackingUpdate = async (id: string) => {
    await bookingService.updateBookingStatus(id, 'ongoing', {
      tracking: {
        statusUpdate: trackingNote,
        lastUpdated: Date.now()
      }
    });
    setUpdateTrackingId(null);
    setTrackingNote('');
  };

  const filteredBookings = bookings.filter(b => {
    const matchesFilter = filter === 'all' || b.status === filter;
    
    let matchesDate = true;
    const today = new Date();
    const tzoffset = today.getTimezoneOffset() * 60000; 
    const localToday = (new Date(today.getTime() - tzoffset)).toISOString().split('T')[0];
    
    if (dateFilter === 'today') {
      matchesDate = b.date === localToday;
    } else if (dateFilter === 'last7') {
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const localSevenDaysAgo = (new Date(sevenDaysAgo.getTime() - tzoffset)).toISOString().split('T')[0];
      matchesDate = b.date >= localSevenDaysAgo && b.date <= localToday;
    } else if (dateFilter === 'custom') {
      if (customRange.start && customRange.end) {
        matchesDate = b.date >= customRange.start && b.date <= customRange.end;
      } else if (customRange.start) {
        matchesDate = b.date >= customRange.start;
      } else if (customRange.end) {
        matchesDate = b.date <= customRange.end;
      }
    }

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      b.userName.toLowerCase().includes(searchLower) || 
      b.resourceName.toLowerCase().includes(searchLower) ||
      (b.id || '').toLowerCase().includes(searchLower) ||
      (b.userPhone || '').toLowerCase().includes(searchLower) ||
      (b.userEmail || '').toLowerCase().includes(searchLower);
      
    return matchesFilter && matchesDate && matchesSearch;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    ongoing: bookings.filter(b => b.status === 'ongoing').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Activity Feed Drawer */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowNotifications(false);
                setUnreadCount(0);
              }}
              className="fixed inset-0 bg-zinc-950/80 z-[90] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-900 border-l border-zinc-800 z-[100] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-100 uppercase tracking-tighter italic">Activity Feed</h3>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Real-time alerts</p>
                </div>
                <button 
                  onClick={() => {
                    setShowNotifications(false);
                    setUnreadCount(0);
                  }}
                  className="p-2 text-zinc-500 hover:text-slate-100 transition-colors bg-zinc-800/50 rounded-full"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notificationHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                    <BellRing size={48} className="mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">No recent activity</p>
                  </div>
                ) : (
                  notificationHistory.map((notif) => (
                    <div key={notif.id} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        notif.type === 'new' ? 'bg-blue-500/20 text-blue-400' :
                        notif.type === 'cancel' ? 'bg-red-500/20 text-red-500' :
                        'bg-amber-500/20 text-amber-500'
                      }`}>
                        {notif.type === 'new' ? <BellRing size={16} /> : <Bell size={16} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-100 mb-1">{notif.title}</p>
                          <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest whitespace-nowrap">
                            {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-zinc-400 leading-relaxed">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Real-time Notifications Popups */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-3 w-[22rem] pointer-events-none">
        <AnimatePresence mode="popLayout">
          {notifications.map((notif) => (
            <motion.div
              layout
              key={notif.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`relative p-4 rounded-2xl border pointer-events-auto backdrop-blur-xl flex gap-4 overflow-hidden group ${
                notif.type === 'new' ? 'bg-blue-950/90 border-blue-900/50 shadow-[0_8px_30px_-5px_rgba(59,130,246,0.3)]' :
                notif.type === 'cancel' ? 'bg-red-950/90 border-red-900/50 shadow-[0_8px_30px_-5px_rgba(239,68,68,0.3)]' :
                'bg-amber-950/90 border-amber-900/50 shadow-[0_8px_30px_-5px_rgba(245,158,11,0.3)]'
              }`}
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${
                notif.type === 'new' ? 'bg-blue-500' :
                notif.type === 'cancel' ? 'bg-red-500' :
                'bg-amber-500'
              }`} />
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                notif.type === 'new' ? 'bg-blue-500/20 text-blue-400' :
                notif.type === 'cancel' ? 'bg-red-500/20 text-red-500' :
                'bg-amber-500/20 text-amber-500'
              }`}>
                {notif.type === 'new' ? <BellRing size={20} /> : <Bell size={20} />}
              </div>
              <div className="flex-1 pr-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-100 mb-1">{notif.title}</p>
                <p className="text-xs font-medium text-zinc-300 leading-relaxed">{notif.message}</p>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block" />
                  Just Now
                </p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="absolute top-3 right-3 text-zinc-500 hover:text-white p-1.5 rounded-full hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-bold mb-2 uppercase tracking-tighter text-slate-100 italic">Office App</h2>
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest leading-tight">Admin Control Panel</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadCount(0);
            }}
            className={`relative flex items-center justify-center w-14 h-14 rounded-[2rem] border transition-all shadow-2xl ${
              showNotifications ? 'bg-accent border-accent text-zinc-950' : 'bg-zinc-900 border-zinc-800 text-slate-100 font-black hover:border-accent/40'
            }`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-zinc-900 shadow-lg">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <Link 
            to="/qrhub"
            className="flex items-center gap-3 px-6 py-4 rounded-[2rem] border border-zinc-800 bg-zinc-900 text-slate-100 transition-all shadow-2xl hover:border-accent/40"
          >
            <QrCode size={20} />
            <span className="text-[10px] uppercase tracking-widest font-black">Hub Flyer</span>
          </Link>

          <button 
            onClick={() => setShowAdminPaymentQR(!showAdminPaymentQR)}
            className={`flex items-center gap-3 px-6 py-4 rounded-[2rem] border transition-all shadow-2xl ${
              showAdminPaymentQR ? 'bg-green-500 border-green-400 text-white' : 'bg-zinc-900 border-zinc-800 text-slate-100 font-black'
            }`}
          >
            <IndianRupee size={20} />
            <span className="text-[10px] uppercase tracking-widest font-black">
              {showAdminPaymentQR ? 'Hide Payment' : 'Payment QR'}
            </span>
          </button>

          <div className="bg-zinc-900 px-6 py-4 rounded-[2rem] border border-zinc-800 flex items-center gap-6 shadow-2xl">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-1">Queue</p>
              <p className="text-2xl font-black text-amber-500 leading-none">{stats.pending}</p>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-1">Active</p>
              <p className="text-2xl font-black text-blue-500 leading-none">{stats.ongoing}</p>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-1">Total</p>
              <p className="text-2xl font-black text-slate-100 leading-none">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-8 border-b border-zinc-800">
        <button 
          onClick={() => setActiveView('bookings')}
          className={`pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all ${activeView === 'bookings' ? 'text-accent border-b-2 border-accent' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          Bookings
        </button>
        <button 
          onClick={() => setActiveView('payments')}
          className={`pb-4 px-6 text-sm font-black uppercase tracking-widest transition-all ${activeView === 'payments' ? 'text-accent border-b-2 border-accent' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          Payment History
        </button>
      </div>

      <AnimatePresence>
        {!!showAdminPaymentQR && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-12 flex justify-center"
          >
            <div className="max-w-sm w-full">
              <PaymentQR 
                amount={typeof showAdminPaymentQR === 'object' ? showAdminPaymentQR.amount : undefined} 
                bookingId={typeof showAdminPaymentQR === 'object' ? showAdminPaymentQR.bookingId : undefined} 
              />
              
              {typeof showAdminPaymentQR === 'object' && showAdminPaymentQR.amount && (
                <div className="mt-4 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-center">
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Amount Due</p>
                   <p className="text-xl font-black text-slate-100 italic">₹{showAdminPaymentQR.amount}</p>
                </div>
              )}

              <button 
                onClick={() => setShowAdminPaymentQR(false)}
                className="w-full mt-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-slate-100 transition-colors"
                id="close-payment-qr"
              >
                Close Payment Display
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isClearHistoryModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsClearHistoryModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">Clear History?</h3>
              <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                This action will permanently delete all completed and cancelled bookings. This process cannot be undone. Are you absolutely sure?
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setIsClearHistoryModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-800 text-zinc-400 font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearHistory}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-600 transition-colors"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {activeView === 'bookings' ? (
        <>
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-zinc-600" size={18} />
            <input 
              type="text" 
              placeholder="Search bookings..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          <div className="flex gap-2 p-1 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-x-auto">
            {(['all', 'today', 'last7', 'custom'] as const).map((df) => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  dateFilter === df ? 'bg-zinc-800 text-slate-100' : 'hover:bg-zinc-800 border-transparent text-zinc-500'
                }`}
              >
                {df === 'last7' ? 'Last 7 Days' : df}
              </button>
            ))}
          </div>
        </div>

        {dateFilter === 'custom' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex gap-4 items-center overflow-hidden"
          >
            <input 
              type="date"
              className="input-field max-w-[200px]"
              value={customRange.start}
              onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
            />
            <span className="text-zinc-500 font-bold uppercase text-[10px]">TO</span>
            <input 
              type="date"
              className="input-field max-w-[200px]"
              value={customRange.end}
              onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
            />
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2 p-1 bg-zinc-900 rounded-2xl border border-zinc-800 flex-1 overflow-x-auto">
            {(['all', 'pending', 'ongoing', 'completed', 'cancelled'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s as BookingStatus | 'all')}
                className={`whitespace-nowrap flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === s ? 'bg-accent text-zinc-950' : 'hover:bg-zinc-800 text-zinc-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {(filter === 'completed' || filter === 'all') && bookings.some(b => ['completed', 'cancelled'].includes(b.status)) && (
            <button 
              onClick={() => setIsClearHistoryModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-[2rem] border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest shrink-0"
            >
              <Trash2 size={16} />
              Clear History
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredBookings.map((booking) => (
          <motion.div 
            key={booking.id}
            layout
            className="bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-800 group hover:border-accent/30 transition-all shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-700 group-hover:text-accent group-hover:bg-accent/10 transition-colors">
                  <Users size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-xl text-slate-100 italic">{booking.userName}</h4>
                    <span className="text-[10px] flex items-center gap-1.5 font-black text-amber-500 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 uppercase tracking-widest">
                       {booking.type === 'game' && <Gamepad2 size={12} />}
                       {booking.type === 'carWash' && <Car size={12} />}
                       {booking.type === 'badminton' && <Trophy size={12} />}
                       {booking.type === 'theatre' && <Monitor size={12} />}
                       {booking.type === 'cafe' && <Coffee size={12} />}
                       {getServiceDisplayName(booking.type)}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-widest">
                    {booking.userEmail} {booking.userPhone && `• ${booking.userPhone}`}
                  </p>
                  <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest mb-1">ID: {booking.id}</p>
                  <p className="text-slate-300 font-black uppercase tracking-tight text-sm mb-2">{booking.resourceName}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {booking.bay && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                        <PlayCircle size={10} className="text-blue-400" />
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{booking.bay}</span>
                      </div>
                    )}
                    {booking.paymentStatus === 'paid' ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <CheckCircle2 size={10} className="text-emerald-400" />
                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                          Paid {booking.paymentMethod && `via ${booking.paymentMethod.toUpperCase()}`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full">
                        <IndianRupee size={10} className="text-zinc-500" />
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Unpaid</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 text-right">
                <div className="flex items-center gap-4 mb-2">
                   <div className="flex flex-col items-end">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">Schedule</p>
                      <p className="text-sm font-bold text-slate-400">{booking.date} @ {booking.startTime}</p>
                   </div>
                   <div className={`w-3 h-3 rounded-full animate-pulse ${
                     booking.status === 'pending' ? 'bg-orange-500' : 
                     booking.status === 'ongoing' ? 'bg-blue-500' : 'bg-green-500'
                   }`} />
                </div>
                
                <div className="flex gap-2">
                  {booking.status === 'pending' && (
                    <button 
                      onClick={() => {
                        if (booking.type === 'carWash') {
                          setAssignBayBookingId(booking.id!);
                        } else {
                          handleStatusUpdate(booking.id!, 'ongoing')
                        }
                      }}
                      className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20"
                      title="Start Service"
                    >
                      <PlayCircle size={20} />
                    </button>
                  )}
                  {booking.status === 'ongoing' && (
                    <button 
                      onClick={() => setUpdateTrackingId(booking.id!)}
                      className="p-3 bg-amber-500/10 text-amber-500 rounded-xl hover:bg-accent hover:text-zinc-900 transition-all border border-amber-500/20"
                      title="Update Tracking"
                    >
                      <MapPin size={20} />
                    </button>
                  )}
                  {(booking.status === 'pending' || booking.status === 'ongoing') && (
                    <button 
                      onClick={() => handleStatusUpdate(booking.id!, 'completed')}
                      className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-zinc-900 transition-all border border-emerald-500/20 flex items-center justify-center min-w-[44px]"
                      title="Complete Service"
                    >
                      <AnimatePresence mode="wait">
                        {successAnimationId === booking.id ? (
                          <motion.div
                            key="success"
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1.2, rotate: 0 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                          >
                            <CheckCircle2 size={20} className="fill-emerald-500/20" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="default"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <CheckCircle2 size={20} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  )}
                  <button 
                    onClick={() => handleStatusUpdate(booking.id!, 'cancelled')}
                    className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                    title="Cancel Booking"
                  >
                    <XCircle size={20} />
                  </button>
                  <button 
                    onClick={() => setShowAdminPaymentQR({ amount: booking.price, bookingId: booking.id! })}
                    className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all border border-green-500/20"
                    title="Show Payment QR"
                  >
                    <IndianRupee size={20} />
                  </button>
                  <button 
                    onClick={() => handleDeleteBooking(booking.id!)}
                    className="p-3 bg-red-900/10 text-red-900 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-900/20"
                    title="Delete Record Permanently"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Payment & Customer Info Expansion */}
            <div className="mt-8 pt-8 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Customer Info Card */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} />
                  Customer Intelligence
                </h5>
                <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                      <Mail size={14} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Email Address</p>
                      <p className="text-[11px] font-bold text-slate-300">{booking.userEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                      <Phone size={14} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Mobile Contact</p>
                      <p className="text-[11px] font-bold text-slate-300">{booking.userPhone || 'Not Provided'}</p>
                    </div>
                  </div>
                  {booking.notes && (
                    <div className="flex items-start gap-3 pt-2">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-500/50 mt-1">
                        <Info size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Customer Notes</p>
                        <p className="text-[10px] font-medium text-amber-500/80 leading-relaxed italic">"{booking.notes}"</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Control Card */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                  <CreditCard size={12} />
                  Payment Resolution
                </h5>
                <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-tight">Total Due: {booking.price === 0 ? 'Free' : `₹${booking.price}`}</p>
                    <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                      booking.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'
                    }`}>
                      {booking.paymentStatus || 'UNPAID'}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => handlePaymentUpdate(booking.id!, 'paid', 'upi')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        booking.paymentMethod === 'upi' ? 'bg-accent border-accent text-zinc-950' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      <Smartphone size={16} />
                      <span className="text-[8px] font-black uppercase tracking-widest">UPI</span>
                    </button>
                    <button 
                      onClick={() => handlePaymentUpdate(booking.id!, 'paid', 'cash')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        booking.paymentMethod === 'cash' ? 'bg-green-500 border-green-400 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      <Banknote size={16} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Cash</span>
                    </button>
                    <button 
                      onClick={() => handlePaymentUpdate(booking.id!, 'unpaid')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-red-500/30 font-black`}
                    >
                      <XCircle size={16} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Reset</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>


            {updateTrackingId === booking.id && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-6 bg-zinc-950 rounded-[2rem] flex flex-col md:flex-row gap-4 items-end border border-zinc-800 shadow-xl"
              >
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 px-1">Live Status Note</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Technician is drying the interior..." 
                    className="input-field"
                    value={trackingNote}
                    onChange={(e) => setTrackingNote(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setUpdateTrackingId(null)}
                    className="btn-secondary h-12"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => handleTrackingUpdate(booking.id!)}
                    className="btn-primary h-12"
                  >
                    Publish
                  </button>
                </div>
              </motion.div>
            )}

            {assignBayBookingId === booking.id && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-6 bg-zinc-950 rounded-[2rem] border border-zinc-800 shadow-xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h5 className="text-[12px] font-black text-slate-100 uppercase tracking-widest italic">Select Assignment Bay</h5>
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">Car Wash Station Management</p>
                  </div>
                  <button 
                    onClick={() => setAssignBayBookingId(null)}
                    className="p-2 text-zinc-500 hover:text-slate-100 transition-colors"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['BAY 1', 'BAY 2', 'BAY 3', 'BAY 4'].map((bay) => (
                    <button
                      key={bay}
                      onClick={() => handleStartCarWash(booking.id!, bay)}
                      className="group relative overflow-hidden bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-accent transition-all text-center"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-accent/10 group-hover:bg-accent/50 transition-colors" />
                      <p className="text-[14px] font-black text-slate-100 group-hover:text-accent transition-colors">{bay}</p>
                      <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1">Assign</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      </>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl">
          <h3 className="text-2xl font-black text-slate-100 uppercase tracking-tighter italic mb-6">Payment History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Date</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Booking ID</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Customer</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Amount</th>
                  <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Method</th>
                </tr>
              </thead>
              <tbody>
                {bookings.filter(b => b.paymentStatus === 'paid').map((b) => (
                  <tr key={b.id} className="border-b border-zinc-800/50 group hover:bg-zinc-800/20 transition-colors">
                    <td className="py-4 text-sm font-bold text-slate-300">{b.date}</td>
                    <td className="py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">{b.id}</td>
                    <td className="py-4 text-sm font-bold text-slate-300">{b.userName}</td>
                    <td className="py-4 px-4 text-sm font-black italic text-emerald-500">₹{b.price}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-300">
                        {b.paymentMethod || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
                {bookings.filter(b => b.paymentStatus === 'paid').length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">No payment records found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
