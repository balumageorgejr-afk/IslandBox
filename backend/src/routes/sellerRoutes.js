const express = require('express');
const { getSellers, getSellerById, getMySellerProfile, updateSellerProfile } = require('../controllers/sellerController');
const { requireAuth, requireRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/', getSellers);
router.get('/profile/me', requireAuth, requireRole('seller'), getMySellerProfile);
router.put('/profile/me', requireAuth, requireRole('seller'), updateSellerProfile);
router.get('/:id', getSellerById);

module.exports = router;

