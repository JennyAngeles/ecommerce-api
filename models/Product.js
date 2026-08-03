const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Product {
  // Create a new product
  static async create(name, description, price, category, stock_quantity) {
    const id = uuidv4();
    const query = `
      INSERT INTO products (id, name, description, price, category, stock_quantity)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await pool.query(query, [id, name, description, price, category, stock_quantity]);
    return result.rows[0];
  }

  // Get all products with pagination
  static async getAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM products
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  // Get product by ID
  static async getById(id) {
    const query = 'SELECT * FROM products WHERE id = $1;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get products by category
  static async getByCategory(category, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM products
      WHERE category = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const result = await pool.query(query, [category, limit, offset]);
    return result.rows;
  }

  // Search products by name
  static async search(searchTerm, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM products
      WHERE name ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const result = await pool.query(query, [`%${searchTerm}%`, limit, offset]);
    return result.rows;
  }

  // Update product
  static async update(id, name, description, price, category, stock_quantity) {
    const query = `
      UPDATE products
      SET name = $1, description = $2, price = $3, category = $4, stock_quantity = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *;
    `;
    const result = await pool.query(query, [name, description, price, category, stock_quantity, id]);
    return result.rows[0];
  }

  // Delete product
  static async delete(id) {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING *;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Deduct stock (for orders)
  static async deductStock(id, quantity) {
    const query = `
      UPDATE products
      SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND stock_quantity >= $1
      RETURNING *;
    `;
    const result = await pool.query(query, [quantity, id]);
    return result.rows[0];
  }

  // Get total product count
  static async getTotalCount() {
    const query = 'SELECT COUNT(*) FROM products;';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count, 10);
  }
}

module.exports = Product;