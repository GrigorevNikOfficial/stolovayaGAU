import mongoose from 'mongoose';

const internshipApplicationSchema = new mongoose.Schema(
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

const internshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    company: { type: String, default: '' },
    location: { type: String, default: '' },
    workFormat: { type: String, enum: ['onsite', 'remote', 'hybrid', 'unspecified'], default: 'unspecified' },
    employmentType: { type: String, enum: ['full', 'part', 'intern', 'unspecified'], default: 'intern' },
    hoursPerDay: { type: Number, default: 0 },
    expectedSalary: { type: String, default: '' },
    skills: { type: [String], default: [] },
    experienceLevel: { type: String, default: '' },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applications: [internshipApplicationSchema],
  },
  { timestamps: true }
);

export const Internship = mongoose.model('Internship', internshipSchema);