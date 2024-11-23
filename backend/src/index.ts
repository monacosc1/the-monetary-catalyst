// src/index.ts

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import paymentRoutes from './routes/paymentRoutes';
import contactRoutes from './routes/contactRoutes';

// Load environment variables from .env
dotenv.config();

// Initialize Express app
const app = express();

// Configure Express to handle raw body for webhooks
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Regular middleware for other routes
app.use(cors());
app.use(express.json());

// Add this before your routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', paymentRoutes);
app.use(contactRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
