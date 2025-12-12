import mongoose from "mongoose";

const CATEGORY_VALUES = [
  "orders",
  "marketplace",
  "system",
  "chat",
  "balance",
  "topups",
  "events",
];
const SEVERITY_VALUES = ["info", "success", "warning", "danger"];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: CATEGORY_VALUES,
      default: "system",
      index: true,
    },
    severity: {
      type: String,
      enum: SEVERITY_VALUES,
      default: "info",
    },
    type: {
      type: String,
      default: "generic",
    },
    topic: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
    actionLabel: {
      type: String,
      default: null,
    },
    actionUrl: {
      type: String,
      default: null,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    muted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

notificationSchema.methods.markAsRead = function () {
  if (this.read) {
    return this;
  }
  this.read = true;
  this.readAt = new Date();
  return this;
};

export const Notification = mongoose.model("Notification", notificationSchema);
