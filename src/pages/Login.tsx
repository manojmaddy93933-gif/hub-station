import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../services/firebase';
import { LogIn, ArrowRight } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const { user } = useAuth();

  if (user) return <Navigate to="/" />;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-zinc-900 rounded-[3rem] p-12 shadow-2xl text-center border border-zinc-800 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-accent opacity-50" />
        
        <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter text-slate-100 italic">Welcome</h2>
        <p className="text-zinc-500 mb-12 leading-relaxed font-medium">
          Log in with your Google account to access premium hub features, track your orders, and manage reservations.
        </p>

        <button 
          onClick={signInWithGoogle}
          className="w-full btn-primary flex items-center justify-center gap-3 bg-white text-zinc-950 hover:bg-zinc-200 shadow-xl shadow-white/5 active:scale-95 transition-all"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span className="font-black uppercase tracking-widest text-[10px]">Continue with Google</span>
        </button>

        <p className="mt-10 text-[10px] text-zinc-600 font-black uppercase tracking-widest opacity-60">
          Secure Authentication via Google
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
