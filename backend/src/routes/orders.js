// routes/orders.js
import express from 'express';
import {
    createOrder,
    getMyOrders,
    getOrderHistory,
    getOrderById,
    updateOrderStatus,
    updateOrder,
    getAllOrders
} from '../controllers/orderController.js';
import { authenticateToken, requireAdmin, requireAdminOrStoreManager } from '../controllers/auth.js';

const router = express.Router();

// Защищенные роуты
router.post('/', authenticateToken, createOrder);
router.get('/my-orders', authenticateToken, getMyOrders);
router.get('/', authenticateToken, getAllOrders);
router.get('/:id/history', authenticateToken, getOrderHistory);
router.get('/:id', authenticateToken, getOrderById);
router.put('/:id/status', authenticateToken, updateOrderStatus);
router.put('/:id', authenticateToken, requireAdminOrStoreManager, updateOrder);

export { router };