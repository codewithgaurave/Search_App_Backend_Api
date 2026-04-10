import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const kycSchema = new mongoose.Schema({
  aadhaarNumber: { type: String, select: false },
  aadhaarFront: String,
  aadhaarBack: String,
  selfie: String,
  panNumber: { type: String, select: false },
  panImage: String,
  status: { type: String, enum: ['not_submitted', 'pending', 'verified', 'rejected'], default: 'not_submitted' },
  rejectionReason: String,
  verifiedAt: Date,
}, { _id: false });

const workExperienceSchema = new mongoose.Schema({
  title: String,
  company: String,
  years: Number,
  description: String,
}, { _id: false });

const availabilitySlotSchema = new mongoose.Schema({
  day: { type: String, enum: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
  startTime: String,
  endTime: String,
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  avatar: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  role: { type: String, enum: ['user', 'owner', 'worker', 'admin', 'ops'], default: 'user' },

  // Verification
  isVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  verificationBadge: { type: String, enum: ['none', 'basic', 'trusted', 'premium'], default: 'none' },
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  banReason: String,

  // KYC
  kyc: { type: kycSchema, default: () => ({}) },

  // Location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    address: String,
    area: String,
    city: String,
    state: String,
    pincode: String,
  },

  // Bio
  bio: { type: String, maxlength: 500 },
  languages: [String],
  gender: { type: String, enum: ['male', 'female', 'other'] },
  dateOfBirth: Date,

  // Worker specific
  skills: [String],
  workExperience: [workExperienceSchema],
  availabilitySlots: [availabilitySlotSchema],
  isAvailable: { type: Boolean, default: false },
  serviceRadius: { type: Number, default: 10 },
  totalJobsDone: { type: Number, default: 0 },
  responseTime: { type: Number, default: 0 }, // avg minutes
  completionRate: { type: Number, default: 0 }, // percentage

  // Owner specific
  totalListings: { type: Number, default: 0 },
  businessName: String,
  businessType: String,

  // Ratings
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },

  // Subscription
  plan: { type: String, enum: ['free', 'basic', 'premium', 'enterprise'], default: 'free' },
  planExpiry: Date,
  planFeatures: {
    maxListings: { type: Number, default: 3 },
    boostCredits: { type: Number, default: 0 },
    featuredBadge: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
  },

  // Wallet
  wallet: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },

  // Referral
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCount: { type: Number, default: 0 },
  referralEarnings: { type: Number, default: 0 },

  // Social
  savedRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  savedServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Reports
  reportCount: { type: Number, default: 0 },

  // Device & Auth
  fcmToken: String,
  deviceType: { type: String, enum: ['android', 'ios', 'web'] },
  lastSeen: Date,
  otp: { type: String, select: false },
  otpExpiry: { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpiry: { type: Date, select: false },
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });
userSchema.index({ role: 1, isActive: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (pass) {
  return bcrypt.compare(pass, this.password);
};

export default mongoose.model('User', userSchema);
