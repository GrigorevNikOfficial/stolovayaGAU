import express from 'express';
import { getItemById, getItems, getItemsByCategory } from '../controllers/itemController.js';

const router = express.Router();

// GET /api/items - все блюда
router.get('/', getItems);

// GET /api/items/:id - блюдо по ID
router.get('/:id', getItemById);

// GET /api/items/category/:category - блюда по категории
router.get('/category/:category', getItemsByCategory);

export default router;