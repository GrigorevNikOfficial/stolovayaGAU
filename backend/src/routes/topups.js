import express from "express";
import { authenticateToken, requireAdmin } from "../controllers/auth.js";
import {
  createTopUpRequest,
  getAllTopUpRequests,
  getMyTopUpRequests,
  processTopUpRequest,
} from "../controllers/topUpRequestController.js";

const router = express.Router();

router.post("/", authenticateToken, createTopUpRequest);
router.get("/my", authenticateToken, getMyTopUpRequests);
router.get("/", authenticateToken, requireAdmin, getAllTopUpRequests);
router.put("/:id", authenticateToken, requireAdmin, processTopUpRequest);

export { router };
