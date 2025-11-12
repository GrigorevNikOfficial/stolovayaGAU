import express from 'express';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/categoriesController.js';
import { authenticateToken, requireAdminOrCanteenManager } from '../controllers/auth.js';

const router = express.Router();

// Публичные роуты
router.get('/', getCategories);

// Админ и canteenManager роуты
router.post('/', authenticateToken, requireAdminOrCanteenManager, createCategory);
router.put('/:id', authenticateToken, requireAdminOrCanteenManager, updateCategory);
router.delete('/:id', authenticateToken, requireAdminOrCanteenManager, deleteCategory);

export { router };