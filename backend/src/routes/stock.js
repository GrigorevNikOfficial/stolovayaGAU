import express from 'express';
import {
    getStock,
    getStockWithDetails,
    getStockByPoint,
    getStockByProduct,
    getStockItem,
    getStockByPointAndProduct,
    createStock,
    updateStock,
    deleteStock,
    reserveStock,
    releaseStock,
    updateStockQuantity
} from '../controllers/stockController.js';
import { authenticateToken, requireAdminOrCanteenManager } from '../controllers/auth.js';

const router = express.Router();

// Публичные роуты
router.get('/', getStock);
router.get('/with-details', getStockWithDetails);
router.get('/point/:pointId', getStockByPoint);
router.get('/product/:productId', getStockByProduct);
router.get('/:id', getStockItem);
router.get('/point/:pointId/product/:productId', getStockByPointAndProduct);

// Защищенные роуты
router.post('/', authenticateToken, requireAdminOrCanteenManager, createStock);
router.put('/:id', authenticateToken, requireAdminOrCanteenManager, updateStock);
router.delete('/:id', authenticateToken, requireAdminOrCanteenManager, deleteStock);
router.post('/reserve', authenticateToken, reserveStock);
router.post('/release', authenticateToken, releaseStock);
router.patch('/:id/quantity', authenticateToken, requireAdminOrCanteenManager, updateStockQuantity);

export { router };