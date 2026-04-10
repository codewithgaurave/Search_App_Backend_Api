import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Basic Info
  title: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 2000 },
  type: { type: String, enum: ['room', 'pg', 'flat', 'hostel', 'villa', 'studio'], required: true },

  // Pricing
  rent: { type: Number, required: true },
  deposit: { type: Number, default: 0 },
  maintenanceCharges: { type: Number, default: 0 },
  electricityCharges: { type: String, enum: ['included', 'extra', 'metered'], default: 'extra' },
  negotiable: { type: Boolean, default: false },

  // Property Details
  furnishing: { type: String, enum: ['fully-furnished', 'semi-furnished', 'unfurnished'], default: 'unfurnished' },
  for: { type: String, enum: ['boys', 'girls', 'family', 'any', 'working-professionals'], default: 'any' },
  bhk: { type: String, enum: ['1rk', '1bhk', '2bhk', '3bhk', '4bhk', '4+bhk'] },
  floor: Number,
  totalFloors: Number,
  area: Number, // sq ft
  facing: { type: String, enum: ['north', 'south', 'east', 'west', 'north-east', 'north-west', 'south-east', 'south-west'] },
  ageOfProperty: Number, // years
  availableFrom: Date,
  preferredTenantAge: { min: Number, max: Number },

  // Amenities
  amenities: [{
    type: String,
    enum: [
      'wifi', 'ac', 'parking', 'gym', 'lift', 'security', 'cctv',
      'power-backup', 'water-24x7', 'gas', 'washing-machine', 'fridge',
      'tv', 'geyser', 'balcony', 'garden', 'swimming-pool', 'clubhouse',
      'mess', 'laundry', 'housekeeping', 'visitor-parking'
    ]
  }],
  rules: [String], // no smoking, no pets etc

  // Media
  images: [String],
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
  contactViews: { type: Number, default: 0 }, // how many clicked contact
  saves: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },

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
    address: { type: String, required: true },
    landmark: String,
    area: String,
    city: { type: String, required: true },
    state: String,
    pincode: String,
    googlePlaceId: String,
  },

  // Nearby
  nearbyPlaces: [{
    name: String,
    type: { type: String, enum: ['school', 'college', 'hospital', 'metro', 'bus', 'market', 'office'] },
    distance: Number, // km
  }],

  // Flags
  reportCount: { type: Number, default: 0 },
  isFraudSuspected: { type: Boolean, default: false },
}, { timestamps: true });

roomSchema.index({ location: '2dsphere' });
roomSchema.index({ rent: 1, isAvailable: 1, isApproved: 1, isActive: 1 });
roomSchema.index({ 'location.city': 1, type: 1 });
roomSchema.index({ owner: 1 });
roomSchema.index({ isFeatured: -1, boostExpiry: -1 });

export default mongoose.model('Room', roomSchema);
