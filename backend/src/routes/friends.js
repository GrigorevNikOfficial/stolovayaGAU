import express from 'express';
import { authenticateToken } from '../controllers/auth.js';
import {
    listFriendRequests,
    listFriends,
    removeFriendship,
    respondToFriendRequest,
    searchPeople,
    sendFriendRequest,
} from '../controllers/friendController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', listFriends);
router.get('/requests', listFriendRequests);
router.get('/search', searchPeople);
router.post('/requests', sendFriendRequest);
router.patch('/requests/:requestId', respondToFriendRequest);
router.delete('/:friendId', removeFriendship);

export { router };

