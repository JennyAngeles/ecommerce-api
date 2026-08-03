const Order = require('../models/Order');
const Product = require('../models/Product');

// Create a new order
exports.createOrder = async (req, res, next) => {
  try {
    const { items } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.product_id || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have product_id and quantity',
        });
      }

      if (item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0',
        });
      }
    }

    // Create order (with transaction)
    const order = await Order.create(items);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Get all orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page and limit must be positive integers',
      });
    }

    const orders = await Order.getAll(page, limit);
    const totalCount = await Order.getTotalCount();

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: page,
        limit,
        totalOrders: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get order by ID
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.getById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Get orders by status
exports.getOrdersByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`,
      });
    }

    const orders = await Order.getByStatus(status, page, limit);

    res.status(200).json({
      success: true,
      data: orders,
      status,
      pagination: {
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update order status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const order = await Order.updateStatus(id, status);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel order (restores stock)
exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.cancel(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled and stock restored',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Get order statistics
exports.getOrderStats = async (req, res, next) => {
  try {
    const stats = await Order.getTotalCount();

    res.status(200).json({
      success: true,
      data: {
        totalOrders: stats,
      },
    });
  } catch (error) {
    next(error);
  }
};