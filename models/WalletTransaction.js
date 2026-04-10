import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  category: {
    type: String,
    enum: ['booking', 'refund', 'referral', 'cashback', 'withdrawal', 'topup', 'platform-fee', 'boost', 'subscription'],
    required: true,
  },
  amount: { type: Number, required: true },
  balanceBefore: Number,
  balanceAfter: Number,
  description: String,
  refId: mongoose.Schema.Types.ObjectId,
  refType: String,
  status: { type: String, enum: ['pending', 'completed', 'failed', 'reversed'], default: 'completed' },
  transactionId: String,
}, { timestamps: true });

walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ category: 1 });

export default mongoose.model('WalletTransaction', walletTransactionSchema);
