import express from 'express';
import { authenticateToken } from '../controllers/auth.js';
import {
    addParticipantsToChat,
    createDirectChat,
    createGroupChat,
    getChatById,
    getChatMessages,
    joinByInviteCode,
    leaveChat,
    listChats,
    regenerateInviteCode,
    sendMessage,
} from '../controllers/chatController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', listChats);
router.post('/direct', createDirectChat);
router.post('/group', createGroupChat);
router.post('/join', joinByInviteCode);
router.post('/:chatId/invite', regenerateInviteCode);
router.post('/:chatId/participants', addParticipantsToChat);
router.get('/:chatId', getChatById);
router.get('/:chatId/messages', getChatMessages);
router.post('/:chatId/messages', sendMessage);
router.post('/:chatId/leave', leaveChat);

export { router };

