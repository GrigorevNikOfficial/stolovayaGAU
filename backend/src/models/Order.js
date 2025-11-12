import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    changed_at: {
        type: Date,
        default: Date.now
    }
});

const orderItemSchema = new mongoose.Schema({
    item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    uniq_nom: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price_at_time: {
        type: Number,
        required: true,
        min: 0
    }
});

const orderSchema = new mongoose.Schema({
    order_number: {
        type: String,
        required: true,
        unique: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user_info: {
        first_name: String,
        last_name: String,
        phone: String,
        email: String
    },
    items: [orderItemSchema],
    total_amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['created', 'cooking', 'waiting_delivery', 'in_transit', 'ready_for_pickup', 'completed', 'cancelled'],
        default: 'created'
    },
    status_history: [statusHistorySchema],
    delivery_method: {
        type: String,
        enum: ['dine_in', 'pickup', 'delivery'],
        required: true
    },
    table_number: {
        type: Number,
        required: function() { return this.delivery_method === 'dine_in'; }
    },
    delivery_address: {
        type: String,
        required: function() { return this.delivery_method === 'delivery'; }
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Генерация номера заказа
orderSchema.statics.generateOrderNumber = async function() {
    const count = await this.countDocuments();
    return `ORD-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;
};

// Middleware для добавления начальной истории
orderSchema.pre('save', function(next) {
    if (this.isNew) {
        this.status_history.push({
            status: 'created',
            notes: 'Заказ создан',
            changed_at: new Date()
        });
    }
    next();
});

export const Order = mongoose.model('Order', orderSchema);