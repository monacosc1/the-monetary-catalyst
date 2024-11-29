import express from 'express';
const router = express.Router();

router.post('/email-events', async (req, res) => {
  const event = req.body;
  
  switch(event.event) {
    case 'bounce':
      console.error('Email bounced:', {
        email: event.email,
        reason: event.reason,
        timestamp: event.timestamp
      });
      // Add to suppression list or flag account
      break;
    case 'spamreport':
      // Handle spam reports
      break;
    case 'delivered':
      // Log successful delivery
      break;
  }
  
  res.status(200).send('OK');
});

export default router; 