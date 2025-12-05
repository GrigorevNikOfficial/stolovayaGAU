import express from 'express';
import { authenticateToken } from '../controllers/auth.js';
import {
  createServiceRequest,
  getServiceRequestById,
  getServiceRequests,
  updateServiceRequestStatus,
} from '../controllers/serviceRequestController.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createServiceRequest);
router.get('/', getServiceRequests);
router.get('/:id', getServiceRequestById);
router.patch('/:id/status', updateServiceRequestStatus);

export { router };
