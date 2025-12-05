import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRequest',
      required: true,
      unique: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceListing',
      required: true,
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    payoutAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    type: {
      type: String,
      enum: ['service_payment', 'refund', 'payout'],
      default: 'service_payment',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    processedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ customerId: 1, createdAt: -1 });
transactionSchema.index({ providerId: 1, createdAt: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
