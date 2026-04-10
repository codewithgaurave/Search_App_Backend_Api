import Room from '../models/Room.js';
import Job from '../models/Job.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { nearbyQuery } from '../utils/helpers.js';

// @GET /api/search?q=plumber&type=service&lng=80.9&lat=26.8
export const globalSearch = async (req, res, next) => {
  try {
    const { q, type, lng, lat, radius = 10, city, page = 1, limit = 10 } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search query required' });

    const regex = new RegExp(q, 'i');
    const geoFilter = lng && lat ? nearbyQuery(lng, lat, radius) : {};
    const cityFilter = city ? { 'location.city': new RegExp(city, 'i') } : {};
    const skip = (page - 1) * limit;

    const baseQuery = { isApproved: true, isActive: true, ...geoFilter, ...cityFilter };

    const results = {};

    if (!type || type === 'room') {
      results.rooms = await Room.find({
        ...baseQuery, isAvailable: true,
        $or: [{ title: regex }, { description: regex }, { 'location.area': regex }, { 'location.city': regex }],
      }).populate('owner', 'name avatar isVerified').select('title rent type images location rating isFeatured').skip(skip).limit(Number(limit)).lean();
    }

    if (!type || type === 'job') {
      results.jobs = await Job.find({
        ...baseQuery,
        $or: [{ title: regex }, { description: regex }, { skills: regex }, { category: regex }],
      }).populate('postedBy', 'name avatar isVerified').select('title salary category location isUrgent isFeatured').skip(skip).limit(Number(limit)).lean();
    }

    if (!type || type === 'service') {
      results.services = await Service.find({
        ...baseQuery, isAvailable: true,
        $or: [{ title: regex }, { description: regex }, { category: regex }, { skills: regex }],
      }).populate('worker', 'name avatar isVerified rating').select('title price category location rating isFeatured').skip(skip).limit(Number(limit)).lean();
    }

    if (!type || type === 'worker') {
      results.workers = await User.find({
        role: 'worker', isActive: true, isAvailable: true,
        $or: [{ name: regex }, { skills: regex }, { bio: regex }],
        ...geoFilter,
      }).select('name avatar skills rating isVerified verificationBadge location isAvailable').skip(skip).limit(Number(limit)).lean();
    }

    res.json({ success: true, query: q, results });
  } catch (err) { next(err); }
};

// @GET /api/search/nearby  — hyperlocal feed
export const getNearbyFeed = async (req, res, next) => {
  try {
    const { lng, lat, radius = 5, limit = 8 } = req.query;
    if (!lng || !lat) return res.status(400).json({ success: false, message: 'Location required' });

    const geo = nearbyQuery(lng, lat, radius);
    const base = { isApproved: true, isActive: true };

    const [rooms, jobs, services, workers] = await Promise.all([
      Room.find({ ...base, ...geo, isAvailable: true }).select('title rent type images location rating isFeatured').limit(Number(limit)).lean(),
      Job.find({ ...base, ...geo }).select('title salary category location isUrgent isFeatured').limit(Number(limit)).lean(),
      Service.find({ ...base, ...geo, isAvailable: true }).select('title price category location rating isFeatured').limit(Number(limit)).lean(),
      User.find({ role: 'worker', isActive: true, isAvailable: true, ...geo }).select('name avatar skills rating isVerified location').limit(Number(limit)).lean(),
    ]);

    res.json({ success: true, feed: { rooms, jobs, services, workers } });
  } catch (err) { next(err); }
};

// @GET /api/search/trending?city=Lucknow
export const getTrending = async (req, res, next) => {
  try {
    const { city } = req.query;
    const cityFilter = city ? { 'location.city': new RegExp(city, 'i') } : {};
    const base = { isApproved: true, isActive: true, ...cityFilter };

    const [rooms, jobs, services] = await Promise.all([
      Room.find({ ...base, isAvailable: true }).sort({ views: -1 }).select('title rent type images location rating').limit(6).lean(),
      Job.find(base).sort({ views: -1 }).select('title salary category location isUrgent').limit(6).lean(),
      Service.find({ ...base, isAvailable: true }).sort({ views: -1 }).select('title price category location rating').limit(6).lean(),
    ]);

    res.json({ success: true, trending: { rooms, jobs, services } });
  } catch (err) { next(err); }
};
