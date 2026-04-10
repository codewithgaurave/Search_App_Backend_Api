import Service from '../models/Service.js';
import { nearbyQuery } from '../utils/helpers.js';

// @POST /api/services
export const createService = async (req, res, next) => {
  try {
    const images = req.files?.map((f) => f.path) || [];
    const service = await Service.create({ ...req.body, worker: req.user._id, images });
    res.status(201).json({ success: true, service });
  } catch (err) { next(err); }
};

// @GET /api/services
export const getServices = async (req, res, next) => {
  try {
    const { lng, lat, radius = 10, category, page = 1, limit = 20 } = req.query;
    const query = { isApproved: true, isAvailable: true };

    if (lng && lat) Object.assign(query, nearbyQuery(lng, lat, radius));
    if (category) query.category = category;

    const services = await Service.find(query)
      .populate('worker', 'name phone avatar rating isVerified isAvailable')
      .sort({ isFeatured: -1, 'worker.rating': -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Service.countDocuments(query);
    res.json({ success: true, total, services });
  } catch (err) { next(err); }
};

// @GET /api/services/:id
export const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('worker', 'name phone avatar rating isVerified isAvailable');
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, service });
  } catch (err) { next(err); }
};

// @PUT /api/services/:id
export const updateService = async (req, res, next) => {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, worker: req.user._id },
      req.body,
      { new: true }
    );
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, service });
  } catch (err) { next(err); }
};

// @DELETE /api/services/:id
export const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findOneAndDelete({ _id: req.params.id, worker: req.user._id });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, message: 'Service deleted' });
  } catch (err) { next(err); }
};

// @GET /api/services/my
export const getMyServices = async (req, res, next) => {
  try {
    const services = await Service.find({ worker: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, services });
  } catch (err) { next(err); }
};
