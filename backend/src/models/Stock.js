import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
    pointId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Point',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    reserved: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    available: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    }
}, {
    timestamps: true
});

// Пред-сохранение для расчета available
stockSchema.pre('save', function(next) {
    this.available = Math.max(0, this.quantity - this.reserved);
    next();
});

// Уникальный индекс для комбинации точки и товара
stockSchema.index({ pointId: 1, productId: 1 }, { unique: true });

// Индексы для быстрого поиска
stockSchema.index({ pointId: 1 });
stockSchema.index({ productId: 1 });
stockSchema.index({ available: 1 });

export const Stock = mongoose.model('Stock', stockSchema);