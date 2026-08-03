# E-Commerce Inventory Management API

A production-grade RESTful API for managing e-commerce products, orders, and discount coupons. Built with Node.js, Express, and PostgreSQL.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [License](#license)

---

## Features

### Product Management
- CRUD operations for products
- Real-time inventory tracking
- Product search and filtering by category
- Pagination support

### Order Management
- Create orders with automatic stock deduction
- Transaction-safe order processing (all-or-nothing)
- Order status tracking (pending, processing, shipped, delivered, cancelled)
- Order history and analytics
- Automatic stock restoration on cancellation

### Discount & Coupons
- Percentage-based discounts
- Fixed-amount discounts
- Coupon validation with rules
- Usage limits and expiration dates
- Minimum order amount requirements

### Code Quality
- Comprehensive logging system
- Error handling and validation
- Unit tests with Jest (15+ test cases)
- Database transactions for data integrity
- API versioning (/api/v1/)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | PostgreSQL |
| **Testing** | Jest, Supertest |
| **Authentication** | JWT (prepared for Day 4) |
| **Logging** | Custom file-based logger |
| **Deployment** | Render.com / Railway.app |

---

## Installation

### Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd ecommerce-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `.env` file**
```bash
touch .env
```

4. **Configure environment variables**
```env
PORT=5001
NODE_ENV=development
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_db
```

5. **Set up PostgreSQL database**
```bash
psql -U postgres
```

Then run:
```sql
CREATE DATABASE ecommerce_db;

\c ecommerce_db

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coupons table
CREATE TABLE coupons (
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

-- Indexes for performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_coupons_code ON coupons(code);
```

6. **Start the server**
```bash
npm run dev
```

The API will be available at `http://localhost:5001`

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5001 |
| `NODE_ENV` | Environment (development/production) | development |
| `DB_USER` | PostgreSQL username | postgres |
| `DB_PASSWORD` | PostgreSQL password | - |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | ecommerce_db |

---

## API Endpoints

### Base URL
```
http://localhost:5001/api/v1
```

### Health Check
```
GET /health
```

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/products` | Create a product |
| `GET` | `/products` | Get all products (paginated) |
| `GET` | `/products/:id` | Get product by ID |
| `GET` | `/products/category/:category` | Get products by category |
| `GET` | `/products/search?q=query` | Search products |
| `PUT` | `/products/:id` | Update product |
| `DELETE` | `/products/:id` | Delete product |
| `PATCH` | `/products/:id/deduct-stock` | Deduct stock (for orders) |

**Example: Create Product**
```bash
curl -X POST http://localhost:5001/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High performance laptop",
    "price": 999.99,
    "category": "Electronics",
    "stock_quantity": 10
  }'
```

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/orders` | Create order (with stock deduction) |
| `GET` | `/orders` | Get all orders |
| `GET` | `/orders/:id` | Get order by ID |
| `GET` | `/orders/status/:status` | Get orders by status |
| `PATCH` | `/orders/:id/status` | Update order status |
| `PATCH` | `/orders/:id/cancel` | Cancel order (restore stock) |

**Example: Create Order**
```bash
curl -X POST http://localhost:5001/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product_id": "uuid-here",
        "quantity": 2
      }
    ]
  }'
```

### Coupons

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/coupons` | Create coupon |
| `GET` | `/coupons` | Get all coupons |
| `POST` | `/coupons/validate` | Validate coupon |
| `GET` | `/coupons/:code` | Get coupon by code |
| `PUT` | `/coupons/:id` | Update coupon |
| `DELETE` | `/coupons/:id` | Delete coupon |

**Example: Create Coupon**
```bash
curl -X POST http://localhost:5001/api/v1/coupons \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE20",
    "description": "Save 20%",
    "discountType": "percentage",
    "discountValue": 20,
    "maxUses": 100,
    "minOrderAmount": 50
  }'
```

**Example: Validate Coupon**
```bash
curl -X POST http://localhost:5001/api/v1/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE20",
    "orderTotal": 100
  }'
```

---

## Testing

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Test Coverage
- Product CRUD operations
- Stock deduction and validation
- Order creation with transactions
- Coupon validation and calculations
- Error handling and edge cases

---

## Architecture

### Folder Structure
```
ecommerce-api/
├── config/
│   └── database.js           # PostgreSQL connection
├── models/
│   ├── Product.js            # Product data layer
│   ├── Order.js              # Order data layer
│   └── Coupon.js             # Coupon data layer
├── controllers/
│   ├── productController.js  # Product business logic
│   ├── orderController.js    # Order business logic
│   └── couponController.js   # Coupon business logic
├── routes/
│   ├── products.js           # Product routes
│   ├── orders.js             # Order routes
│   └── coupons.js            # Coupon routes
├── middleware/
│   ├── errorHandler.js       # Global error handler
│   └── logger.js             # Request/error logging
├── __tests__/
│   ├── product.test.js       # Product tests
│   └── coupon.test.js        # Coupon tests
├── logs/                     # Application logs (auto-created)
├── .env                      # Environment variables
├── .gitignore
├── server.js                 # Entry point
├── jest.config.js            # Jest configuration
├── package.json
└── README.md
```

### Design Patterns Used

1. **Service Layer Pattern** - Separation of routes, controllers, and models
2. **Middleware Pattern** - Request processing pipeline
3. **Error Handling** - Centralized error handler
4. **Database Transactions** - ACID compliance for critical operations
5. **Logging** - File-based logging for debugging

---

## Deployment

### Option 1: Render.com (Recommended)

1. **Create Render account** - https://render.com
2. **Connect GitHub repository**
3. **Create PostgreSQL database** on Render
4. **Create Web Service** with environment variables:
   ```
   DATABASE_URL: your-render-database-url
   NODE_ENV: production
   ```
5. **Deploy** - Render automatically deploys on push to main branch

### Option 2: Railway.app

1. **Create Railway account** - https://railway.app
2. **Connect GitHub**
3. **Add PostgreSQL plugin**
4. **Set environment variables**
5. **Deploy with one click**

### Option 3: Heroku

1. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```
2. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```
3. **Deploy**
   ```bash
   git push heroku main
   ```

---

## Performance Considerations

- **Database Indexes** - Optimized queries for product category and order status
- **Connection Pooling** - Efficient database connection management
- **Pagination** - Prevents large dataset loading
- **Transaction Safety** - Prevents data corruption

---

## Security Features (Phase 2)

- Input validation and sanitization
- Error messages don't leak sensitive data
- Rate limiting (prepared for Day 4)
- JWT authentication (prepared for Day 4)

---

## API Response Format

All responses follow a consistent format:

**Success Response (2xx)**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ },
  "pagination": { /* if applicable */ }
}
```

**Error Response (4xx, 5xx)**
```json
{
  "success": false,
  "message": "Error description",
  "error_code": "ERR_CODE"
}
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see LICENSE file for details.

---

## Roadmap

### Phase 1 (Complete) 
- [x] Product management
- [x] Order processing
- [x] Inventory tracking
- [x] Discount system

### Phase 2 (In Progress)
- [ ] JWT authentication
- [ ] User roles and permissions
- [ ] Rate limiting
- [ ] API documentation (Swagger/OpenAPI)

### Phase 3 (Future)
- [ ] Payment integration
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Real-time inventory sync

---

## Support

For issues or questions, please create an issue in the repository.

---

**Built with by Jenny Rose Angeles**
