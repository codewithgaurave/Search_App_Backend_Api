import Job, { JOB_CATEGORIES } from '../models/Job.js';
import User from '../models/User.js';
import { nearbyQuery, createNotification } from '../utils/helpers.js';

// ─────────────────────────────────────────────────────────────
// @GET /api/jobs/categories  — all categories list
// ─────────────────────────────────────────────────────────────
export const getCategories = (req, res) => {
  const grouped = {
    'Home Services': ['plumber', 'electrician', 'carpenter', 'painter', 'cleaner', 'ac-repair', 'appliance-repair', 'pest-control', 'shifting-packing', 'gardener', 'security-guard', 'housekeeping'],
    'Construction & Labour': ['mason', 'labour', 'welder', 'tile-work', 'civil-work'],
    'Vehicle': ['driver', 'mechanic', 'delivery'],
    'Domestic': ['cook', 'maid', 'babysitter', 'nurse', 'elderly-care'],
    'Education': ['tutor', 'coaching'],
    'Office & Business': ['data-entry', 'receptionist', 'sales', 'marketing', 'accountant'],
    'Retail & Shop': ['shop-helper', 'cashier', 'warehouse'],
    'Agriculture': ['farming', 'harvesting'],
    'Creative': ['tailor', 'photographer', 'event-helper'],
    'Tech': ['it-support', 'mobile-repair'],
    'Other': ['gym-trainer', 'other'],
  };
  res.json({ success: true, categories: grouped, flat: JOB_CATEGORIES });
};

// ─────────────────────────────────────────────────────────────
// @POST /api/jobs  — user/owner job post karo
// ─────────────────────────────────────────────────────────────
export const createJob = async (req, res, next) => {
  try {
    const images = req.files?.map((f) => f.path) || [];
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const job = await Job.create({
      ...req.body,
      postedBy: req.user._id,
      images,
      expiresAt,
    });

    // Nearby workers ko notify karo
    if (job.location?.coordinates) {
      const [lng, lat] = job.location.coordinates;
      const nearbyWorkers = await User.find({
        role: 'worker',
        isActive: true,
        isAvailable: true,
        ...nearbyQuery(lng, lat, 10),
      }).select('_id').limit(50);

      await Promise.all(nearbyWorkers.map((w) =>
        createNotification({
          user: w._id,
          title: `New ${job.category} job nearby! 🔔`,
          body: `${job.title} — ${job.location.area || job.location.city}`,
          type: 'job',
          refId: job._id,
        })
      ));
    }

    res.status(201).json({ success: true, job });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
// @GET /api/jobs  — worker nearby jobs dekhe (category filter)
// ─────────────────────────────────────────────────────────────
export const getJobs = async (req, res, next) => {
  try {
    const {
      lng, lat, radius = 10,
      category, city, area,
      isUrgent, status = 'open',
      sortBy = 'relevance',
      page = 1, limit = 20,
    } = req.query;

    const query = { isApproved: true, isActive: true, status };

    if (lng && lat) Object.assign(query, nearbyQuery(lng, lat, radius));
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (area) query['location.area'] = new RegExp(area, 'i');
    if (category) query.category = category;
    if (isUrgent === 'true') query.isUrgent = true;

    const sortOptions = {
      relevance: { isFeatured: -1, isUrgent: -1, createdAt: -1 },
      newest: { createdAt: -1 },
      popular: { views: -1 },
    };

    const jobs = await Job.find(query)
      .populate('postedBy', 'name phone avatar isVerified verificationBadge rating')
      .sort(sortOptions[sortBy] || sortOptions.relevance)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-interestedWorkers') // list me workers hide karo
      .lean();

    const total = await Job.countDocuments(query);
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), jobs });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
// @GET /api/jobs/:id  — job detail + poster ka phone
// ─────────────────────────────────────────────────────────────
export const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id, { $inc: { views: 1 } }, { new: true }
    )
      .populate('postedBy', 'name phone avatar isVerified verificationBadge rating totalReviews createdAt location')
      .populate('selectedWorker', 'name phone avatar rating isVerified skills')
      .lean();

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    // Similar jobs
    const similar = await Job.find({
      _id: { $ne: job._id },
      category: job.category,
      'location.city': job.location.city,
      isApproved: true, isActive: true, status: 'open',
    }).select('title budget category location isUrgent').limit(5).lean();

    res.json({ success: true, job, similar });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
// @POST /api/jobs/:id/interest  — worker interest dikhaye
// ─────────────────────────────────────────────────────────────
export const showInterest = async (req, res, next) => {
  try {
    const { message } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ success: false, message: 'Job is no longer open' });

    const alreadyInterested = job.interestedWorkers.find(
      (w) => w.worker?.toString() === req.user._id.toString()
    );
    if (alreadyInterested) return res.status(400).json({ success: false, message: 'Already shown interest' });

    job.interestedWorkers.push({ worker: req.user._id, message });
    job.totalInterested += 1;
    await job.save();

    // Job poster ko notify karo
    await createNotification({
      user: job.postedBy,
      title: 'Worker interested in your job! 👷',
      body: `${req.user.name} is interested in "${job.title}"`,
      type: 'job',
      refId: job._id,
    });

    res.json({ success: true, message: 'Interest shown successfully' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
// @DELETE /api/jobs/:id/interest  — worker interest wapas le
// ─────────────────────────────────────────────────────────────
export const withdrawInterest = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const index = job.interestedWorkers.findIndex(
      (w) => w.worker?.toString() === req.user._id.toString()
    );
    if (index === -1) return res.status(400).json({ success: false, message: 'Interest not found' });

    if (job.interestedWorkers[index].status === 'selected')
      return res.status(400).json({ success: false, message: 'Already selected, cannot withdraw' });

    job.interestedWorkers.splice(index, 1);
    job.totalInterested = Math.max(0, job.totalInterested - 1);
    await job.save();

    res.json({ success: true, message: 'Interest withdrawn' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
// @GET /api/jobs/:id/interested-workers  — poster interested workers dekhe
// ─────────────────────────────────────────────────────────────
export const getInterestedWorkers = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id })
      .populate('interestedWorkers.worker', 'name phone avatar skills rating isVerified verificationBadge location isAvailable')
      .lean();

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    res.json({ success: true, total: job.interestedWorkers.length, workers: job.interestedWorkers });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
// @POST /api/jobs/:id/contact/:workerId  — poster worker ka phone dekhe
// ─────────────────────────────────────────────────────────────
export const contactWorker = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const worker = await User.findById(req.params.workerId).select('name phone avatar skills rating');
    if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });

    // Contact view track karo
    await Job.findByIdAndUpdate(req.params.id, { $inc: { contactViews: 1 } });

    // Worker ka status contacted update karo
    const interested = job.interestedWorkers.find(
      (w) => w.worker?.toString() === req.params.workerId
    );
    if (interested && interested.status === 'interested') {
      interested.status = 'contacted';
      await job.save();
    }

    // Worker ko notify karo
    await createNotification({
      user: req.params.workerId,
      title: 'Job poster ne contact kiya! 📞',
      body: `${req.user.name} wants to contact you for "${job.title}"`,
      type: 'job',
      refId: job._id,
    });

    res.json({ success: true, worker });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
// @PUT /api/jobs/:id/select/:workerId  — poster worker select kare
// ─────────────────────────────────────────────────────────────
export const selectWorker = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ success: false, message: 'Job is not open' });

    // Selected worker set karo
    job.selectedWorker = req.params.workerId;
    job.selectedAt = new Date();
    job.status = 'in-progress';

    // Interested workers status update karo
    job.interestedWorkers.forEach((w) => {
      if (w.worker?.toString() === req.params.workerId) {
        w.status = 'selected';
      } else if (w.status !== 'rejected') {
        w.status = 'rejected';
      }
    });

    await job.save();

    // Selected worker ko notify karo
    await createNotification({
      user: req.params.workerId,
      title: 'Aapko job mil gayi! 🎉',
      body: `You have been selected for "${job.title}"`,
      type: 'job',
      refId: job._id,
    });

    // Rejected workers ko notify karo
    const rejectedWorkers = job.interestedWorkers.filter(
      (w) => w.worker?.toString() !== req.params.workerId
    );
    await Promise.all(rejectedWorkers.map((w) =>
      createNotification({
        user: w.worker,
        title: 'Job update',
        body: `Someone else was selected for "${job.title}"`,
        type: 'job',
        refId: job._id,
      })
    ));

    res.json({ success: true, message: 'Worker selected, job in-progress', job });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
// @PUT /api/jobs/:id/complete  — poster job complete mark kare
// Job history me jata hai + app se hat jata hai
// ─────────────────────────────────────────────────────────────
export const completeJob = async (req, res, next) => {
  try {
    const { completionNote } = req.body;
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.status !== 'in-progress') return res.status(400).json({ success: false, message: 'Job is not in-progress' });

    job.status = 'completed';
    job.completedAt = new Date();
    job.completionNote = completionNote;
    job.isActive = false; // App se hat jata hai (feed me nahi dikhega)
    await job.save();

    // Worker ke totalJobsDone increment karo
    if (job.selectedWorker) {
      await User.findByIdAndUpdate(job.selectedWorker, { $inc: { totalJobsDone: 1 } });

      // Worker ko notify karo
      await createNotification({
        user: job.selectedWorker,
        title: 'Job completed! ✅',
        body: `"${job.title}" has been marked as completed`,
        type: 'job',
        refId: job._id,
      });
    }

    res.json({ success: true, message: 'Job completed successfully', job });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
// @PUT /api/jobs/:id/cancel  — poster job cancel kare
// ─────────────────────────────────────────────────────────────
export const cancelJob = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (['completed', 'cancelled'].includes(job.status))
      return res.status(400).json({ success: false, message: `Job already ${job.status}` });

    job.status = 'cancelled';
    job.isActive = false;
    job.rejectionReason = reason;
    await job.save();

    // Selected worker ko notify karo
    if (job.selectedWorker) {
      await createNotification({
        user: job.selectedWorker,
        title: 'Job cancelled',
        body: `"${job.title}" has been cancelled by the poster`,
        type: 'job',
        refId: job._id,
      });
    }

    res.json({ success: true, message: 'Job cancelled' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
// @GET /api/jobs/my/posted  — poster ki saari jobs (history bhi)
// ─────────────────────────────────────────────────────────────
export const getMyPostedJobs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { postedBy: req.user._id };
    if (status) query.status = status;

    const jobs = await Job.find(query)
      .populate('selectedWorker', 'name phone avatar rating')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Job.countDocuments(query);
    res.json({ success: true, total, jobs });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
// @GET /api/jobs/my/interested  — worker ne jinme interest dikhaya
// ─────────────────────────────────────────────────────────────
export const getMyInterestedJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const jobs = await Job.find({ 'interestedWorkers.worker': req.user._id })
      .populate('postedBy', 'name phone avatar isVerified rating')
      .select('title category budget location status isUrgent interestedWorkers createdAt postedBy selectedWorker')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const result = jobs.map((j) => ({
      ...j,
      myInterest: j.interestedWorkers.find(
        (w) => w.worker?.toString() === req.user._id.toString()
      ),
      interestedWorkers: undefined,
    }));

    res.json({ success: true, total: result.length, jobs: result });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
// @GET /api/jobs/my/history  — completed/cancelled jobs history
// ─────────────────────────────────────────────────────────────
export const getJobHistory = async (req, res, next) => {
  try {
    const { role } = req.user;
    const { page = 1, limit = 20 } = req.query;

    let query = { status: { $in: ['completed', 'cancelled'] } };

    if (role === 'worker') {
      query['interestedWorkers.worker'] = req.user._id;
    } else {
      query.postedBy = req.user._id;
    }

    const jobs = await Job.find(query)
      .populate('postedBy', 'name phone avatar')
      .populate('selectedWorker', 'name phone avatar rating')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Job.countDocuments(query);
    res.json({ success: true, total, jobs });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
// @PUT /api/jobs/:id  — job update (sirf open status me)
// ─────────────────────────────────────────────────────────────
export const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.status !== 'open') return res.status(400).json({ success: false, message: 'Only open jobs can be edited' });

    const images = req.files?.map((f) => f.path) || [];
    if (images.length) req.body.images = [...(job.images || []), ...images];

    Object.assign(job, req.body);
    job.isApproved = false; // re-approval
    await job.save();

    res.json({ success: true, job });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
// @DELETE /api/jobs/:id  — job delete (sirf open me)
// ─────────────────────────────────────────────────────────────
export const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.status === 'in-progress') return res.status(400).json({ success: false, message: 'Cannot delete in-progress job' });

    await job.deleteOne();
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) { next(err); }
};
