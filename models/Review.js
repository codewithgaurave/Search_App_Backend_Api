import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  refType: { type: String, enum: ['room', 'job', 'service', 'worker', 'owner'], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },

  // Ratings
  rating: { type: Number, required: true, min: 1, max: 5 },
  subRatings: {
    cleanliness: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    accuracy: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 },
  },

  comment: { type: String, maxlength: 1000 },
  images: [String],

  // Owner reply
  reply: String,
  repliedAt: Date,

  isApproved: { type: Boolean, default: true },
  isHidden: { type: Boolean, default: false },
  helpfulCount: { type: Number, default: 0 },
  helpfulBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

reviewSchema.index({ refId: 1, refType: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ targetUser: 1 });

export default mongoose.model('Review', reviewSchema);
