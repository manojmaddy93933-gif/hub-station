import React from 'react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Download, Printer, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const QRHub = () => {
  const appUrl = window.location.origin;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-xl w-full">
        <Link 
          to="/admin" 
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-accent mb-8 font-black text-[10px] uppercase tracking-widest transition-colors"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 rounded-[3rem] p-12 border border-zinc-800 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative Background */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/0 via-accent to-accent/0" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent opacity-5 blur-[100px] rounded-full" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-2">
              <span className="text-[10px] font-black text-accent uppercase tracking-[0.4em] italic">Station Access</span>
            </div>
            <h1 className="text-4xl font-black text-slate-100 uppercase tracking-tighter italic mb-8">
              HUB STATION
            </h1>

            {/* QR Code Container */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl mb-8 relative group">
              <QRCodeSVG 
                value={appUrl}
                size={220}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: "/favicon.ico",
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
              <div className="absolute inset-0 border-8 border-zinc-900/5 rounded-[2.5rem] pointer-events-none" />
            </div>

            <div className="space-y-2 mb-10">
              <p className="text-slate-100 font-bold uppercase text-sm tracking-tight">Scan to Book Services</p>
              <p className="text-zinc-500 text-xs font-medium max-w-[250px] mx-auto leading-relaxed">
                Scan this code at the station to book slots for Aura Cafe, Luxe Detailing, or Game Tables.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <button 
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-slate-200 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
              >
                <Printer size={16} /> Print Flyer
              </button>
              <button 
                onClick={() => navigator.share?.({ title: 'Hub Station', url: appUrl })}
                className="flex items-center justify-center gap-2 bg-accent text-zinc-950 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
              >
                <Share2 size={16} /> Share Link
              </button>
            </div>
          </div>
        </motion.div>

        <div className="mt-8 text-center">
          <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em]">
            Digital Hub Station &copy; 2026
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          nav, button, a { display: none !important; }
          body { background: white !important; }
          .bg-zinc-950 { background: white !important; min-height: auto !important; padding: 0 !important; }
          .bg-zinc-900 { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 auto !important; }
          .text-slate-100 { color: black !important; }
          .text-zinc-500 { color: #666 !important; }
          .rounded-[3rem] { border-radius: 0 !important; }
        }
      `}} />
    </div>
  );
};

export default QRHub;
