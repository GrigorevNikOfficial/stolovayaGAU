import express from 'express';
import {
    createOrder,
    getMyOrders,
    getOrderById,
    getOrderHistory  // Теперь этот экспорт существует
} from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.get('/:id/history', getOrderHistory);

export default router;