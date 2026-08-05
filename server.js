const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/database');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');
const errorHandler = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');


const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Initialize database tables and seed demo data
const initializeDatabase = async () => {
  try {
    console.log('Initializing database tables...');

    // Create products table
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

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create order_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create coupons table
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

    // Create indexes for better performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);');

    console.log('✅ Database tables created successfully');

    // Seed demo data if products table is empty
    const productsCount = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(productsCount.rows[0].count) === 0) {
      console.log('Seeding demo data...');
      
      await pool.query(`
        INSERT INTO products (name, description, price, category, stock_quantity) VALUES
        ('Laptop', 'High performance laptop', 1299.99, 'Electronics', 15),
        ('Smartphone', 'Latest smartphone', 899.99, 'Electronics', 20),
        ('Headphones', 'Wireless headphones', 299.99, 'Audio', 30),
        ('Monitor', 'UltraWide monitor', 599.99, 'Electronics', 10),
        ('Keyboard', 'Mechanical keyboard', 199.99, 'Accessories', 25),
        ('Mouse', 'Wireless mouse', 49.99, 'Accessories', 40);
      `);
      
      console.log('✅ Demo data seeded successfully');
    }
  } catch (error) {
    console.error('Database initialization error:', error.message);
  }
};

// Initialize database on startup
initializeDatabase();

// API Routes
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/coupons', couponRoutes);


// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api/v1/products`);
  console.log(`Logs directory: ./logs/`);
});