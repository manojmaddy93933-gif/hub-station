import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { motion } from 'motion/react';
import { MapPin, Info, Navigation } from 'lucide-react';
import { HUB_LOCATION, GOOGLE_MAPS_CONFIG } from '../constants';

const API_KEY = GOOGLE_MAPS_CONFIG.API_KEY;

// Robust check for a valid-looking API key
const hasValidKey = 
  typeof API_KEY === 'string' && 
  API_KEY.length > 20 && 
  !API_KEY.includes('YOUR_API_KEY') && 
  !['undefined', 'null', ''].includes(API_KEY.toLowerCase());

const CAFE_LOCATION = HUB_LOCATION;
const MAP_ID = GOOGLE_MAPS_CONFIG.MAP_ID;

export const MapSection: React.FC = () => {
  if (!hasValidKey) {
    return (
      <section className="max-w-7xl mx-auto px-4 mt-32">
        <div className="bg-zinc-900 rounded-[3.5rem] p-12 border border-zinc-800 text-center">
          <div className="w-16 h-16 bg-zinc-950 text-accent rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-zinc-800">
            <MapPin size={32} />
          </div>
          <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter text-slate-100">Location Map Required</h2>
          <p className="text-zinc-500 mb-8 max-w-lg mx-auto font-medium">
            To view our interactive location map and tracking services, please add your Google Maps API Key to the project secrets.
          </p>
          
          <div className="max-w-md mx-auto bg-zinc-950 p-6 rounded-3xl border border-zinc-800 text-left mb-8">
            <p className="text-xs font-bold text-accent uppercase tracking-widest mb-4">Setup Instructions:</p>
            <ol className="text-xs text-zinc-400 space-y-3 list-decimal pl-4 font-medium">
              <li>Get an API Key from <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener" className="text-accent hover:underline">Google Cloud Console</a></li>
              <li>Open <strong>Settings</strong> (⚙️ gear icon, top-right) → <strong>Secrets</strong></li>
              <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code> as secret name</li>
              <li>Paste your API key and press <strong>Enter</strong></li>
            </ol>
          </div>
          
          <button className="btn-secondary pointer-events-none opacity-50">
            Waiting for API Key...
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 mt-32">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-4">
          <div className="w-12 h-1 text-accent bg-accent mb-8" />
          <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-8 leading-tight tracking-tighter uppercase">
            Visit Our <br />Flagship Hub
          </h2>
          <p className="text-zinc-500 mb-8 leading-relaxed text-lg font-medium">
            Located in the heart of Jubilee Hills, our premium hub is designed for comfort and efficiency. 
            Easy access, ample parking, and a premium atmosphere await you.
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 text-accent shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-slate-100 font-bold uppercase text-sm tracking-tight">Address</p>
                <p className="text-zinc-500 text-sm font-medium">Plot 45, Road No. 36, Jubilee Hills, Hyderabad</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 text-accent shrink-0">
                <Navigation size={20} />
              </div>
              <div>
                <p className="text-slate-100 font-bold uppercase text-sm tracking-tight">Contact</p>
                <p className="text-zinc-500 text-sm font-medium">7780228894 • contact@hubcafe.com</p>
              </div>
            </div>
          </div>
          
          <button className="btn-primary w-full flex items-center justify-center gap-2">
            Get Directions <Navigation size={18} />
          </button>
        </div>
        
        <div className="lg:col-span-8 h-[500px] rounded-[3.5rem] overflow-hidden border border-zinc-800 shadow-2xl relative">
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={CAFE_LOCATION}
              defaultZoom={15}
              mapId={MAP_ID}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              gestureHandling={'greedy'}
              disableDefaultUI={true}
              theme="dark"
            >
              <AdvancedMarker position={CAFE_LOCATION} title="Cafe & Service Hub">
                <Pin background="#f59e0b" glyphColor="#18181b" borderColor="#f59e0b" scale={1.2}>
                   <div className="text-[10px] font-black uppercase text-zinc-950 mt-1">HUB</div>
                </Pin>
              </AdvancedMarker>
            </Map>
          </APIProvider>
          
          <div className="absolute top-6 right-6 flex flex-col gap-2">
             <div className="bg-zinc-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 text-xs font-bold text-slate-100 shadow-xl">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Live Status: Open
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};
