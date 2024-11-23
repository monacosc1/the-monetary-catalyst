import express, { Request, Response, RequestHandler } from 'express';
import { emailService } from '../services/emailService';

const router = express.Router();

interface ContactRequest {
  name: string;
  email: string;
  message: string;
  recaptchaToken: string;
}

const handleContact: RequestHandler<{}, any, ContactRequest, {}> = async (req, res) => {
  try {
    const { name, email, message, recaptchaToken } = req.body;

    // Verify reCAPTCHA token
    try {
      console.log('Verifying token:', recaptchaToken); // For debugging

      const recaptchaResponse = await fetch(
        'https://www.google.com/recaptcha/api/siteverify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
        }
      );

      const recaptchaData = await recaptchaResponse.json();
      console.log('reCAPTCHA response:', recaptchaData); // For debugging
      
      if (!recaptchaData.success || (recaptchaData.score && recaptchaData.score < 0.5)) {
        console.error('reCAPTCHA verification failed:', recaptchaData);
        res.status(400).json({ error: 'reCAPTCHA verification failed' });
        return;
      }
    } catch (recaptchaError) {
      console.error('reCAPTCHA verification error:', recaptchaError);
      res.status(400).json({ error: 'reCAPTCHA verification failed' });
      return;
    }

    // If reCAPTCHA verification passed, send the email
    await emailService.sendContactFormEmail(name, email, message);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

router.post('/contact', handleContact);

export default router; 