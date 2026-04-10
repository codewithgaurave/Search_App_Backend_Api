import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: String,
  image: String,
  type: { type: String, enum: ['text', 'image', 'system', 'quick-reply'], default: 'text' },
  quickReply: String,
  isRead: { type: Boolean, default: false },
  readAt: Date,
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  refType: { type: String, enum: ['room', 'job', 'service'] },
  refId: mongoose.Schema.Types.ObjectId,
  messages: [messageSchema],
  lastMessage: String,
  lastMessageAt: Date,
  lastMessageBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  unreadCount: {
    type: Map,
    of: Number,
    default: {},
  },
  isBlocked: { type: Boolean, default: false },
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isMuted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageAt: -1 });

export default mongoose.model('Chat', chatSchema);
