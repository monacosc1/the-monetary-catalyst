import express from 'express';
import { subscribeToNewsletter } from '../controllers/newsletterController';

const router = express.Router();

router.post('/newsletter/subscribe', subscribeToNewsletter);

export default router; 