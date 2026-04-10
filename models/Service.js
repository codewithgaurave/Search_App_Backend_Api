import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Basic Info
  title: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 2000 },
  category: {
    type: String,
    enum: [
      'plumber', 'electrician', 'carpenter', 'maid', 'painter', 'cleaner',
      'ac-repair', 'appliance-repair', 'pest-control', 'shifting-packing',
      'driver', 'cook', 'babysitter', 'nurse', 'tutor', 'security',
      'gardener', 'mechanic', 'tailor', 'other'
    ],
    required: true,
  },
  subCategory: String,
  skills: [String],
  experience: { type: Number, default: 0 }, // years

  // Pricing
  price: {
    amount: Number,
    minAmount: Number,
    maxAmount: Number,
    type: { type: String, enum: ['hourly', 'daily', 'fixed', 'negotiable'], default: 'negotiable' },
    currency: { type: String, default: 'INR' },
  },

  // Availability
  availableDays: [{ type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] }],
  availableTime: { start: String, end: String },
  responseTime: { type: Number, default: 30 }, // minutes

  // Media
  images: [String],
  portfolioImages: [String],
  videoUrl: String,

  // Status
  isAvailable: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,

  // Analytics
  views: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  totalBookings: { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },

  // Ratings
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },

  // Boost
  boostExpiry: Date,
  boostPlan: { type: String, enum: ['none', 'basic', 'premium', 'top'], default: 'none' },

  // Location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
    address: String,
    area: String,
    city: { type: String, required: true },
    state: String,
    pincode: String,
  },
  serviceRadius: { type: Number, default: 10 }, // km

  // Flags
  reportCount: { type: Number, default: 0 },
  isFraudSuspected: { type: Boolean, default: false },
}, { timestamps: true });

serviceSchema.index({ location: '2dsphere' });
serviceSchema.index({ category: 1, isApproved: 1, isAvailable: 1 });
serviceSchema.index({ 'location.city': 1 });
serviceSchema.index({ worker: 1 });
serviceSchema.index({ rating: -1, isFeatured: -1 });

export default mongoose.model('Service', serviceSchema);
