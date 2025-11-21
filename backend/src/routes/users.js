import express from "express";
import { authenticateToken, requireAdmin } from "../controllers/auth.js";
import {
    createEmployee,
    deleteUser,
    getAllUsers,
    getMe,
    login,
    register,
    topUpUserBalance,
    updateProfile,
    updateUserAvatar,
    updateUserRole,
} from "../controllers/userController.js";
import { singleImageUpload } from "../middleware/upload.js";

const router = express.Router();

// Публичные роуты
router.post("/register", register);
router.post("/login", login);

// Защищенные роуты
router.get("/me", authenticateToken, getMe);
router.put("/profile", authenticateToken, updateProfile);
router.patch(
  "/:id/avatar",
  authenticateToken,
  singleImageUpload("avatar"),
  updateUserAvatar
);

// Админ роуты
router.get("/", authenticateToken, requireAdmin, getAllUsers);
router.post("/employees", authenticateToken, requireAdmin, createEmployee);
router.put("/:id/role", authenticateToken, requireAdmin, updateUserRole);
router.delete("/:id", authenticateToken, requireAdmin, deleteUser);
router.post(
  "/:id/balance/top-up",
  authenticateToken,
  requireAdmin,
  topUpUserBalance
);

export { router };
