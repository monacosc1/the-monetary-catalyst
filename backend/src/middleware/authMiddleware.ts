import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/jwtService';

const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

export default authMiddleware;
