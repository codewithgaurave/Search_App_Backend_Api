import User from '../models/User.js';
import Room from '../models/Room.js';
import Job from '../models/Job.js';
import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import Report from '../models/Report.js';
import WalletTransaction from '../models/WalletTransaction.js';

// @GET /api/admin/stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalRooms, totalJobs, totalServices, totalBookings,
      pendingRooms, pendingJobs, pendingServices,
      fraudRooms, fraudJobs, fraudServices,
      pendingReports,
      newUsersToday,
    ] = await Promise.all([
      User.countDocuments(),
      Room.countDocuments(),
      Job.countDocuments(),
      Service.countDocuments(),
      Booking.countDocuments(),
      Room.countDocuments({ isApproved: false, isActive: true }),
      Job.countDocuments({ isApproved: false, isActive: true }),
      Service.countDocuments({ isApproved: false, isActive: true }),
      Room.countDocuments({ isFraudSuspected: true }),
      Job.countDocuments({ isFraudSuspected: true }),
      Service.countDocuments({ isFraudSuspected: true }),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    ]);

    // Revenue from wallet transactions
    const revenueData = await WalletTransaction.aggregate([
      { $match: { category: { $in: ['platform-fee', 'boost', 'subscription'] }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, newToday: newUsersToday, byRole: usersByRole },
        listings: { rooms: totalRooms, jobs: totalJobs, services: totalServices },
        pending: { rooms: pendingRooms, jobs: pendingJobs, services: pendingServices },
        fraud: { rooms: fraudRooms, jobs: fraudJobs, services: fraudServices },
        bookings: { total: totalBookings, byStatus: bookingsByStatus },
        reports: { pending: pendingReports },
        revenue: revenueData[0]?.total || 0,
      },
    });
  } catch (err) { next(err); }
};

// @GET /api/admin/users
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, isBanned, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isBanned !== undefined) query.isBanned = isBanned === 'true';
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }];

    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await User.countDocuments(query);
    res.json({ success: true, total, pages: Math.ceil(total / limit), users });
  } catch (err) { next(err); }
};

// @PUT /api/admin/users/:id/ban
export const banUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: true, isActive: false, banReason: reason },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User banned' });
  } catch (err) { next(err); }
};

// @PUT /api/admin/users/:id/unban
export const unbanUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, isActive: true, banReason: null },
      { new: true }
    );
    res.json({ success: true, message: 'User unbanned' });
  } catch (err) { next(err); }
};

// @PUT /api/admin/users/:id/verify
export const verifyUser = async (req, res, next) => {
  try {
    const { badge = 'basic' } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true, verificationBadge: badge, 'kyc.status': 'verified', 'kyc.verifiedAt': new Date() },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// @PUT /api/admin/rooms/:id/approve
export const approveRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, approvedAt: new Date(), approvedBy: req.user._id, rejectionReason: null },
      { new: true }
    );
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, room });
  } catch (err) { next(err); }
};

// @PUT /api/admin/rooms/:id/reject
export const rejectRoom = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { isApproved: false, isActive: false, rejectionReason: reason },
      { new: true }
    );
    res.json({ success: true, room });
  } catch (err) { next(err); }
};

// @PUT /api/admin/jobs/:id/approve
export const approveJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, approvedAt: new Date(), approvedBy: req.user._id },
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (err) { next(err); }
};

// @PUT /api/admin/services/:id/approve
export const approveService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, approvedAt: new Date(), approvedBy: req.user._id },
      { new: true }
    );
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, service });
  } catch (err) { next(err); }
};

// @PUT /api/admin/listings/:id/feature
export const featureListing = async (req, res, next) => {
  try {
    const { type, days = 7, plan = 'basic' } = req.body;
    const Model = type === 'room' ? Room : type === 'job' ? Job : Service;
    const boostExpiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      { isFeatured: true, boostExpiry, boostPlan: plan },
      { new: true }
    );
    res.json({ success: true, doc });
  } catch (err) { next(err); }
};

// @GET /api/admin/pending
export const getPendingListings = async (req, res, next) => {
  try {
    const [rooms, jobs, services] = await Promise.all([
      Room.find({ isApproved: false, isActive: true }).populate('owner', 'name phone isVerified').sort({ createdAt: -1 }),
      Job.find({ isApproved: false, isActive: true }).populate('postedBy', 'name phone isVerified').sort({ createdAt: -1 }),
      Service.find({ isApproved: false, isActive: true }).populate('worker', 'name phone isVerified').sort({ createdAt: -1 }),
    ]);
    res.json({ success: true, pending: { rooms, jobs, services } });
  } catch (err) { next(err); }
};

// @GET /api/admin/fraud
export const getFraudSuspected = async (req, res, next) => {
  try {
    const [rooms, jobs, services, reports] = await Promise.all([
      Room.find({ isFraudSuspected: true }).populate('owner', 'name phone').sort({ reportCount: -1 }),
      Job.find({ isFraudSuspected: true }).populate('postedBy', 'name phone').sort({ reportCount: -1 }),
      Service.find({ isFraudSuspected: true }).populate('worker', 'name phone').sort({ reportCount: -1 }),
      Report.find({ status: 'pending' }).populate('reportedBy', 'name phone').sort({ createdAt: -1 }).limit(50),
    ]);
    res.json({ success: true, fraud: { rooms, jobs, services, reports } });
  } catch (err) { next(err); }
};

// @PUT /api/admin/reports/:id/resolve
export const resolveReport = async (req, res, next) => {
  try {
    const { action, actionTaken } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: action, actionTaken, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, report });
  } catch (err) { next(err); }
};

// @GET /api/admin/analytics
export const getAnalytics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [userGrowth, bookingTrend, topCities] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$platformFee' } } },
        { $sort: { _id: 1 } },
      ]),
      Room.aggregate([
        { $group: { _id: '$location.city', count: { $sum: 1 }, avgRent: { $avg: '$rent' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.json({ success: true, analytics: { userGrowth, bookingTrend, topCities } });
  } catch (err) { next(err); }
};
