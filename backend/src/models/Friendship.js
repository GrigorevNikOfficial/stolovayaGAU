import mongoose from 'mongoose';

const { Schema } = mongoose;

const friendshipSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    addressee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

friendshipSchema.index({ requester: 1, addressee: 1 }, { unique: true });
friendshipSchema.index({ addressee: 1, status: 1 });
friendshipSchema.index({ requester: 1, status: 1 });

export const Friendship = mongoose.model('Friendship', friendshipSchema);
