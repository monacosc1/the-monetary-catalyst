import express, { Request, Response, RequestHandler } from 'express';
import { emailService } from '../services/emailService';

const router = express.Router();

interface ContactRequest {
  name: string;
  email: string;
  message: string;
  recaptchaToken: string;
}

// Explicitly type the handler to match RequestHandler expectations
const handleContact: RequestHandler = async (req, res, next): Promise<void> => {
  console.log('Starting contact form submission...');

  try {
    const { name, email, message, recaptchaToken } = req.body as ContactRequest;
    console.log('Request body:', { name, email, messageLength: message?.length });

    // Validate required fields
    if (!name || !email || !message || !recaptchaToken) {
      console.log('Missing required fields:', { name: !!name, email: !!email, message: !!message, token: !!recaptchaToken });
      res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          name: !name ? 'Name is required' : null,
          email: !email ? 'Email is required' : null,
          message: !message ? 'Message is required' : null,
          recaptchaToken: !recaptchaToken ? 'reCAPTCHA token is required' : null
        }
      });
      return;
    }

    // Verify reCAPTCHA token
    try {
      console.log('Starting reCAPTCHA verification for:', email);
      console.log('Environment check:', { 
        hasSecretKey: !!process.env.RECAPTCHA_SECRET_KEY,
        nodeEnv: process.env.NODE_ENV
      }); // Debug log

      if (!process.env.RECAPTCHA_SECRET_KEY) {
        console.error('RECAPTCHA_SECRET_KEY not found in environment');
        res.status(500).json({ error: 'Server configuration error' });
        return;
      }

      const recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
      console.log('Making reCAPTCHA API request to:', recaptchaUrl); // Debug log

      const recaptchaResponse = await fetch(
        recaptchaUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
        }
      );

      if (!recaptchaResponse.ok) {
        console.error('reCAPTCHA API response not OK:', {
          status: recaptchaResponse.status,
          statusText: recaptchaResponse.statusText
        }); // Debug log
        throw new Error(`reCAPTCHA API error: ${recaptchaResponse.statusText}`);
      }

      const recaptchaData = await recaptchaResponse.json();
      console.log('reCAPTCHA verification response:', recaptchaData);
      
      if (!recaptchaData.success || (recaptchaData.score && recaptchaData.score < 0.5)) {
        console.error('reCAPTCHA verification failed:', recaptchaData);
        res.status(400).json({ 
          error: 'reCAPTCHA verification failed',
          details: recaptchaData
        });
        return;
      }
    } catch (recaptchaError) {
      console.error('reCAPTCHA verification error:', recaptchaError);
      res.status(400).json({ 
        error: 'reCAPTCHA verification failed',
        details: recaptchaError instanceof Error ? recaptchaError.message : 'Unknown error'
      });
      return;
    }

    // Send email
    console.log('reCAPTCHA verified, sending email...'); // Debug log
    await emailService.sendContactFormEmail(name, email, message);
    console.log('Email sent successfully'); // Debug log
    
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

router.post('/contact', handleContact);

export default router; 