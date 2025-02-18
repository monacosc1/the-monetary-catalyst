// src/index.ts

import dotenv from 'dotenv';
import app from './app';

// Load environment variables from .env
dotenv.config();

// Server startup
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
