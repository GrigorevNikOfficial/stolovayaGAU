// src/models/Settings.js
import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        default: 'main'
    },
    deliveryEnabled: {
        type: Boolean,
        default: false
    },
    deliveryTimeStart: {
        type: String,
        default: "08:00"
    },
    deliveryTimeEnd: {
        type: String,
        default: "10:00"
    },
    pickupTimeStart: {
        type: String,
        default: "08:00"
    },
    pickupTimeEnd: {
        type: String,
        default: "22:00"
    },
    dineInTimeStart: {
        type: String,
        default: "08:00"
    },
    dineInTimeEnd: {
        type: String,
        default: "22:00"
    },
    serviceFeeType: {
        type: String,
        enum: ['percent', 'fixed'],
        default: 'percent'
    },
    serviceFeeValue: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// Используем именованный экспорт
export const Settings = mongoose.model('Settings', settingsSchema);