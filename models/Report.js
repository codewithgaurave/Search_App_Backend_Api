import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  refType: { type: String, enum: ['room', 'job', 'service', 'user', 'review'], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: {
    type: String,
    enum: [
      'fake-listing', 'wrong-info', 'fraud', 'spam', 'inappropriate-content',
      'duplicate', 'wrong-price', 'harassment', 'scam', 'other'
    ],
    required: true,
  },
  description: String,
  evidence: [String], // image urls
  status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  actionTaken: String,
}, { timestamps: true });

reportSchema.index({ refId: 1, refType: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ reportedBy: 1 });

export default mongoose.model('Report', reportSchema);
