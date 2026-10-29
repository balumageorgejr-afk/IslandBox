const express = require('express');
const {
  createCheckoutSession,
  handleWebhook,
  verifySessionPayment,
  simulateSandboxPayment,
} = require('../controllers/checkoutController');
const { requireAuth } = require('../middlewares/auth');

const router = express.Router();

router.post('/create-session', requireAuth, createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.get('/verify/:reference', verifySessionPayment);
router.post('/simulate', simulateSandboxPayment);

module.exports = router;

