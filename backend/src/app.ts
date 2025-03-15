// /backend/src/app.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import paymentRoutes from './routes/paymentRoutes';
import contactRoutes from './routes/contactRoutes';
import newsletterRoutes from './routes/newsletterRoutes';
import webhookRoutes from './routes/webhookRoutes';
import contentRoutes from './routes/contentRoutes';

const app: Application = express();

// Basic middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Configure webhook rate limiter
const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  headers: true,
});

// Configure API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  headers: true,
});

// Configure webhook middleware first with rate limiting
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookLimiter);

// Regular middleware for other routes with rate limiting
app.use('/api', apiLimiter, express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Request origin:', req.headers.origin || req.headers.referer || 'Unknown');
  next();
});

// Health check route (no rate limiting needed)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', paymentRoutes);
app.use('/api', contactRoutes);
app.use('/api', newsletterRoutes);
app.use('/api', webhookRoutes);
app.use('/api/content', contentRoutes);

// Default error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;