import { Event } from "../models/Event.js";
import { createUserNotification } from "./notificationService.js";

const TICK_MS = 60_000;
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

const shouldSendFifteenMinuteReminder = (event, now) => {
  if (event.status !== "published") return false;
  if (event.reminders?.fifteenMinutesSent) return false;
  const start = new Date(event.startDate).getTime();
  const nowMs = now.getTime();
  return start > nowMs && start <= nowMs + FIFTEEN_MINUTES_MS;
};

const shouldSendStartReminder = (event, now) => {
  if (event.reminders?.startSent) return false;
  const start = new Date(event.startDate).getTime();
  return start <= now.getTime();
};

const nextStatusForTime = (event, now) => {
  const start = new Date(event.startDate).getTime();
  const end = new Date(event.endDate).getTime();
  const ts = now.getTime();

  if (event.status === "published" && ts >= start) {
    return "ongoing";
  }

  if (event.status === "ongoing" && ts >= end) {
    return "completed";
  }

  return event.status;
};

const notifyParticipants = async (event, payloadBuilder) => {
  if (!event?.participants?.length) return;

  const participantIds = event.participants
    .filter((p) => (p.approvalStatus || "approved") === "approved")
    .map((p) => p.user?.toString?.() ?? p.user)
    .filter(Boolean);

  await Promise.all(
    participantIds.map((userId) =>
      createUserNotification({
        userId,
        category: "events",
        severity: "info",
        ...payloadBuilder(event),
      })
    )
  );
};

const processEvent = async (event, now) => {
  let dirty = false;
  const updatedEvent = event;

  if (!updatedEvent.reminders) {
    updatedEvent.reminders = { fifteenMinutesSent: false, startSent: false };
    dirty = true;
  }

  if (shouldSendFifteenMinuteReminder(updatedEvent, now)) {
    await notifyParticipants(updatedEvent, (evt) => ({
      title: "Событие скоро начнется",
      body: `До начала события "${evt.title}" осталось 15 минут`,
      actionLabel: "Открыть",
      actionUrl: `/events/${evt._id}`,
      sourceId: evt._id,
    }));
    updatedEvent.reminders.fifteenMinutesSent = true;
    dirty = true;
  }

  if (shouldSendStartReminder(updatedEvent, now)) {
    await notifyParticipants(updatedEvent, (evt) => ({
      title: "Событие началось",
      body: `Событие "${evt.title}" уже стартовало`,
      actionLabel: "Перейти",
      actionUrl: `/events/${evt._id}`,
      sourceId: evt._id,
    }));
    updatedEvent.reminders.startSent = true;
    dirty = true;
  }

  const nextStatus = nextStatusForTime(updatedEvent, now);
  if (nextStatus !== updatedEvent.status) {
    updatedEvent.status = nextStatus;
    dirty = true;
  }

  if (dirty) {
    await updatedEvent.save();
  }
};

const runEventMaintenance = async () => {
  const now = new Date();
  try {
    const candidates = await Event.find({
      status: { $in: ["published", "ongoing"] },
    });
    await Promise.all(candidates.map((event) => processEvent(event, now)));
  } catch (error) {
    console.error("Event scheduler error:", error);
  }
};

export const startEventScheduler = () => {
  runEventMaintenance();
  return setInterval(runEventMaintenance, TICK_MS);
};
