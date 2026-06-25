import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from 'resend';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // API routes
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html } = req.body;

    if (!resend) {
      console.warn("RESEND_API_KEY is not set. Email not sent.");
      return res.status(200).json({ message: "Skipped sending email (no API key)" });
    }

    try {
      let { data, error } = await resend.emails.send({
        from: 'Hub Experience <notifications@hubcafe.com>', // Note: Use a verified domain in production
        to: [to],
        subject: subject,
        html: html,
      });

      if (error) {
        console.warn("Primary email send failed. Attempting fallback with onboarding@resend.dev...", error);
        
        // Retry with onboarding@resend.dev which is allowed for unverified domains in Resend
        const fallbackResult = await resend.emails.send({
          from: 'Hub Experience <onboarding@resend.dev>',
          to: [to],
          subject: subject,
          html: html,
        });

        if (fallbackResult.error) {
          console.error("Resend Fallback Error:", fallbackResult.error);
          // Return 200 with success: false so the client application flow doesn't crash on unverified email addresses
          return res.status(200).json({
            success: false,
            message: "Email sending failed on both custom domain and onboarding fallback. If you are in Resend Sandbox, make sure the recipient is your registered Resend email address.",
            error: fallbackResult.error
          });
        }

        data = fallbackResult.data;
        error = null;
      }

      res.status(200).json({ success: true, data });
    } catch (err: any) {
      console.error("Failed to send email:", err);
      res.status(200).json({ 
        success: false, 
        message: err?.message || "Internal server error during email dispatch" 
      });
    }
  });

  app.post("/api/verify-passcode", (req, res) => {
    const { passcode } = req.body;
    const correctPasscode = process.env.ADMIN_PASSCODE || "admin123";

    if (passcode === correctPasscode) {
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid passcode" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
