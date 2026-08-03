const Coupon = require('../models/Coupon');

// Create a new coupon
exports.createCoupon = async (req, res, next) => {
  try {
    const { code, description, discountType, discountValue, maxUses, minOrderAmount, expiresAt } = req.body;

    // Validation
    if (!code || !discountType || !discountValue) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: code, discountType, discountValue',
      });
    }

    const coupon = await Coupon.create(
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      minOrderAmount,
      expiresAt
    );

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// Get coupon by code
exports.getCouponByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const coupon = await Coupon.getByCode(code);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    res.status(200).json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// Validate coupon for an order
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, orderTotal } = req.body;

    if (!code || !orderTotal) {
      return res.status(400).json({
        success: false,
        message: 'Code and orderTotal are required',
      });
    }

    const coupon = await Coupon.validate(code, orderTotal);
    const discountAmount = Coupon.calculateDiscount(coupon, orderTotal);
    const finalPrice = orderTotal - discountAmount;

    res.status(200).json({
      success: true,
      data: {
        coupon_code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount.toFixed(2),
        original_price: orderTotal.toFixed(2),
        final_price: finalPrice.toFixed(2),
        savings: discountAmount.toFixed(2),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all coupons
exports.getAllCoupons = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const coupons = await Coupon.getAll(page, limit);

    res.status(200).json({
      success: true,
      data: coupons,
      pagination: {
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update coupon
exports.updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, discountValue, maxUses, isActive } = req.body;

    const coupon = await Coupon.update(id, description, discountValue, maxUses, isActive);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// Delete coupon
exports.deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.delete(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};