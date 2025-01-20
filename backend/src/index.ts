// src/index.ts

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import paymentRoutes from './routes/paymentRoutes';
import contactRoutes from './routes/contactRoutes';
import authRoutes from './routes/authRoutes';
import newsletterRoutes from './routes/newsletterRoutes';
import webhookRoutes from './routes/webhookRoutes';

// Load environment variables from .env
dotenv.config();

// Initialize Express app
const app = express();

// Configure Express to handle raw body for webhooks
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Update CORS configuration to allow both www and non-www domains
app.use(cors({
  origin: [
    'https://www.themonetarycatalyst.com',
    'https://themonetarycatalyst.com',
    'http://localhost:3000'
  ],
  credentials: true
}));

// Regular middleware for other routes
app.use(express.json());

// Add this before your routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', paymentRoutes);
app.use(contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', newsletterRoutes);
app.use('/api', webhookRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
