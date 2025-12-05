import express from 'express';
import { authenticateToken } from '../controllers/auth.js';
import { getTransactions, processServicePayment } from '../controllers/paymentController.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/pay', processServicePayment);
router.get('/transactions', getTransactions);

export { router };
