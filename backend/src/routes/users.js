import express from 'express';
import {
    register,
    login,
    getMe,
    updateProfile,
    getAllUsers,
    updateUserRole
} from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../controllers/auth.js';

const router = express.Router();

// Публичные роуты
router.post('/register', register);
router.post('/login', login);

// Защищенные роуты
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

// Админ роуты
router.get('/', authenticateToken, requireAdmin, getAllUsers);
router.put('/:id/role', authenticateToken, requireAdmin, updateUserRole);

export { router };