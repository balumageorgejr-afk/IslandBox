const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { requireAuth, requireRole } = require('../middlewares/auth');
const { validateRequest } = require('../middlewares/validate');

const router = express.Router();

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

router.post(
  '/',
  requireAuth,
  requireRole('seller', 'admin'),
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('category_id').isInt().withMessage('Valid category ID is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('available_quantity').isInt({ min: 0 }).withMessage('Available quantity must be non-negative'),
    validateRequest,
  ],
  createProduct
);

router.put('/:id', requireAuth, requireRole('seller', 'admin'), updateProduct);
router.delete('/:id', requireAuth, requireRole('seller', 'admin'), deleteProduct);

module.exports = router;

