import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Basic Info
  title: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 2000 },
  category: {
    type: String,
    enum: ['labour', 'skilled', 'part-time', 'full-time', 'gig', 'internship', 'contract', 'freelance'],
    required: true,
  },
  subCategory: String,
  skills: [String],
  qualifications: [String],

  // Salary
  salary: {
    min: Number,
    max: Number,
    type: { type: String, enum: ['hourly', 'daily', 'weekly', 'monthly', 'fixed', 'negotiable'], default: 'daily' },
    currency: { type: String, default: 'INR' },
  },
  perks: [String], // food, accommodation, transport etc

  // Job Details
  openings: { type: Number, default: 1 },
  experience: {
    min: { type: Number, default: 0 }, // years
    max: Number,
  },
  workType: { type: String, enum: ['on-site', 'remote', 'hybrid'], default: 'on-site' },
  workHours: { type: String }, // e.g. "9am-6pm"
  workDays: [String], // ['mon','tue',...]
  startDate: Date,
  duration: String, // e.g. "3 months", "permanent"
  gender: { type: String, enum: ['male', 'female', 'any'], default: 'any' },
  ageLimit: { min: Number, max: Number },

  // Media
  images: [String],

  // Status
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isUrgent: { type: Boolean, default: false },
  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,
  expiresAt: Date,

  // Analytics
  views: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },

  // Applications
  applicants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appliedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['applied', 'shortlisted', 'rejected', 'hired'], default: 'applied' },
    note: String,
  }],
  totalApplicants: { type: Number, default: 0 },

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

  // Flags
  reportCount: { type: Number, default: 0 },
  isFraudSuspected: { type: Boolean, default: false },
}, { timestamps: true });

jobSchema.index({ location: '2dsphere' });
jobSchema.index({ category: 1, isApproved: 1, isActive: 1 });
jobSchema.index({ 'location.city': 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ isFeatured: -1, isUrgent: -1 });

export default mongoose.model('Job', jobSchema);
