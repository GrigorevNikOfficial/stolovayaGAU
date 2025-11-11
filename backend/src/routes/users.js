import express from 'express';
import {
    register,
    login,
    getMe,
    updateProfile,
    getAllUsers,
    updateUserRole,
    updateUserAvatar
} from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../controllers/auth.js';
import { singleImageUpload } from '../middleware/upload.js';

const router = express.Router();

// Публичные роуты
router.post('/register', register);
router.post('/login', login);

// Защищенные роуты
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.patch('/:id/avatar', authenticateToken, singleImageUpload('avatar'), updateUserAvatar);

// Админ роуты
router.get('/', authenticateToken, requireAdmin, getAllUsers);
router.put('/:id/role', authenticateToken, requireAdmin, updateUserRole);

export { router };