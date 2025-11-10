import express from 'express';
import {
    createOrder,
    getMyOrders,
    getOrderHistory,
    getOrderById,
    updateOrderStatus,
    getAllOrders
} from '../controllers/orderController.js';
import { authenticateToken, requireAdmin } from '../controllers/auth.js';

const router = express.Router();

// Защищенные роуты
router.post('/', authenticateToken, createOrder);
router.get('/my-orders', authenticateToken, getMyOrders);
router.get('/:id/history', authenticateToken, getOrderHistory);
router.get('/:id', authenticateToken, getOrderById);

// Админ роуты
router.get('/', authenticateToken, requireAdmin, getAllOrders);
router.put('/:id/status', authenticateToken, requireAdmin, updateOrderStatus);

export { router };