import { Booking, BookingStatus } from '../types';

export const emailService = {
  async sendBookingConfirmation(booking: Booking) {
    const subject = `Booking Confirmation - ${booking.resourceName}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 20px;">
        <h1 style="color: #ef4444; margin-bottom: 24px;">Booking Confirmed!</h1>
        <p style="font-size: 16px; color: #a1a1aa;">Hi ${booking.userName},</p>
        <p style="font-size: 16px; color: #a1a1aa;">Your booking at <strong>Hub Station</strong> has been successfully confirmed.</p>
        
        <div style="background: #18181b; padding: 24px; border-radius: 12px; margin: 24px 0;">
          <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a; margin: 0 0 16px 0;">Booking Details</h2>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #71717a; padding: 4px 0;">Service:</td>
              <td style="color: #f4f4f5; text-align: right;">${booking.resourceName}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 4px 0;">Date:</td>
              <td style="color: #f4f4f5; text-align: right;">${booking.date}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 4px 0;">Time:</td>
              <td style="color: #f4f4f5; text-align: right;">${booking.startTime} - ${booking.endTime}</td>
            </tr>
            <tr>
              <td style="color: #71717a; padding: 4px 0;">Price:</td>
              <td style="color: #f4f4f5; text-align: right;">₹${booking.price}</td>
            </tr>
          </table>
          
          <div style="margin-top: 32px; text-align: center; border-top: 1px solid #27272a; pt-24">
            <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a; margin: 16px 0 12px 0;">Digital Check-in Pass</p>
            <div style="display: inline-block; background: #fff; padding: 12px; border-radius: 12px;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.id}" alt="Check-in QR" width="150" height="150" style="display: block;" />
            </div>
            <p style="font-size: 10px; color: #52525b; margin-top: 8px;">Scan at Hub Desk for Entry</p>
          </div>
        </div>

        <p style="font-size: 14px; color: #71717a; margin-top: 40px;">
          If you have any questions, feel free to contact us at contact@hubcafe.com or call 7780228894.
        </p>
        <div style="margin-top: 40px; border-top: 1px solid #27272a; pt-20">
          <p style="font-size: 12px; color: #52525b; text-align: center;">Hub Station - Premium Experience</p>
        </div>
      </div>
    `;

    return this.sendEmail(booking.userEmail, subject, html);
  },

  async sendStatusUpdate(booking: Booking, status: BookingStatus) {
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    const subject = `Booking Update: Your ${booking.resourceName} is now ${statusText}`;
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border-radius: 20px;">
        <h1 style="color: #f59e0b; margin-bottom: 24px;">Status Update</h1>
        <p style="font-size: 16px; color: #a1a1aa;">Hi ${booking.userName},</p>
        <p style="font-size: 16px; color: #a1a1aa;">The status of your booking for <strong>${booking.resourceName}</strong> has changed.</p>
        
        <div style="background: #18181b; padding: 32px; border-radius: 12px; margin: 24px 0; text-align: center;">
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; color: #71717a; margin-bottom: 8px;">Current Status</p>
          <p style="font-size: 24px; font-weight: 900; color: #fbbf24; margin: 0; text-transform: uppercase;">${statusText}</p>
        </div>

        <p style="font-size: 14px; color: #71717a; margin-top: 40px;">
          You can track your service live on our dashboard.
        </p>
        <div style="margin-top: 40px; border-top: 1px solid #27272a; pt-20">
          <p style="font-size: 12px; color: #52525b; text-align: center;">Hub Station - Premium Experience</p>
        </div>
      </div>
    `;

    return this.sendEmail(booking.userEmail, subject, html);
  },

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, subject, html }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      return await response.json();
    } catch (error) {
      console.error('Email service error:', error);
      // We don't throw here to avoid breaking the core flow if email fails
      return null;
    }
  }
};
