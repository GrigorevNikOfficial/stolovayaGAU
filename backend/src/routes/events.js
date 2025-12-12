import express from "express";
import { authenticateToken, requireAdmin } from "../controllers/auth.js";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  checkInToEvent,
  addEventReview,
  getMyEvents,
  getOrganizedEvents,
  approveParticipant,
  rejectParticipant,
  removeParticipant,
  addParticipantManually,
} from "../controllers/eventController.js";

const router = express.Router();

// Public routes (authenticated users only)
router.use(authenticateToken);

// Event CRUD
router.post("/", createEvent);
router.get("/", getEvents);
router.get("/my", getMyEvents);
router.get("/organized", getOrganizedEvents);
router.get("/:eventId", getEventById);
router.put("/:eventId", updateEvent);
router.delete("/:eventId", deleteEvent);

// Approvals
router.post(
  "/:eventId/participants/:participantId/approve",
  approveParticipant
);
router.post("/:eventId/participants/:participantId/reject", rejectParticipant);
router.delete("/:eventId/participants/:participantId", removeParticipant);
router.post("/:eventId/participants", addParticipantManually);

// Registration
router.post("/:eventId/register", registerForEvent);
router.post("/:eventId/unregister", unregisterFromEvent);

// Check-in
router.post("/checkin", checkInToEvent);

// Reviews
router.post("/:eventId/review", addEventReview);

export { router };
