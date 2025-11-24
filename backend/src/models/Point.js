// models/Point.js
import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['canteen', 'store'],
        required: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Теперь необязательное поле, так как связь через пользователя
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Индекс для быстрого поиска по менеджеру
pointSchema.index({ managerId: 1 });
pointSchema.index({ type: 1 });

export const Point = mongoose.model('Point', pointSchema);