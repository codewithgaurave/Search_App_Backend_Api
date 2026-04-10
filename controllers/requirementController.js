import Requirement from '../models/Requirement.js';
import User from '../models/User.js';
import { nearbyQuery, createNotification } from '../utils/helpers.js';

// @POST /api/requirements
export const createRequirement = async (req, res, next) => {
  try {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const req_ = await Requirement.create({ ...req.body, postedBy: req.user._id, expiresAt });

    // Notify nearby owners/workers
    if (req.body.location?.coordinates) {
      const [lng, lat] = req.body.location.coordinates;
      const roleMap = { room: 'owner', worker: 'worker', service: 'worker', job: 'user' };
      const targetRole = roleMap[req.body.type];

      const nearbyUsers = await User.find({
        role: targetRole,
        isActive: true,
        ...nearbyQuery(lng, lat, 10),
      }).select('_id').limit(50);

      await Promise.all(nearbyUsers.map((u) =>
        createNotification({
          user: u._id,
          title: 'New Requirement Nearby!',
          body: `Someone is looking for a ${req.body.type} near you`,
          type: req.body.type === 'room' ? 'room' : 'job',
          refId: req_._id,
        })
      ));
    }

    res.status(201).json({ success: true, requirement: req_ });
  } catch (err) { next(err); }
};

// @GET /api/requirements
export const getRequirements = async (req, res, next) => {
  try {
    const { type, lng, lat, radius = 10, city, page = 1, limit = 20 } = req.query;
    const query = { isActive: true, expiresAt: { $gt: new Date() } };

    if (type) query.type = type;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (lng && lat) Object.assign(query, nearbyQuery(lng, lat, radius));

    const requirements = await Requirement.find(query)
      .populate('postedBy', 'name avatar isVerified')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Requirement.countDocuments(query);
    res.json({ success: true, total, requirements });
  } catch (err) { next(err); }
};

// @DELETE /api/requirements/:id
export const deleteRequirement = async (req, res, next) => {
  try {
    await Requirement.findOneAndDelete({ _id: req.params.id, postedBy: req.user._id });
    res.json({ success: true, message: 'Requirement deleted' });
  } catch (err) { next(err); }
};
