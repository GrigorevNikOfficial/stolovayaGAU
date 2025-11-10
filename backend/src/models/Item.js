import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
    uniq_nom: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category_slug: {
        type: String,
        required: true
    },
    calories: {  // ← ИЗМЕНИТЕ cal на calories!
        type: Number,
        default: 0
    },
    number_pribors: {
        type: Number,
        default: 1
    },
    is_available: {
        type: Boolean,
        default: true
    },
    ingredients: [String],  // ← ДОБАВЬТЕ эти поля!
    allergens: [String],
    preparation_time: {
        type: Number,
        default: 5
    },
    nutrition: {
        type: Object,
        default: {}
    },
    sort_order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export const Item = mongoose.model('Item', itemSchema);