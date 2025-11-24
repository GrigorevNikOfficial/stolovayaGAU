// routes/points.js
import express from "express";
import {
  getPoints,
  getPointById,
  createPoint,
  updatePoint,
  deletePoint,
} from "../controllers/pointController.js";
import {
  authenticateToken,
  requireAdminOrCanteenManager,
} from "../controllers/auth.js";

const router = express.Router();

// Публичные роуты
router.get("/", getPoints);
router.get("/:id", getPointById);

// Защищенные роуты
router.post("/", authenticateToken, requireAdminOrCanteenManager, createPoint);
router.put(
  "/:id",
  authenticateToken,
  requireAdminOrCanteenManager,
  updatePoint
);
router.delete(
  "/:id",
  authenticateToken,
  requireAdminOrCanteenManager,
  deletePoint
);

export { router };
