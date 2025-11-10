import express from 'express';
import {
    getCategories,
    createCategory,
    updateCategory
} from '../controllers/categoriesController.js';
import { authenticateToken, requireAdmin } from '../controllers/auth.js';

const router = express.Router();

// Публичные роуты
router.get('/', getCategories);

// Админ роуты
router.post('/', authenticateToken, requireAdmin, createCategory);
router.put('/:id', authenticateToken, requireAdmin, updateCategory);

export { router };