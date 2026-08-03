const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Coupon {
  // Create a new coupon
  static async create(code, description, discountType, discountValue, maxUses, minOrderAmount, expiresAt) {
    if (!['percentage', 'fixed_amount'].includes(discountType)) {
      throw new Error("Discount type must be 'percentage' or 'fixed_amount'");
    }

    if (discountValue <= 0) {
      throw new Error('Discount value must be greater than 0');
    }

    const id = uuidv4();
    const query = `
      INSERT INTO coupons (id, code, description, discount_type, discount_value, max_uses, min_order_amount, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      id,
      code.toUpperCase(),
      description,
      discountType,
      discountValue,
      maxUses,
      minOrderAmount,
      expiresAt,
    ]);
    return result.rows[0];
  }

  // Get coupon by code
  static async getByCode(code) {
    const query = `SELECT * FROM coupons WHERE code = $1 AND is_active = TRUE;`;
    const result = await pool.query(query, [code.toUpperCase()]);
    return result.rows[0];
  }

  // Validate coupon
  static async validate(code, orderTotal) {
    const coupon = await this.getByCode(code);

    if (!coupon) {
      throw new Error('Coupon not found or inactive');
    }

    // Check expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      throw new Error('Coupon has expired');
    }

    // Check max uses
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      throw new Error('Coupon has reached maximum uses');
    }

    // Check minimum order amount
    if (coupon.min_order_amount && orderTotal < coupon.min_order_amount) {
      throw new Error(`Minimum order amount is ${coupon.min_order_amount}`);
    }

    return coupon;
  }

  // Calculate discount amount
  static calculateDiscount(coupon, orderTotal) {
    if (coupon.discount_type === 'percentage') {
      return (orderTotal * coupon.discount_value) / 100;
    } else {
      // fixed_amount
      return coupon.discount_value;
    }
  }

  // Apply coupon (increment usage)
  static async apply(code) {
    const query = `
      UPDATE coupons
      SET current_uses = current_uses + 1
      WHERE code = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [code.toUpperCase()]);
    return result.rows[0];
  }

  // Get all coupons
  static async getAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM coupons
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  // Update coupon
  static async update(id, description, discountValue, maxUses, isActive) {
    const query = `
      UPDATE coupons
      SET description = $1, discount_value = $2, max_uses = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *;
    `;
    const result = await pool.query(query, [description, discountValue, maxUses, isActive, id]);
    return result.rows[0];
  }

  // Delete coupon
  static async delete(id) {
    const query = 'DELETE FROM coupons WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Coupon;