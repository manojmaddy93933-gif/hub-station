export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  mobileNumber?: string;
  role: UserRole;
  createdAt: number;
}

export type BookingType = 'game' | 'carWash' | 'badminton' | 'theatre' | 'cafe';
export type BookingStatus = 'pending' | 'ongoing' | 'completed' | 'cancelled';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface Booking {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  type: BookingType;
  resourceId: string; // e.g., "Carrom Table 2", "Bay 1", "Court 1"
  resourceName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number;
  vehicleNumber?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehiclePhotoUrl?: string;
  notes?: string;
  status: BookingStatus;
  price: number;
  paymentStatus?: 'unpaid' | 'pending' | 'paid';
  paymentMethod?: 'upi' | 'cash' | 'card';
  checkedInAt?: number;
  bay?: string;
  createdAt: number;
  tracking?: {
    latitude?: number;
    longitude?: number;
    lastUpdated: number;
    statusUpdate: string;
  };
}
