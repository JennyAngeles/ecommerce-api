const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

// Create a new coupon
router.post('/', couponController.createCoupon);

// Get all coupons
router.get('/', couponController.getAllCoupons);

// Validate coupon
router.post('/validate', couponController.validateCoupon);

// Get coupon by code
router.get('/:code', couponController.getCouponByCode);

// Update coupon
router.put('/:id', couponController.updateCoupon);

// Delete coupon
router.delete('/:id', couponController.deleteCoupon);

module.exports = router;