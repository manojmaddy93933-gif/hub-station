import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { IndianRupee, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface PaymentQRProps {
  amount?: number;
  bookingId?: string;
  className?: string;
}

const PaymentQR: React.FC<PaymentQRProps> = ({ amount, bookingId, className = '' }) => {
  // UPI Deep link format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&tn=NOTE
  // Using a neutral VPA
  const upiId = "hubcafe@upi";
  const name = "HUB CAFE & SERVICE";
  const note = bookingId ? `Booking ${bookingId.slice(-6).toUpperCase()}` : "Service Payment";
  
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&tn=${encodeURIComponent(note)}${amount ? `&am=${amount}` : ''}`;

  return (
    <div className={`flex flex-col items-center bg-white p-8 rounded-[2.5rem] shadow-2xl border border-zinc-100 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-green-500/10 rounded-full text-green-600">
          <ShieldCheck size={20} />
        </div>
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Secure UPI Payment</span>
      </div>

      <div className="relative group">
        <div className="absolute -inset-4 bg-gradient-to-tr from-accent/20 to-red-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative p-4 bg-white rounded-3xl border-4 border-zinc-50">
          <QRCodeSVG 
            value={upiUrl}
            size={220}
            level="H"
            includeMargin={false}
          />
        </div>
      </div>

      <div className="mt-8 text-center">
        <h3 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center justify-center gap-1 italic">
          {amount && <IndianRupee size={20} className="stroke-[3]" />}
          {amount ? amount : 'SCAN TO PAY'}
        </h3>
        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-2">OFFICIAL HUB PAYMENT</p>
      </div>

      <div className="mt-6 w-full pt-6 border-t border-zinc-100 flex items-center justify-between px-2">
         <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" className="h-4 object-contain grayscale opacity-60" />
         <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Google_Pay_Logo.svg/1200px-Google_Pay_Logo.svg.png" alt="GPay" className="h-3 object-contain grayscale opacity-60" />
         <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/1200px-PhonePe_Logo.svg.png" alt="PhonePe" className="h-3 object-contain grayscale opacity-60" />
      </div>
    </div>
  );
};

export default PaymentQR;
