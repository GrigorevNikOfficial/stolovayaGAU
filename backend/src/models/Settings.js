// models/Settings.js
const mongoose = require('mongoose');

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
        default: "09:00"
    },
    deliveryTimeEnd: {
        type: String,
        default: "22:00"
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);