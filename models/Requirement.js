import mongoose from 'mongoose';

// "Post Requirement" — user bolta hai mujhe room/worker chahiye
const requirementSchema = new mongoose.Schema({
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['room', 'worker', 'service', 'job'], required: true },

  title: { type: String, required: true },
  description: String,

  // Room requirement
  roomType: { type: String, enum: ['room', 'pg', 'flat', 'hostel', 'any'] },
  maxRent: Number,
  for: { type: String, enum: ['boys', 'girls', 'family', 'any'] },
  moveInDate: Date,

  // Worker/Service requirement
  category: String,
  budget: { min: Number, max: Number },
  requiredDate: Date,
  duration: String,

  // Common
  isActive: { type: Boolean, default: true },
  expiresAt: Date,
  responses: { type: Number, default: 0 },

  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
    address: String,
    area: String,
    city: { type: String, required: true },
    state: String,
  },
}, { timestamps: true });

requirementSchema.index({ location: '2dsphere' });
requirementSchema.index({ type: 1, isActive: 1 });
requirementSchema.index({ 'location.city': 1 });

export default mongoose.model('Requirement', requirementSchema);
