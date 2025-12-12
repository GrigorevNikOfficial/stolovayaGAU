import mongoose from 'mongoose';

const workApplicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const workSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, default: '' },
    salaryText: { type: String, default: '' },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applications: [workApplicationSchema],
  },
  { timestamps: true }
);

export const Work = mongoose.model('Work', workSchema);