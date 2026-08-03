const pool = require('../config/database');
const Coupon = require('../models/Coupon');

describe('Coupon Model', () => {
  beforeAll(async () => {
    // Setup: Create test table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        discount_type VARCHAR(20) NOT NULL,
        discount_value DECIMAL(10, 2) NOT NULL,
        max_uses INTEGER,
        current_uses INTEGER DEFAULT 0,
        min_order_amount DECIMAL(10, 2),
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  });

  afterEach(async () => {
    // Cleanup
    await pool.query('DELETE FROM coupons;');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('Should create a percentage discount coupon', async () => {
    const coupon = await Coupon.create('SAVE20', 'Save 20%', 'percentage', 20, 100, null, null);
    
    expect(coupon).toBeDefined();
    expect(coupon.code).toBe('SAVE20');
    expect(coupon.discount_type).toBe('percentage');
    expect(coupon.discount_value).toBe('20');
  });

  test('Should create a fixed amount discount coupon', async () => {
    const coupon = await Coupon.create('SAVE10USD', 'Save $10', 'fixed_amount', 10, 50, null, null);
    
    expect(coupon).toBeDefined();
    expect(coupon.discount_type).toBe('fixed_amount');
    expect(coupon.discount_value).toBe('10');
  });

  test('Should get coupon by code', async () => {
    await Coupon.create('TEST123', 'Test coupon', 'percentage', 15, null, null, null);
    const coupon = await Coupon.getByCode('TEST123');
    
    expect(coupon).toBeDefined();
    expect(coupon.code).toBe('TEST123');
  });

  test('Should calculate percentage discount correctly', () => {
    const coupon = { discount_type: 'percentage', discount_value: 20 };
    const discount = Coupon.calculateDiscount(coupon, 100);
    
    expect(discount).toBe(20);
  });

  test('Should calculate fixed amount discount correctly', () => {
    const coupon = { discount_type: 'fixed_amount', discount_value: 15 };
    const discount = Coupon.calculateDiscount(coupon, 100);
    
    expect(discount).toBe(15);
  });

  test('Should validate active coupon', async () => {
    await Coupon.create('VALID', 'Valid coupon', 'percentage', 10, 100, null, null);
    const coupon = await Coupon.validate('VALID', 100);
    
    expect(coupon).toBeDefined();
    expect(coupon.code).toBe('VALID');
  });

  test('Should reject expired coupon', async () => {
    const yesterday = new Date(Date.now() - 86400000);
    await Coupon.create('EXPIRED', 'Expired coupon', 'percentage', 10, null, null, yesterday);
    
    await expect(Coupon.validate('EXPIRED', 100)).rejects.toThrow('expired');
  });

  test('Should reject coupon below minimum order amount', async () => {
    await Coupon.create('MIN100', 'Min $100', 'percentage', 10, null, 100, null);
    
    await expect(Coupon.validate('MIN100', 50)).rejects.toThrow('Minimum order amount');
  });

  test('Should reject coupon at max uses', async () => {
    const coupon = await Coupon.create('LIMITED', 'Limited uses', 'percentage', 10, 1, null, null);
    
    // Set current_uses to max
    await pool.query('UPDATE coupons SET current_uses = 1 WHERE id = $1', [coupon.id]);
    
    await expect(Coupon.validate('LIMITED', 100)).rejects.toThrow('maximum uses');
  });

  test('Should increment usage on apply', async () => {
    await Coupon.create('APPLYTEST', 'Apply test', 'percentage', 10, 10, null, null);
    const coupon = await Coupon.apply('APPLYTEST');
    
    expect(coupon.current_uses).toBe(1);
  });
});