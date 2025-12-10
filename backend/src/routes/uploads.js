import express from 'express';
import { authenticateToken } from '../controllers/auth.js';
import { uploadMarketplaceAttachment } from '../controllers/uploadController.js';
import { singleFileUpload } from '../middleware/upload.js';

const router = express.Router();

router.post(
  '/marketplace',
  authenticateToken,
  singleFileUpload('file'),
  uploadMarketplaceAttachment
);

export { router };
