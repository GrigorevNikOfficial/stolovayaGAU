import crypto from 'crypto';
import mongoose from 'mongoose';

const { Schema } = mongoose;

const participantSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['active', 'pending'],
      default: 'active',
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    invitedAt: {
      type: Date,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'private',
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: {
      type: [participantSchema],
      default: [],
    },
    lastMessageAt: {
      type: Date,
    },
    lastMessagePreview: {
      type: String,
      trim: true,
    },
    directKey: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ directKey: 1 }, { unique: true, sparse: true });

chatSchema.statics.buildDirectKey = (userA, userB) => {
  const ids = [userA.toString(), userB.toString()].sort();
  return ids.join(':');
};

chatSchema.statics.generateInviteCode = () =>
  crypto.randomBytes(8).toString('hex');

export const Chat = mongoose.model('Chat', chatSchema);
