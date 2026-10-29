const express = require('express');
const { body } = require('express-validator');
const {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');
const { requireAuth } = require('../middlewares/auth');
const { validateRequest } = require('../middlewares/validate');

const router = express.Router();

router.use(requireAuth);

router.get('/', getCart);
router.post(
  '/add',
  [
    body('product_id').isInt().withMessage('Valid product_id is required'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    validateRequest,
  ],
  addToCart
);
router.put('/items/:id', updateQuantity);
router.delete('/items/:id', removeFromCart);
router.delete('/', clearCart);

module.exports = router;

