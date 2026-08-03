const pool = require('../config/database');
const Product = require('../models/Product');

describe('Product Model', () => {
  beforeAll(async () => {
    // Setup: Create test table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  });

  afterEach(async () => {
    // Cleanup: Clear test data after each test
    await pool.query('DELETE FROM products;');
  });

  afterAll(async () => {
    // Close database connection
    await pool.end();
  });

  test('Should create a product', async () => {
    const product = await Product.create('Test Product', 'A test product', 29.99, 'Test', 10);
    
    expect(product).toBeDefined();
    expect(product.name).toBe('Test Product');
    expect(product.price).toBe('29.99');
    expect(product.stock_quantity).toBe(10);
  });

  test('Should get product by ID', async () => {
    const created = await Product.create('Laptop', 'Gaming laptop', 1299.99, 'Electronics', 5);
    const retrieved = await Product.getById(created.id);
    
    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.name).toBe('Laptop');
  });

  test('Should get all products with pagination', async () => {
    await Product.create('Product 1', 'Desc 1', 10.00, 'Cat1', 5);
    await Product.create('Product 2', 'Desc 2', 20.00, 'Cat2', 10);
    
    const products = await Product.getAll(1, 10);
    
    expect(products.length).toBeGreaterThanOrEqual(2);
  });

  test('Should deduct stock', async () => {
    const product = await Product.create('Stock Test', 'Test', 50.00, 'Test', 20);
    const updated = await Product.deductStock(product.id, 5);
    
    expect(updated.stock_quantity).toBe(15);
  });

  test('Should not deduct stock if insufficient', async () => {
    const product = await Product.create('Low Stock', 'Test', 50.00, 'Test', 2);
    const result = await Product.deductStock(product.id, 5);
    
    expect(result).toBeUndefined();
  });

  test('Should search products by name', async () => {
    await Product.create('Apple iPhone', 'Phone', 999.99, 'Electronics', 5);
    await Product.create('Apple MacBook', 'Laptop', 1999.99, 'Electronics', 3);
    
    const results = await Product.search('Apple', 1, 10);
    
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  test('Should get products by category', async () => {
    await Product.create('Mouse', 'Accessory', 25.00, 'Electronics', 20);
    await Product.create('Keyboard', 'Accessory', 75.00, 'Electronics', 15);
    
    const results = await Product.getByCategory('Electronics', 1, 10);
    
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  test('Should delete a product', async () => {
    const product = await Product.create('To Delete', 'Test', 10.00, 'Test', 5);
    const deleted = await Product.delete(product.id);
    const retrieved = await Product.getById(product.id);
    
    expect(deleted).toBeDefined();
    expect(retrieved).toBeUndefined();
  });

  test('Should update a product', async () => {
    const product = await Product.create('Original', 'Original desc', 50.00, 'Cat1', 10);
    const updated = await Product.update(product.id, 'Updated', 'New desc', 60.00, 'Cat2', 8);
    
    expect(updated.name).toBe('Updated');
    expect(updated.price).toBe('60.00');
    expect(updated.stock_quantity).toBe(8);
  });
});