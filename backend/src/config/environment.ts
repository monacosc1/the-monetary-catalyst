// environment.ts
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

interface EnvironmentConfig {
  port: number;
  jwtSecret: string;
  stripeSecretKey: string;
  supabaseUrl: string;
  supabaseApiKey: string;
}

const config: EnvironmentConfig = {
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET as string,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY as string,
  supabaseUrl: process.env.SUPABASE_URL as string,
  supabaseApiKey: process.env.SUPABASE_API_KEY as string,
};

export default config;
