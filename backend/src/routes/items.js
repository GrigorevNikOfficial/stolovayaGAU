import express from 'express';
import {
    getItems,
    getItemById,
    getItemsByCategory,
    createItem,
    updateItem,
    deleteItem
} from '../controllers/itemController.js';
import { authenticateToken, requireAdmin } from '../controllers/auth.js';

const router = express.Router();

// Публичные роуты
router.get('/', getItems);
router.get('/:id', getItemById);
router.get('/category/:category_slug', getItemsByCategory);

// Админ роуты
router.post('/', authenticateToken, requireAdmin, createItem);
router.put('/:id', authenticateToken, requireAdmin, updateItem);
router.delete('/:id', authenticateToken, requireAdmin, deleteItem);

export { router };