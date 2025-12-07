import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    days: {
      type: [String],
      default: [],
    },
    timeSlots: {
      type: [
        {
          start: { type: String, required: true },
          end: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const serviceListingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['request', 'offer'],
      default: 'request',
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentHold: {
      type: Number,
      default: 0,
      min: 0,
    },
    pricingType: {
      type: String,
      enum: ['fixed', 'hourly', 'package'],
      default: 'fixed',
    },
    tags: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    availability: {
      type: availabilitySchema,
      default: () => ({ days: [], timeSlots: [] }),
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    portfolio: {
      type: [String],
      default: [],
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

serviceListingSchema.index({ title: 'text', description: 'text', tags: 'text', skills: 'text' });
serviceListingSchema.index({ category: 1, price: 1 });
serviceListingSchema.index({ rating: -1 });

export const ServiceListing = mongoose.model('ServiceListing', serviceListingSchema);
