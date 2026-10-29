const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, getMe, updateProfile } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');
const { validateRequest } = require('../middlewares/validate');

const router = express.Router();

router.post(
  '/register',
  [
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().trim().toLowerCase().withMessage('Valid email address is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('contact_number').optional().trim(),
    body('delivery_address').optional().trim(),
    body('role').optional().isIn(['customer', 'seller']).withMessage('Role must be customer or seller'),
    validateRequest,
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().trim().toLowerCase().withMessage('Valid email address is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest,
  ],
  login
);

router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, updateProfile);

module.exports = router;
