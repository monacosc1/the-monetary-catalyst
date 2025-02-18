import { Request } from 'express';

export interface TokenPayload {
  id: string;
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}
