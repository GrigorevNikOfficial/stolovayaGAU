import mongoose from "mongoose";

const defaultCategories = {
  orders: true,
  marketplace: true,
  system: true,
  chat: true,
  balance: true,
  topups: true,
  events: true,
};

const defaultChannels = {
  inApp: true,
  email: false,
  push: false,
};

const quietHoursSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    from: {
      type: String,
      default: "22:00",
    },
    to: {
      type: String,
      default: "08:00",
    },
  },
  { _id: false }
);

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    categories: {
      type: Map,
      of: Boolean,
      default: () => ({ ...defaultCategories }),
    },
    channels: {
      type: Map,
      of: Boolean,
      default: () => ({ ...defaultChannels }),
    },
    soundEnabled: {
      type: Boolean,
      default: true,
    },
    digestEnabled: {
      type: Boolean,
      default: true,
    },
    quietHours: {
      type: quietHoursSchema,
      default: () => ({ enabled: false, from: "22:00", to: "08:00" }),
    },
    mutedUntil: {
      type: Date,
      default: null,
    },
    timezone: {
      type: String,
      default: "Europe/Moscow",
    },
  },
  {
    timestamps: true,
  }
);

export const NotificationPreference = mongoose.model(
  "NotificationPreference",
  notificationPreferenceSchema
);
