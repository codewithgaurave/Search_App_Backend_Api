import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  refType: { type: String, enum: ['room', 'service'], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, required: true },

  // Booking Details
  scheduledDate: Date,
  scheduledTime: String,
  duration: String,
  address: String,
  note: String,

  // Status Flow: pending → confirmed → in-progress → completed / cancelled
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending',
  },
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
  }],
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellationReason: String,

  // Payment
  amount: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  workerEarning: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['unpaid', 'token-paid', 'paid', 'refunded', 'partial-refund'], default: 'unpaid' },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'wallet', 'card', 'netbanking'] },
  transactionId: String,
  tokenAmount: { type: Number, default: 0 },
  tokenPaid: { type: Boolean, default: false },

  // Review
  isReviewed: { type: Boolean, default: false },
}, { timestamps: true });

bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ owner: 1, status: 1 });
bookingSchema.index({ refId: 1 });

export default mongoose.model('Booking', bookingSchema);
