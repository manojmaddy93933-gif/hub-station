import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { HUB_LOCATION, GOOGLE_MAPS_CONFIG } from '../constants';

const API_KEY = GOOGLE_MAPS_CONFIG.API_KEY;
const MAP_ID = GOOGLE_MAPS_CONFIG.MAP_ID;

// Robust check for a valid-looking API key
const hasValidKey = 
  typeof API_KEY === 'string' && 
  API_KEY.length > 20 && 
  !API_KEY.includes('YOUR_API_KEY') && 
  !['undefined', 'null', ''].includes(API_KEY.toLowerCase());

interface LiveTrackingMapProps {
  status: string;
  type: string;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ status, type }) => {
  if (!hasValidKey) return null;

  return (
    <div className="w-full h-40 rounded-2xl overflow-hidden border border-zinc-800 mt-4 relative">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={HUB_LOCATION}
          defaultZoom={17}
          mapId={MAP_ID}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          gestureHandling={'none'}
          disableDefaultUI={true}
          theme="dark"
        >
          <AdvancedMarker position={HUB_LOCATION}>
             <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-accent opacity-40"></span>
                <Pin background="#f59e0b" glyphColor="#18181b" borderColor="#f59e0b" scale={0.8} />
             </div>
          </AdvancedMarker>
        </Map>
      </APIProvider>
      
      <div className="absolute bottom-2 right-2 bg-zinc-950/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/5 text-[8px] font-black uppercase text-accent tracking-tighter">
        Active Tracking: {type}
      </div>
    </div>
  );
};
