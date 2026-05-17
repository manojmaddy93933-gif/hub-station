export const CAR_WASH_HOURS = { open: '10:00', close: '19:00' };
export const AURA_CAFE_HOURS = { open: '09:00', close: '22:00' };
export const THEATRE_HOURS = [
  { open: '10:00', close: '22:00' }
];
export const BADMINTON_HOURS = [
  { open: '07:00', close: '11:00' },
  { open: '16:00', close: '23:00' }
];

export const RATES = {
  GAMES: {
    CARROM: { name: 'Carrom Table', tables: 2, rate: 80 },
    CHESS: { name: 'Chess Table', tables: 1, rate: 50 },
    LUDO: { name: 'Ludo Table', tables: 3, rate: 60 },
    FREE: { name: 'Free Table', tables: 3, rate: 0 }
  },
  CAR_WASH: [
    { type: 'Quick Wash', price: 500 },
    { type: 'Premium Wash', price: 800 },
    { type: 'Deep Clean Service', price: 1300 }
  ],
  BADMINTON: {
    rate1h: 400,
    rate2h: 600
  },
  THEATRE: {
    rate1h: 500,
    rate2h: 900,
    halfDay: 1800
  },
  CAFE: {
    tableBooking: 200
  }
};

export const ADMIN_EMAILS = ['manojmaddy93933@gmail.com'];

export const HUB_LOCATION = { lat: 17.4326, lng: 78.4071 };
export const GOOGLE_MAPS_CONFIG = {
  API_KEY: 
    (process.env.GOOGLE_MAPS_PLATFORM_KEY) || 
    ((import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY) || 
    ((globalThis as any).GOOGLE_MAPS_PLATFORM_KEY) ||
    '',
  MAP_ID: 'DEMO_MAP_ID'
};
