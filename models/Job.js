import mongoose from 'mongoose';

const JOB_CATEGORIES = [
  // 🏠 Home Services
  'plumber', 'electrician', 'carpenter', 'painter', 'cleaner',
  'ac-repair', 'appliance-repair', 'pest-control', 'shifting-packing',
  'gardener', 'security-guard', 'housekeeping',

  // 👷 Construction & Labour
  'mason', 'labour', 'welder', 'tile-work', 'civil-work',

  // 🚗 Vehicle
  'driver', 'mechanic', 'delivery',

  // 🍳 Domestic
  'cook', 'maid', 'babysitter', 'nurse', 'elderly-care',

  // 📚 Education
  'tutor', 'coaching',

  // 💼 Office & Business
  'data-entry', 'receptionist', 'sales', 'marketing', 'accountant',

  // 🛍️ Retail & Shop
  'shop-helper', 'cashier', 'warehouse',

  // 🌾 Agriculture
  'farming', 'harvesting',

  // 🎨 Creative
  'tailor', 'photographer', 'event-helper',

  // 💻 Tech
  'it-support', 'mobile-repair',

  // 🏋️ Other
  'gym-trainer', 'other',
];

const interestedWorkerSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interestedAt: { type: Date, default: Date.now },
  message: String, // worker ka short message
  status: {
    type: String,
    enum: ['interested', 'contacted', 'selected', 'rejected'],
    default: 'interested',
  },
}, { _id: true });

const jobSchema = new mongoose.Schema({
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ── Basic Info ──────────────────────────────
  title: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 2000 },
  category: { type: String, enum: JOB_CATEGORIES, required: true },
  subCategory: String,

  // ── Budget ──────────────────────────────────
  budget: {
    amount: Number,
    type: { type: String, enum: ['hourly', 'daily', 'fixed', 'negotiable'], default: 'negotiable' },
  },

  // ── Job Details ─────────────────────────────
  workersNeeded: { type: Number, default: 1 },
  duration: String,       // "1 din", "1 hafte", "permanent"
  startDate: Date,
  startTime: String,      // "subah 9 baje"
  gender: { type: String, enum: ['male', 'female', 'any'], default: 'any' },
  isUrgent: { type: Boolean, default: false },

  // ── Media ───────────────────────────────────
  images: [String],

  // ── Status Flow ─────────────────────────────
  // open → in-progress → completed → closed
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled', 'expired'],
    default: 'open',
  },

  // ── Approval ────────────────────────────────
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,
  expiresAt: Date,

  // ── Interested Workers ───────────────────────
  interestedWorkers: [interestedWorkerSchema],
  totalInterested: { type: Number, default: 0 },

  // ── Selected Worker ──────────────────────────
  selectedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  selectedAt: Date,

  // ── Completion ───────────────────────────────
  completedAt: Date,
  completionNote: String,
  isReviewed: { type: Boolean, default: false },

  // ── Analytics ────────────────────────────────
  views: { type: Number, default: 0 },
  contactViews: { type: Number, default: 0 },

  // ── Boost ────────────────────────────────────
  boostExpiry: Date,
  boostPlan: { type: String, enum: ['none', 'basic', 'premium', 'top'], default: 'none' },

  // ── Location ─────────────────────────────────
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
    address: String,
    area: String,
    city: { type: String, required: true },
    state: String,
    pincode: String,
  },

  // ── Flags ────────────────────────────────────
  reportCount: { type: Number, default: 0 },
  isFraudSuspected: { type: Boolean, default: false },

}, { timestamps: true });

jobSchema.index({ location: '2dsphere' });
jobSchema.index({ category: 1, status: 1, isApproved: 1, isActive: 1 });
jobSchema.index({ 'location.city': 1, category: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ status: 1, isActive: 1 });
jobSchema.index({ isFeatured: -1, isUrgent: -1, createdAt: -1 });

export { JOB_CATEGORIES };
export default mongoose.model('Job', jobSchema);
