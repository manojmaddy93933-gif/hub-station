import React, { useState } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  Timestamp, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError } from './firebase';
import { Booking, BookingStatus, OperationType } from '../types';
import { emailService } from './emailService';

export const bookingService = {
  async createBooking(booking: Omit<Booking, 'id'>) {
    const path = 'bookings';
    try {
      let finalEndTime = booking.endTime;
      
      if (!finalEndTime && booking.startTime) {
        let defaultDurationHours = booking.duration || 1;
        
        // Type-specific duration logic if duration is not explicitly set
        if (!booking.duration) {
          switch (booking.type) {
            case 'theatre': defaultDurationHours = 3; break;
            case 'badminton': defaultDurationHours = 1; break;
            case 'carWash': defaultDurationHours = 1; break;
            case 'game': defaultDurationHours = 1; break;
            case 'cafe': defaultDurationHours = 1; break;
          }
        }

        const [hoursStr, minutesStr] = booking.startTime.split(':');
        let startTimeInMinutes = parseInt(hoursStr, 10) * 60 + parseInt(minutesStr, 10);
        
        // Duration is assumed to be in hours
        let endTimeInMinutes = startTimeInMinutes + (defaultDurationHours * 60);
        
        const endHours = Math.floor(endTimeInMinutes / 60) % 24;
        const endMins = Math.floor(endTimeInMinutes % 60);
        
        finalEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      }

      const docRef = await addDoc(collection(db, path), {
        ...booking,
        endTime: finalEndTime,
        duration: booking.duration || 1, // ensure duration is populated
        createdAt: Date.now()
      });
      
      const fullBooking = { id: docRef.id, ...booking, endTime: finalEndTime, duration: booking.duration || 1, createdAt: Date.now() } as Booking;
      await emailService.sendBookingConfirmation(fullBooking);
      
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async getBooking(bookingId: string): Promise<Booking | null> {
    try {
      const docRef = doc(db, 'bookings', bookingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Booking;
      }
      return null;
    } catch (error) {
      console.error("Error fetching booking:", error);
      return null;
    }
  },

  async rescheduleBooking(bookingId: string, bookingType: string, date: string, startTime: string, duration: number) {
    const path = `bookings/${bookingId}`;
    try {
      const [hoursStr, minutesStr] = startTime.split(':');
      let startTimeInMinutes = parseInt(hoursStr, 10) * 60 + parseInt(minutesStr, 10);
      let endTimeInMinutes = startTimeInMinutes + (duration * 60);
      
      const endHours = Math.floor(endTimeInMinutes / 60) % 24;
      const endMins = Math.floor(endTimeInMinutes % 60);
      
      const finalEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

      await updateDoc(doc(db, 'bookings', bookingId), {
        date,
        startTime,
        endTime: finalEndTime,
        updatedAt: Date.now()
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      return false;
    }
  },

  async updateBookingStatus(bookingId: string, status: BookingStatus, extraData?: any) {
    const path = `bookings/${bookingId}`;
    try {
      const updateData: any = { status, ...extraData };
      
      await updateDoc(doc(db, 'bookings', bookingId), updateData);

      // Fetch booking to send update email
      const booking = await this.getBooking(bookingId);
      if (booking) {
        await emailService.sendStatusUpdate(booking, status);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async checkInBooking(bookingId: string) {
    const path = `bookings/${bookingId}`;
    try {
      const now = Date.now();
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'ongoing',
        checkedInAt: now,
        tracking: {
          statusUpdate: 'Customer Checked-In',
          lastUpdated: now
        }
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      return false;
    }
  },

  subscribeToUserBookings(userId: string, callback: (bookings: Booking[]) => void) {
    const path = 'bookings';
    const q = query(
      collection(db, path), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      callback(bookings);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  subscribeToAllBookings(callback: (bookings: Booking[], changes?: any[]) => void) {
    const path = 'bookings';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      callback(bookings, snapshot.docChanges());
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  async deleteBooking(bookingId: string) {
    const path = `bookings/${bookingId}`;
    try {
      await deleteDoc(doc(db, 'bookings', bookingId));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      return false;
    }
  },

  async clearUserHistory(userId: string, bookings: Booking[]) {
    const historyBookings = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));
    try {
      const promises = historyBookings.map(b => deleteDoc(doc(db, 'bookings', b.id)));
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error("Error clearing history:", error);
      return false;
    }
  }
};

