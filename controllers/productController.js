const Product = require('../models/Product');

// Create a new product
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock_quantity } = req.body;

    // Validation
    if (!name || !price || stock_quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, price, stock_quantity',
      });
    }

    if (price < 0 || stock_quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price and stock quantity cannot be negative',
      });
    }

    const product = await Product.create(name, description, price, category, stock_quantity);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Get all products
exports.getAllProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page and limit must be positive integers',
      });
    }

    const products = await Product.getAll(page, limit);
    const totalCount = await Product.getTotalCount();

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        limit,
        totalProducts: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get product by ID
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.getById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const products = await Product.getByCategory(category, page, limit);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Search products
exports.searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const products = await Product.search(q, page, limit);

    res.status(200).json({
      success: true,
      data: products,
      query: q,
      pagination: {
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update product
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock_quantity } = req.body;

    // Check if product exists
    const existingProduct = await Product.getById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Use existing values if not provided
    const updatedProduct = await Product.update(
      id,
      name || existingProduct.name,
      description || existingProduct.description,
      price !== undefined ? price : existingProduct.price,
      category || existingProduct.category,
      stock_quantity !== undefined ? stock_quantity : existingProduct.stock_quantity,
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// Delete product
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.delete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Deduct stock
exports.deductStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number',
      });
    }

    const product = await Product.deductStock(id, quantity);

    if (!product) {
      return res.status(400).json({
        success: false,
        message: 'Product not found or insufficient stock',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stock deducted successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};