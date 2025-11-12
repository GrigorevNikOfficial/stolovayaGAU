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
// Важно: конкретные пути должны быть ДО динамических
router.get('/my-orders', authenticateToken, getMyOrders);
// Админ, storeManager и canteenManager роуты - получить все заказы (должен быть ДО /:id)
// ВАЖНО: этот роут должен быть ДО всех динамических роутов
router.get('/', authenticateToken, (req, res, next) => {
  console.log('=== РОУТ /api/orders/ ВЫЗВАН ===');
  console.log('req.method:', req.method);
  console.log('req.path:', req.path);
  console.log('req.user:', req.user ? { _id: req.user._id, role: req.user.role } : 'null');
  next();
}, getAllOrders);
router.get('/:id/history', authenticateToken, getOrderHistory);
router.get('/:id', authenticateToken, getOrderById);

// Админ, canteenManager и storeManager роуты для изменения статуса
router.put('/:id/status', authenticateToken, updateOrderStatus);

// Админ и storeManager роуты
router.put('/:id', authenticateToken, requireAdminOrStoreManager, updateOrder);

export { router };