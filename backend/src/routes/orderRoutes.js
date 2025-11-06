import express from 'express';
import {
    createOrder,
    getMyOrders,
    getOrderById,
    getOrderHistory,
    updateOrderStatus  // Добавляем новый импорт
} from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.get('/:id/history', getOrderHistory);
router.put('/:id', updateOrderStatus); // Добавляем новый route

export default router;