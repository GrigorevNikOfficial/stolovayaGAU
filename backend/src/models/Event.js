import mongoose from 'mongoose';

const { Schema } = mongoose;

const eventParticipantSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    registeredAt: { type: Date, default: Date.now },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date, default: null },
  },
  { _id: false }
);

const eventReviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['seminar', 'hackathon', 'party', 'workshop', 'conference', 'other'],
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    participants: {
      type: [eventParticipantSchema],
      default: [],
    },
    reviews: {
      type: [eventReviewSchema],
      default: [],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    qrCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      default: null,
    },
    image: {
      key: {
        type: String,
        default: null,
      },
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and filtering
eventSchema.index({ title: 'text', description: 'text' });
eventSchema.index({ startDate: 1, type: 1 });
eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ 'participants.user': 1 });

// Methods
eventSchema.methods.isUserRegistered = function (userId) {
  return this.participants.some(
    (p) => p.user.toString() === userId.toString()
  );
};

eventSchema.methods.hasCapacity = function () {
  return this.participants.length < this.capacity;
};

eventSchema.methods.updateAverageRating = function () {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = sum / this.reviews.length;
  }
  return this.averageRating;
};

// Statics
eventSchema.statics.generateQRCode = function () {
  return `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export const Event = mongoose.model('Event', eventSchema);
