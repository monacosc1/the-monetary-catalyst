// src/services/jwtService.ts
import jwt from 'jsonwebtoken';
import config from '../config/environment';
import { TokenPayload } from '../types/auth';

export const signToken = (userId: string): string => {
  return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: '1h' });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};
