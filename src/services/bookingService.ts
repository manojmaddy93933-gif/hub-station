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
      const docRef = await addDoc(collection(db, path), {
        ...booking,
        createdAt: Date.now()
      });
      
      const fullBooking = { id: docRef.id, ...booking, createdAt: Date.now() } as Booking;
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

