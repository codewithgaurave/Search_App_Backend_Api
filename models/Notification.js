import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: {
    type: String,
    enum: ['booking', 'chat', 'job', 'room', 'service', 'system', 'review'],
    default: 'system',
  },
  refId: mongoose.Schema.Types.ObjectId,
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);
