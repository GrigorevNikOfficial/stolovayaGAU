import express from "express";
import { authenticateToken } from "../controllers/auth.js";
import {
  uploadMarketplaceAttachment,
  uploadEventImage,
} from "../controllers/uploadController.js";
import { singleFileUpload } from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/marketplace",
  authenticateToken,
  singleFileUpload("file"),
  uploadMarketplaceAttachment
);

router.post(
  "/events",
  authenticateToken,
  singleFileUpload("file"),
  uploadEventImage
);

export { router };
