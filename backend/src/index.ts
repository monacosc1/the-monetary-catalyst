// src/index.ts

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import paymentRoutes from './routes/paymentRoutes';

// Load environment variables from .env
dotenv.config();

// Initialize Express app
const app = express();

// Regular middleware for most routes
app.use(cors());
app.use(express.json());

// Special handling for Stripe webhook endpoint
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Routes
app.use('/api', paymentRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
