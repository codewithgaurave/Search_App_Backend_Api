import Review from '../models/Review.js';
import Room from '../models/Room.js';
import Service from '../models/Service.js';
import User from '../models/User.js';

const updateRating = async (refType, refId) => {
  const reviews = await Review.find({ refType, refId, isApproved: true });
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1);
  const count = reviews.length;

  if (refType === 'room') await Room.findByIdAndUpdate(refId, { rating: avg.toFixed(1), totalReviews: count });
  if (refType === 'service') await Service.findByIdAndUpdate(refId, { rating: avg.toFixed(1), totalReviews: count });
  if (refType === 'worker') await User.findByIdAndUpdate(refId, { rating: avg.toFixed(1), totalReviews: count });
};

// @POST /api/reviews
export const createReview = async (req, res, next) => {
  try {
    const { refType, refId, rating, comment, targetUser } = req.body;
    const exists = await Review.findOne({ reviewer: req.user._id, refType, refId });
    if (exists) return res.status(400).json({ success: false, message: 'Already reviewed' });

    const review = await Review.create({ reviewer: req.user._id, refType, refId, rating, comment, targetUser });
    await updateRating(refType, refId);
    res.status(201).json({ success: true, review });
  } catch (err) { next(err); }
};

// @GET /api/reviews/:refType/:refId
export const getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ refType: req.params.refType, refId: req.params.refId, isApproved: true })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) { next(err); }
};

// @DELETE /api/reviews/:id
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, reviewer: req.user._id });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    await updateRating(review.refType, review.refId);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
};
