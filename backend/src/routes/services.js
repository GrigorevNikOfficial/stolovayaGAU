import express from 'express';
import { authenticateToken } from '../controllers/auth.js';
import {
  createServiceListing,
  getServiceListingById,
  getServiceListings,
  getMyServiceListings,
  deleteServiceListing,
  toggleServiceListingStatus,
  updateServiceListing,
} from '../controllers/serviceController.js';

const router = express.Router();

router.get('/', getServiceListings);
router.get('/mine', authenticateToken, getMyServiceListings);
router.get('/:id', getServiceListingById);

router.post('/', authenticateToken, createServiceListing);
router.put('/:id', authenticateToken, updateServiceListing);
router.patch('/:id/status', authenticateToken, toggleServiceListingStatus);
router.delete('/:id', authenticateToken, deleteServiceListing);

export { router };
