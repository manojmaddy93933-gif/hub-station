import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, logout } from '../services/firebase';
import { Car, Gamepad2, Settings, User as UserIcon, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Navbar = () => {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 glass-card border-b"
    >
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex flex-col">
            <h1 className="font-black text-lg leading-none tracking-tight text-slate-100 uppercase italic">Hub Station</h1>
            <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-500 font-black mt-1">Premium Experience</p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/bookings" className="font-bold text-xs uppercase tracking-widest hover:text-accent transition-colors">Games</Link>
          <Link to="/bookings" className="font-bold text-xs uppercase tracking-widest hover:text-accent transition-colors">Car Wash</Link>
          <Link to="/bookings" className="font-bold text-xs uppercase tracking-widest hover:text-accent transition-colors">Badminton</Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-white/5 transition-colors border border-border"
              >
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full shadow-sm"
                />
                <span className="font-bold text-xs hidden sm:block uppercase tracking-wider">{profile?.displayName?.split(' ')[0]}</span>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-zinc-900 rounded-2xl shadow-2xl border border-border p-2"
                  >
                    <div className="px-4 py-3 border-b border-border mb-2">
                      <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">{profile?.role}</p>
                      <p className="font-bold truncate text-sm">{user.displayName}</p>
                    </div>
                    
                    <Link 
                      to="/bookings" 
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors text-sm"
                    >
                      <Gamepad2 size={16} className="text-zinc-500" />
                      <span className="font-bold text-zinc-300">My Bookings</span>
                    </Link>

                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors text-sm text-blue-400"
                      >
                        <Settings size={16} />
                        <span className="font-bold">Office App</span>
                      </Link>
                    )}

                    <button 
                      onClick={() => {
                        logout();
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-500/10 text-red-400 rounded-xl transition-colors mt-2 text-sm"
                    >
                      <LogOut size={16} />
                      <span className="font-bold">Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="btn-primary flex items-center gap-2"
            >
              <UserIcon size={16} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
