import Room from '../models/Room.js';
import User from '../models/User.js';
import { nearbyQuery } from '../utils/helpers.js';

// @POST /api/rooms
export const createRoom = async (req, res, next) => {
  try {
    const images = req.files?.map((f) => f.path) || [];
    const room = await Room.create({ ...req.body, owner: req.user._id, images });
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalListings: 1 } });
    res.status(201).json({ success: true, room });
  } catch (err) { next(err); }
};

// @GET /api/rooms
export const getRooms = async (req, res, next) => {
  try {
    const {
      lng, lat, radius = 10,
      type, minRent, maxRent, for: forGender,
      furnishing, amenities, city, area,
      sortBy = 'relevance', page = 1, limit = 20,
    } = req.query;

    const query = { isApproved: true, isActive: true, isAvailable: true };

    if (lng && lat) Object.assign(query, nearbyQuery(lng, lat, radius));
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (area) query['location.area'] = new RegExp(area, 'i');
    if (type) query.type = type;
    if (forGender) query.for = forGender;
    if (furnishing) query.furnishing = furnishing;
    if (amenities) query.amenities = { $all: amenities.split(',') };
    if (minRent || maxRent) {
      query.rent = {};
      if (minRent) query.rent.$gte = Number(minRent);
      if (maxRent) query.rent.$lte = Number(maxRent);
    }

    const sortOptions = {
      relevance: { isFeatured: -1, boostExpiry: -1, createdAt: -1 },
      price_low: { rent: 1 },
      price_high: { rent: -1 },
      rating: { rating: -1 },
      newest: { createdAt: -1 },
      popular: { views: -1 },
    };

    const rooms = await Room.find(query)
      .populate('owner', 'name phone avatar rating isVerified verificationBadge')
      .sort(sortOptions[sortBy] || sortOptions.relevance)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Room.countDocuments(query);
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), rooms });
  } catch (err) { next(err); }
};

// @GET /api/rooms/:id
export const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id, { $inc: { views: 1 } }, { new: true }
    ).populate('owner', 'name phone avatar rating isVerified verificationBadge totalListings createdAt bio');
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    // Similar rooms
    const similar = await Room.find({
      _id: { $ne: room._id },
      'location.city': room.location.city,
      type: room.type,
      isApproved: true, isActive: true, isAvailable: true,
      rent: { $gte: room.rent * 0.7, $lte: room.rent * 1.3 },
    }).select('title rent type images location rating').limit(6).lean();

    res.json({ success: true, room, similar });
  } catch (err) { next(err); }
};

// @PUT /api/rooms/:id
export const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, owner: req.user._id });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    if (req.files?.length) req.body.images = [...(room.images || []), ...req.files.map((f) => f.path)];
    Object.assign(room, req.body);
    room.isApproved = false; // re-approval on update
    await room.save();
    res.json({ success: true, room });
  } catch (err) { next(err); }
};

// @DELETE /api/rooms/:id
export const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalListings: -1 } });
    res.json({ success: true, message: 'Room deleted' });
  } catch (err) { next(err); }
};

// @GET /api/rooms/my
export const getMyRooms = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { owner: req.user._id };
    if (status === 'pending') query.isApproved = false;
    if (status === 'approved') query.isApproved = true;
    if (status === 'unavailable') query.isAvailable = false;
    const rooms = await Room.find(query).sort({ createdAt: -1 });
    res.json({ success: true, rooms });
  } catch (err) { next(err); }
};

// @PUT /api/rooms/:id/toggle-availability
export const toggleRoomAvailability = async (req, res, next) => {
  try {
    const room = await Room.findOne({ _id: req.params.id, owner: req.user._id });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    room.isAvailable = !room.isAvailable;
    await room.save();
    res.json({ success: true, isAvailable: room.isAvailable });
  } catch (err) { next(err); }
};

// @POST /api/rooms/:id/contact-view  — track contact clicks
export const trackContactView = async (req, res, next) => {
  try {
    await Room.findByIdAndUpdate(req.params.id, { $inc: { contactViews: 1 } });
    const room = await Room.findById(req.params.id).populate('owner', 'phone');
    res.json({ success: true, phone: room.owner.phone });
  } catch (err) { next(err); }
};
