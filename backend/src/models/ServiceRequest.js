import mongoose from 'mongoose';

const serviceRequestSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceListing',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    scheduledDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    address: {
      type: String,
      trim: true,
    },
    files: {
      type: [String],
      default: [],
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      unique: true,
      sparse: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

serviceRequestSchema.index({ providerId: 1, status: 1, createdAt: -1 });
serviceRequestSchema.index({ customerId: 1, status: 1, createdAt: -1 });

export const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
