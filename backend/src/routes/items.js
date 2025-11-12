import express from 'express';
import {
    getItems,
    getItemById,
    getItemsByCategory,
    createItem,
    updateItem,
    deleteItem,
    uploadItemImage
} from '../controllers/itemController.js';
import { authenticateToken, requireAdminOrCanteenManager } from '../controllers/auth.js';
import { singleImageUpload } from '../middleware/upload.js';

const router = express.Router();

// Публичные роуты
router.get('/', getItems);
router.get('/:id', getItemById);
router.get('/category/:category_slug', getItemsByCategory);

// Админ и canteenManager роуты
router.post('/', authenticateToken, requireAdminOrCanteenManager, createItem);
router.put('/:id', authenticateToken, requireAdminOrCanteenManager, updateItem);
router.delete('/:id', authenticateToken, requireAdminOrCanteenManager, deleteItem);
router.post('/:id/image', authenticateToken, requireAdminOrCanteenManager, singleImageUpload('image'), uploadItemImage);

export { router };