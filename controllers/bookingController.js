import Booking from '../models/Booking.js';
import { createNotification } from '../utils/helpers.js';

// @POST /api/bookings
export const createBooking = async (req, res, next) => {
  try {
    const { refType, refId, owner, amount, note } = req.body;
    const booking = await Booking.create({ user: req.user._id, refType, refId, owner, amount, note });
    await createNotification({ user: owner, title: 'New Booking Request', body: `You have a new ${refType} booking request`, type: 'booking', refId: booking._id });
    res.status(201).json({ success: true, booking });
  } catch (err) { next(err); }
};

// @GET /api/bookings/my
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) { next(err); }
};

// @GET /api/bookings/received  (owner/worker)
export const getReceivedBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ owner: req.user._id })
      .populate('user', 'name phone avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) { next(err); }
};

// @PUT /api/bookings/:id/status
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    await createNotification({ user: booking.user, title: 'Booking Update', body: `Your booking has been ${status}`, type: 'booking', refId: booking._id });
    res.json({ success: true, booking });
  } catch (err) { next(err); }
};
