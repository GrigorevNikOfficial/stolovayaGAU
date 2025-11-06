import express from 'express';
import { getItemById, getItems, getItemsByCategory, createItem, updateItem, deleteItem } from '../controllers/itemController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/items - все блюда (публичный доступ)
router.get('/', getItems);

// GET /api/items/category/:category - блюда по категории (публичный доступ)
router.get('/category/:category', getItemsByCategory);

// GET /api/items/:id - блюдо по ID (публичный доступ)
router.get('/:id', getItemById);

// POST /api/items - создать блюдо (только админ)
router.post('/', authenticateToken, requireAdmin, createItem);

// PUT /api/items/:id - обновить блюдо (только админ)
router.put('/:id', authenticateToken, requireAdmin, updateItem);

// DELETE /api/items/:id - удалить блюдо (только админ)
router.delete('/:id', authenticateToken, requireAdmin, deleteItem);

export default router;