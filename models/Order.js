const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Product = require('./Product');

class Order {
  // Generate unique order number
  static generateOrderNumber() {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  // Create a new order with items
  static async create(items) {
    const client = await pool.connect();
    try {
      // Start transaction
      await client.query('BEGIN');

      const orderId = uuidv4();
      const orderNumber = this.generateOrderNumber();
      let totalPrice = 0;

      // Validate and deduct stock for each item
      for (const item of items) {
        const product = await client.query(
          'SELECT * FROM products WHERE id = $1',
          [item.product_id]
        );

        if (product.rows.length === 0) {
          throw new Error(`Product ${item.product_id} not found`);
        }

        const productData = product.rows[0];

        // Check stock availability
        if (productData.stock_quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for ${productData.name}. Available: ${productData.stock_quantity}, Requested: ${item.quantity}`
          );
        }

        // Deduct stock
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );

        totalPrice += productData.price * item.quantity;
      }

      // Create order
      await client.query(
        `INSERT INTO orders (id, order_number, total_price) VALUES ($1, $2, $3)`,
        [orderId, orderNumber, totalPrice]
      );

      // Create order items
      for (const item of items) {
        const product = await client.query(
          'SELECT price FROM products WHERE id = $1',
          [item.product_id]
        );

        const unitPrice = product.rows[0].price;
        const subtotal = unitPrice * item.quantity;

        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuidv4(), orderId, item.product_id, item.quantity, unitPrice, subtotal]
        );
      }

      // Commit transaction
      await client.query('COMMIT');

      // Fetch and return created order
      return this.getById(orderId);
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get order by ID with items
  static async getById(id) {
    const query = `
      SELECT 
        o.id, o.order_number, o.status, o.total_price, o.created_at, o.updated_at,
        json_agg(
          json_build_object(
            'item_id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
      GROUP BY o.id, o.order_number, o.status, o.total_price, o.created_at, o.updated_at;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get all orders with pagination
  static async getAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT 
        o.id, o.order_number, o.status, o.total_price, o.created_at, o.updated_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, o.order_number, o.status, o.total_price, o.created_at, o.updated_at
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  // Get orders by status
  static async getByStatus(status, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT 
        o.id, o.order_number, o.status, o.total_price, o.created_at, o.updated_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status = $1
      GROUP BY o.id, o.order_number, o.status, o.total_price, o.created_at, o.updated_at
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const result = await pool.query(query, [status, limit, offset]);
    return result.rows;
  }

  // Update order status
  static async updateStatus(id, status) {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Valid statuses: ${validStatuses.join(', ')}`);
    }

    const query = `
      UPDATE orders
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  // Cancel order and restore stock
  static async cancel(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get order items
      const orderItems = await client.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
        [id]
      );

      // Restore stock for each item
      for (const item of orderItems.rows) {
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }

      // Update order status
      const result = await client.query(
        `UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *;`,
        [id]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get total order count
  static async getTotalCount() {
    const query = 'SELECT COUNT(*) FROM orders;';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count, 10);
  }
}

module.exports = Order;