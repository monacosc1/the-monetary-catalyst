import express, { Application } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import paymentRoutes from './routes/paymentRoutes';
import contactRoutes from './routes/contactRoutes';
import newsletterRoutes from './routes/newsletterRoutes';
import webhookRoutes from './routes/webhookRoutes';

const app: Application = express();

// Basic middleware
app.use(cors({
  origin: [
    'https://www.themonetarycatalyst.com',
    'https://themonetarycatalyst.com',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Configure webhook middleware first
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Regular middleware for other routes
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', paymentRoutes);
app.use('/api', contactRoutes);
app.use('/api', newsletterRoutes);
app.use('/api', webhookRoutes);

export default app; 