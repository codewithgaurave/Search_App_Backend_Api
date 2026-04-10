import Report from '../models/Report.js';
import Room from '../models/Room.js';
import Job from '../models/Job.js';
import Service from '../models/Service.js';
import User from '../models/User.js';

// @POST /api/reports
export const createReport = async (req, res, next) => {
  try {
    const { refType, refId, reason, description } = req.body;
    const evidence = req.files?.map((f) => f.path) || [];

    const existing = await Report.findOne({ reportedBy: req.user._id, refType, refId });
    if (existing) return res.status(400).json({ success: false, message: 'Already reported' });

    const report = await Report.create({ reportedBy: req.user._id, refType, refId, reason, description, evidence });

    // Increment report count on target
    const modelMap = { room: Room, job: Job, service: Service, user: User };
    const Model = modelMap[refType];
    if (Model) await Model.findByIdAndUpdate(refId, { $inc: { reportCount: 1 } });

    // Auto flag if reports > 5
    if (Model) {
      const doc = await Model.findById(refId);
      if (doc?.reportCount >= 5) await Model.findByIdAndUpdate(refId, { isFraudSuspected: true });
    }

    res.status(201).json({ success: true, message: 'Report submitted', report });
  } catch (err) { next(err); }
};

// @GET /api/reports/my
export const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) { next(err); }
};
