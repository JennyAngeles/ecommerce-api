const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Create a new order
router.post('/', orderController.createOrder);

// Get all orders
router.get('/', orderController.getAllOrders);

// Get order statistics
router.get('/stats', orderController.getOrderStats);

// Get orders by status
router.get('/status/:status', orderController.getOrdersByStatus);

// Get order by ID
router.get('/:id', orderController.getOrderById);

// Update order status
router.patch('/:id/status', orderController.updateOrderStatus);

// Cancel order (restore stock)
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router;