const express = require('express');
const { body } = require('express-validator');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateFulfillmentStatus,
  getAllOrders,
} = require('../controllers/orderController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validateRequest } = require('../middlewares/validate');

const router = express.Router();

router.use(requireAuth);

router.post(
  '/',
  [
    body('recipient_name').trim().notEmpty().withMessage('Recipient name is required'),
    body('recipient_contact').trim().notEmpty().withMessage('Contact number is required'),
    body('delivery_address').trim().notEmpty().withMessage('Delivery address is required'),
    validateRequest,
  ],
  createOrder
);

router.get('/my-orders', getMyOrders);
router.get('/seller/orders', requireRole('seller'), getSellerOrders);
router.get('/admin/all', requireRole('admin'), getAllOrders);
router.get('/:id', getOrderById);
router.patch('/:id/fulfillment', requireRole('seller', 'admin'), updateFulfillmentStatus);

module.exports = router;

