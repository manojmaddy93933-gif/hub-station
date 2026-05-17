import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/bookingService';
import { Booking, BookingType, BookingStatus } from '../types';
import { 
  Gamepad2, 
  Car, 
  Trophy, 
  Calendar, 
  Clock, 
  ChevronRight, 
  MapPin, 
  CheckCircle2, 
  Timer,
  AlertCircle,
  Phone,
  Upload,
  Camera,
  FileText,
  Image as ImageIcon,
  QrCode,
  IndianRupee,
  Monitor,
  Coffee,
  User as UserIcon,
  Trash2,
  X
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { RATES, CAR_WASH_HOURS, BADMINTON_HOURS, THEATRE_HOURS, AURA_CAFE_HOURS } from '../constants';
import PaymentQR from '../components/PaymentQR';

const Bookings = () => {
  const { user, profile } = useAuth();
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<BookingType>('game');
  const [historyTab, setHistoryTab] = useState<'active' | 'history'>('active');
  const [loading, setLoading] = useState(false);
  const [mobileNumber, setMobileNumber] = useState(profile?.mobileNumber || '');
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [resourceId, setResourceId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [showQR, setShowQR] = useState<string | null>(null);
  const [showPaymentQR, setShowPaymentQR] = useState<string | null>(null);

  const generateTimeSlots = (open: string, close: string) => {
    const slots = [];
    let current = parseInt(open.split(':')[0]);
    const end = parseInt(close.split(':')[0]);
    
    for (let h = current; h < end; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  useEffect(() => {
    if (user) {
      const unsubscribe = bookingService.subscribeToUserBookings(user.uid, setMyBookings);
      return () => unsubscribe();
    }
  }, [user]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) { // ~0.8MB limit for Firestore doc safety
      alert('Image too large. Please select an image under 800KB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setVehiclePhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let price = 0;
      let resourceName = '';

      if (activeTab === 'game') {
        const game = Object.values(RATES.GAMES).find(g => g.name === resourceId);
        price = game?.rate || 0;
        resourceName = resourceId;
      } else if (activeTab === 'carWash') {
        const wash = RATES.CAR_WASH.find(w => w.type === resourceId);
        price = wash?.price || 0;
        resourceName = resourceId;
      } else if (activeTab === 'badminton') {
        price = resourceId === '2 Hours' ? RATES.BADMINTON.rate2h : RATES.BADMINTON.rate1h;
        resourceName = `Badminton Court (${resourceId})`;
      } else if (activeTab === 'theatre') {
        if (resourceId === '1 Hour') price = RATES.THEATRE.rate1h;
        else if (resourceId === '2 Hours') price = RATES.THEATRE.rate2h;
        else if (resourceId === 'Half Day (4h)') price = RATES.THEATRE.halfDay;
        resourceName = `Birthday Theatre (${resourceId})`;
      } else if (activeTab === 'cafe') {
        price = RATES.CAFE.tableBooking;
        resourceName = `AURA Cafe Table (${resourceId})`;
      }

      if (isStudent && activeTab === 'theatre') {
        price = Math.floor(price * 0.9);
      }

      const bookingData: any = {
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || 'Guest',
        userPhone: mobileNumber,
        type: activeTab,
        resourceId,
        resourceName,
        date,
        startTime,
        endTime: '', // Calculated on backend or simple offset
        duration: activeTab === 'badminton' ? (resourceId === '2 Hours' ? 2 : 1) : 
                  activeTab === 'theatre' ? (resourceId === 'Half Day (4h)' ? 4 : (resourceId === '2 Hours' ? 2 : 1)) : 
                  activeTab === 'cafe' ? 1 : 1,
        status: 'pending',
        price,
        notes: notes.trim(),
        createdAt: Date.now(),
      };

      if (activeTab === 'carWash') {
        bookingData.vehicleNumber = vehicleNumber;
        bookingData.vehicleMake = vehicleMake;
        bookingData.vehicleModel = vehicleModel;
        bookingData.vehicleYear = vehicleYear;
        if (vehiclePhotoUrl) bookingData.vehiclePhotoUrl = vehiclePhotoUrl;
      }

      if (isStudent) {
        bookingData.isStudent = true;
        bookingData.notes = `[STUDENT DISCOUNT 10% APPLIED] ${notes.trim()}`;
      }

      await bookingService.createBooking(bookingData as Omit<Booking, 'id'>);
      alert('Booking successful!');
      setPolicyAccepted(false);
      setIsStudent(false);
      setResourceId('');
      setVehicleNumber('');
      setVehicleMake('');
      setVehicleModel('');
      setVehicleYear('');
      setVehiclePhotoUrl(null);
      setNotes('');
    } catch (error) {
      console.error(error);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user || isClearing) return;
    if (!window.confirm('Are you sure you want to clear your booking history? This cannot be undone.')) return;

    setIsClearing(true);
    try {
      await bookingService.clearUserHistory(user.uid, myBookings);
    } catch (error) {
      console.error(error);
    } finally {
      setIsClearing(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialogId) return;
    try {
      await bookingService.deleteBooking(deleteDialogId);
      setDeleteDialogId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'ongoing': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'completed': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default: return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    }
  };

  const renderStatusTracking = (booking: Booking) => {
    if (booking.status !== 'ongoing') return null;

    return (
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-4 p-4 bg-zinc-950/50 rounded-2xl border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-accent font-black text-[10px] tracking-widest uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            LIVE TRACKER
          </div>
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
            {new Date(booking.tracking?.lastUpdated || booking.createdAt).toLocaleTimeString()}
          </span>
        </div>
        
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-[10px] font-black inline-block py-1 px-3 uppercase rounded-full text-blue-400 bg-blue-400/10 tracking-widest">
                {booking.tracking?.statusUpdate || 'Processing...'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black inline-block text-blue-400 tracking-widest opacity-60">
                ACTIVE
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-1.5 mb-4 text-xs flex rounded bg-zinc-800">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '68%' }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
          <MapPin size={10} />
          <span>Hub Location: {booking.bay || 'Station Area'}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* User Profile Header */}
      <div className="lg:col-span-12 mb-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-800 shadow-2xl flex flex-col md:flex-row items-center gap-8"
        >
          <div className="relative">
            <div className="w-24 h-24 bg-zinc-950 rounded-[2rem] border-2 border-accent/20 flex items-center justify-center overflow-hidden">
               {user?.photoURL ? (
                 <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <UserIcon size={40} className="text-zinc-700" />
               )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent rounded-xl flex items-center justify-center text-zinc-950 border-4 border-zinc-900">
              <CheckCircle2 size={14} />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-black text-slate-100 uppercase tracking-tighter italic">
              {profile?.displayName || user?.displayName || 'Hub Member'}
            </h1>
            <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest mt-1">
              {user?.email}
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
              <div className="px-4 py-2 bg-zinc-950 rounded-xl border border-zinc-800">
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total Reservations</p>
                <p className="text-lg font-black text-slate-100 italic">{myBookings.length}</p>
              </div>
              <div className="px-4 py-2 bg-zinc-950 rounded-xl border border-zinc-800">
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Member Since</p>
                <p className="text-lg font-black text-slate-100 italic">2026</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Booking Form */}
      <div className="lg:col-span-5">
        <div className="bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-800 shadow-2xl">
          <h2 className="text-2xl font-bold mb-8 uppercase tracking-tighter text-slate-100">Reserve Service</h2>
          
          <div className="flex gap-2 p-1 bg-zinc-950 rounded-2xl mb-8 border border-zinc-800/50 overflow-x-auto relative">
            {(['game', 'carWash', 'badminton', 'theatre', 'cafe'] as BookingType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setResourceId('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap relative z-10 ${
                  activeTab === tab ? 'text-zinc-950' : 'text-zinc-500 hover:text-slate-300'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabBadge"
                    className="absolute inset-0 bg-accent rounded-xl z-[-1]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tab === 'game' && <Gamepad2 size={14} />}
                {tab === 'carWash' && <Car size={14} />}
                {tab === 'badminton' && <Trophy size={14} />}
                {tab === 'theatre' && <Monitor size={14} />}
                {tab === 'cafe' && <Coffee size={14} />}
                {tab === 'carWash' ? 'Luxe Detailing' : tab.replace(/([A-Z])/g, ' $1')}
              </button>
            ))}
          </div>

          <form onSubmit={handleBooking} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Selected Service</label>
              <select 
                required
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                className="input-field"
              >
                <option value="">Select an option</option>
                {activeTab === 'game' && Object.values(RATES.GAMES).map(g => (
                  <option key={g.name} value={g.name}>
                    {g.name} (Only {g.tables} available) {g.rate > 0 ? `- ₹${g.rate} for 1 hour (Pre-booking)` : ''}
                  </option>
                ))}
                {activeTab === 'carWash' && RATES.CAR_WASH.map(w => (
                  <option key={w.type} value={w.type}>{w.type} (₹{w.price})</option>
                ))}
                {activeTab === 'badminton' && (
                  <>
                    <option value="1 Hour">1 Hour (₹{RATES.BADMINTON.rate1h})</option>
                    <option value="2 Hours">2 Hours (₹{RATES.BADMINTON.rate2h})</option>
                  </>
                )}
                {activeTab === 'theatre' && (
                  <>
                    <option value="1 Hour">1 Hour (₹{RATES.THEATRE.rate1h})</option>
                    <option value="2 Hours">2 Hours (₹{RATES.THEATRE.rate2h})</option>
                    <option value="Half Day (4h)">Half Day (4h) (₹{RATES.THEATRE.halfDay})</option>
                  </>
                )}
                {activeTab === 'cafe' && (
                  <>
                    <option value="Regular Table">Regular Table {RATES.CAFE.tableBooking > 0 ? `(₹${RATES.CAFE.tableBooking})` : '(Free)'}</option>
                    <option value="Booth Seating">Booth Seating {RATES.CAFE.tableBooking > 0 ? `(₹${RATES.CAFE.tableBooking})` : '(Free)'}</option>
                    <option value="Outdoor Terrace">Outdoor Terrace {RATES.CAFE.tableBooking > 0 ? `(₹${RATES.CAFE.tableBooking})` : '(Free)'}</option>
                  </>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 text-zinc-600" size={18} />
                  <input 
                    type="date" 
                    required
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="input-field pl-12"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">
                  Time Slot
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-3.5 text-zinc-600 z-10" size={18} />
                  {activeTab === 'theatre' || activeTab === 'badminton' || activeTab === 'cafe' ? (
                    <select 
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="input-field pl-12"
                    >
                      <option value="">Select slot</option>
                      {(activeTab === 'theatre' ? THEATRE_HOURS : activeTab === 'cafe' ? [AURA_CAFE_HOURS] : BADMINTON_HOURS).map((range, idx) => (
                        <optgroup key={idx} label={activeTab === 'cafe' ? 'Available Hours' : `Session ${idx + 1}`}>
                          {generateTimeSlots(range.open, range.close).map(slot => (
                            <option key={slot} value={slot}>
                              {parseInt(slot.split(':')[0]) > 12 
                                ? `${parseInt(slot.split(':')[0]) - 12}:00 PM` 
                                : parseInt(slot.split(':')[0]) === 12 
                                  ? '12:00 PM' 
                                  : `${slot} AM`}
                            </option>
                          ))}
                         </optgroup>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="time" 
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="input-field pl-12"
                    />
                  )}
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'carWash' && (
                <motion.div 
                  key="carWashForm"
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "circOut" }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Vehicle No.</label>
                      <input 
                        type="text" 
                        placeholder="TS XX XX XXXX"
                        required
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Year</label>
                      <input 
                        type="number" 
                        placeholder="2024"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        required
                        value={vehicleYear}
                        onChange={(e) => setVehicleYear(e.target.value)}
                        className="input-field" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Make</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Tesla"
                        required
                        value={vehicleMake}
                        onChange={(e) => setVehicleMake(e.target.value)}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Model</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Model 3"
                        required
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="input-field" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Vehicle Photo</label>
                    <div className="space-y-4">
                      <div className="relative group h-20">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full h-full rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 flex items-center justify-center gap-3 transition-all group-hover:border-accent/40 group-hover:bg-zinc-950">
                          <div className="p-2 bg-zinc-900 rounded-full text-zinc-600 group-hover:text-amber-500 transition-colors">
                            <Upload size={18} />
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Upload Vehicle Image</p>
                            <p className="text-[8px] text-zinc-600 mt-1 uppercase">JPG or PNG (Max 800KB)</p>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {vehiclePhotoUrl && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative group aspect-video rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 p-2"
                          >
                            <img src={vehiclePhotoUrl} alt="Preview" className="w-full h-full object-cover rounded-[1.25rem]" />
                            <div className="absolute inset-2 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 rounded-[1.25rem]">
                              <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-1">Preview Selection</p>
                              <p className="text-xs font-bold text-white uppercase italic">
                                {vehicleMake || vehicleModel ? `${vehicleMake} ${vehicleModel}` : 'Vehicle Evidence'} {vehicleYear ? `'${vehicleYear.slice(-2)}` : ''}
                              </p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setVehiclePhotoUrl(null)}
                              className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-zinc-400 hover:text-white transition-all border border-white/10"
                            >
                              <AlertCircle size={14} className="rotate-45" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Universal Notes Field */}
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Special Instructions / Notes</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-zinc-600" size={18} />
                <textarea 
                  placeholder={activeTab === 'carWash' 
                    ? "List any existing scratches, dents, or specific cleaning focus..." 
                    : "Any special requests or details we should know about?"}
                  className="input-field pl-12 py-4 h-24 resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-1">Contact Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 text-zinc-600" size={18} />
                <input 
                  type="tel" 
                  placeholder="Your mobile number"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="input-field pl-12" 
                />
              </div>
            </div>

            {/* Student Discount Toggle */}
            {activeTab === 'theatre' && (
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-accent">
                  <UserIcon size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Student Discount</span>
                </div>
                <div className="bg-accent/10 border border-accent/20 px-2 py-0.5 rounded text-[8px] font-black text-accent uppercase tracking-widest">
                  -10% FLAT
                </div>
              </div>
              <p className="text-[9px] text-zinc-600 uppercase font-medium tracking-wider mb-4 leading-relaxed">
                Apply student discount. Valid ID card must be presented at the hub counter during check-in.
              </p>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={isStudent}
                    onChange={(e) => setIsStudent(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center transition-all peer-checked:bg-accent peer-checked:border-accent">
                    <CheckCircle2 size={12} className="text-zinc-950 opacity-0 peer-checked:opacity-100" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 group-hover:text-slate-200 transition-colors uppercase tracking-tight">
                  I am a student (Apply 10% Discount)
                </span>
              </label>
            </div>
            )}

            {/* Cancellation Policy */}
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 text-amber-500">
                <AlertCircle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Cancellation Policy</span>
              </div>
              <ul className="text-[9px] text-zinc-500 space-y-1 mb-4 font-medium uppercase tracking-wider list-disc pl-3">
                <li>Full refund for cancellations made at least 2 hours before the scheduled time.</li>
                <li>Cancellations within 2 hours or no-shows are non-refundable.</li>
                <li>Rescheduling is subject to availability and hub discretion.</li>
              </ul>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    required
                    checked={policyAccepted}
                    onChange={(e) => setPolicyAccepted(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center transition-all peer-checked:bg-accent peer-checked:border-accent">
                    <CheckCircle2 size={12} className="text-zinc-950 opacity-0 peer-checked:opacity-100" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 group-hover:text-slate-200 transition-colors uppercase tracking-tight">
                  I acknowledge the cancellation policy
                </span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading || !policyAccepted}
              className="w-full btn-primary mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
              ) : (
                <>Confirm Reservation <ChevronRight size={18} /></>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Bookings List */}
      <div className="lg:col-span-7">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold uppercase tracking-tighter text-slate-100">
            {historyTab === 'active' ? 'Active Sessions' : 'Booking History'}
          </h2>
          <div className="flex items-center gap-4">
            {historyTab === 'history' && myBookings.some(b => ['completed', 'cancelled'].includes(b.status)) && (
              <button
                onClick={handleClearHistory}
                disabled={isClearing}
                className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors py-2 px-3 rounded-xl hover:bg-red-500/10 font-black text-[9px] uppercase tracking-widest disabled:opacity-50"
              >
                {isClearing ? 'Clearing...' : (
                  <>
                    <Trash2 size={12} />
                    Clear History
                  </>
                )}
              </button>
            )}
            <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800/50 relative">
            {(['active', 'history'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setHistoryTab(t)}
                className={`py-1.5 px-6 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all relative z-10 ${
                  historyTab === t ? 'text-accent font-black' : 'text-zinc-500'
                }`}
              >
                {historyTab === t && (
                  <motion.div
                    layoutId="activeHistoryToggle"
                    className="absolute inset-0 bg-zinc-800 rounded-lg z-[-1]"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
        
        {myBookings.filter(b => 
          historyTab === 'active' 
            ? ['pending', 'ongoing'].includes(b.status)
            : ['completed', 'cancelled'].includes(b.status)
        ).length === 0 ? (
          <div className="bg-zinc-900 rounded-[2.5rem] p-12 text-center border border-dashed border-zinc-800">
            <div className="w-16 h-16 bg-zinc-950 text-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} />
            </div>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
              {historyTab === 'active' ? 'No active sessions.' : 'No past history.'}
            </p>
          </div>
        ) : (
          <motion.div layout className="space-y-4">
            <AnimatePresence mode="popLayout">
              {myBookings
                .filter(b => 
                  historyTab === 'active' 
                    ? ['pending', 'ongoing'].includes(b.status)
                    : ['completed', 'cancelled'].includes(b.status)
                )
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((booking) => (
                <motion.div 
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-900 rounded-[2rem] p-6 shadow-sm border border-zinc-800 hover:border-accent/40 transition-all"
                >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      booking.type === 'game' ? 'bg-blue-500/10 text-blue-400' :
                      booking.type === 'carWash' ? 'bg-emerald-500/10 text-emerald-400' : 
                      booking.type === 'badminton' ? 'bg-indigo-500/10 text-indigo-400' : 
                      booking.type === 'cafe' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {booking.type === 'game' ? <Gamepad2 size={24} /> :
                       booking.type === 'carWash' ? <Car size={24} /> : 
                       booking.type === 'badminton' ? <Trophy size={24} /> : 
                       booking.type === 'cafe' ? <Coffee size={24} /> : <Monitor size={24} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-100 italic uppercase tracking-tight">{booking.resourceName}</h4>
                      <div className="flex items-center gap-4 mt-1 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {booking.date}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {booking.startTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-xl italic text-slate-100">
                        {booking.price === 0 ? 'Free' : `₹${booking.price}`}
                      </span>
                      {historyTab === 'history' && (
                        <button 
                          onClick={() => setDeleteDialogId(booking.id!)}
                          className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR Code Actions */}
                {!['completed', 'cancelled'].includes(booking.status) && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        setShowQR(showQR === booking.id ? null : booking.id!);
                        setShowPaymentQR(null);
                      }}
                      className="flex-1 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center gap-3 hover:border-accent/40 transition-all group/qr"
                    >
                      <QrCode size={18} className="text-zinc-600 group-hover/qr:text-accent transition-colors" />
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover/qr:text-slate-100">
                        {showQR === booking.id ? 'Hide ID' : 'Check-in QR'}
                      </span>
                    </button>

                    <button 
                      onClick={() => {
                        setShowPaymentQR(showPaymentQR === booking.id ? null : booking.id!);
                        setShowQR(null);
                      }}
                      className="flex-1 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center gap-3 hover:border-green-500/40 transition-all group/pay"
                    >
                      <IndianRupee size={18} className="text-zinc-600 group-hover/pay:text-green-500 transition-colors" />
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover/pay:text-slate-100">
                        {showPaymentQR === booking.id ? 'Hide Pay' : 'Scan & Pay'}
                      </span>
                    </button>
                  </div>
                )}

                <AnimatePresence>
                  {showQR === booking.id && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, height: 0 }}
                      animate={{ opacity: 1, scale: 1, height: 'auto' }}
                      exit={{ opacity: 0, scale: 0.95, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-8 bg-white rounded-3xl flex flex-col items-center justify-center shadow-2xl">
                          <QRCodeSVG 
                            value={booking.id!} 
                            size={200}
                            level="H"
                            includeMargin={true}
                          />
                          <p className="mt-6 text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em] text-center">
                            Scan at the hub counter to check-in
                          </p>
                          <div className="mt-2 text-[8px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                            Booking ID: {booking.id?.slice(-8).toUpperCase()}
                          </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {showPaymentQR === booking.id && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, height: 0 }}
                      animate={{ opacity: 1, scale: 1, height: 'auto' }}
                      exit={{ opacity: 0, scale: 0.95, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4">
                        <PaymentQR amount={booking.price} bookingId={booking.id!} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {renderStatusTracking(booking)}

                 {booking.vehicleNumber && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">
                        <div className="flex flex-col">
                          <span className="text-zinc-600 mb-1">Vehicle NO.</span>
                          <span className="text-slate-300">{booking.vehicleNumber}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-zinc-600 mb-1">Make</span>
                          <span className="text-slate-300">{booking.vehicleMake || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-zinc-600 mb-1">Model</span>
                          <span className="text-slate-300">{booking.vehicleModel}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-zinc-600 mb-1">Year</span>
                          <span className="text-slate-300">{booking.vehicleYear || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                 )}

                {booking.notes && (
                  <div className="mt-4 p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2 text-zinc-500">
                      <FileText size={12} />
                      <span className="text-[8px] font-black uppercase tracking-widest">Inspection Notes</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">{booking.notes}</p>
                  </div>
                )}

                {booking.vehiclePhotoUrl && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800">
                     <img 
                       src={booking.vehiclePhotoUrl} 
                       alt="Vehicle Evidence" 
                       className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                       onClick={() => window.open(booking.vehiclePhotoUrl, '_blank')}
                     />
                  </div>
                )}
              </motion.div>
            ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteDialogId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteDialogId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-100 text-center mb-2 uppercase tracking-tight">Delete Booking</h3>
              <p className="text-zinc-400 text-center text-xs mb-8">
                Are you sure you want to permanently delete this booking from your history? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteDialogId(null)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Bookings;
