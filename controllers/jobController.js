import Job from '../models/Job.js';
import { nearbyQuery, createNotification } from '../utils/helpers.js';

// @POST /api/jobs
export const createJob = async (req, res, next) => {
  try {
    const job = await Job.create({ ...req.body, postedBy: req.user._id });
    res.status(201).json({ success: true, job });
  } catch (err) { next(err); }
};

// @GET /api/jobs
export const getJobs = async (req, res, next) => {
  try {
    const {
      lng, lat, radius = 10,
      category, city, area, skills,
      minSalary, maxSalary, salaryType,
      workType, isUrgent,
      sortBy = 'relevance', page = 1, limit = 20,
    } = req.query;

    const query = { isApproved: true, isActive: true };

    if (lng && lat) Object.assign(query, nearbyQuery(lng, lat, radius));
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (area) query['location.area'] = new RegExp(area, 'i');
    if (category) query.category = category;
    if (workType) query.workType = workType;
    if (isUrgent === 'true') query.isUrgent = true;
    if (skills) query.skills = { $in: skills.split(',') };
    if (minSalary || maxSalary) {
      query['salary.min'] = {};
      if (minSalary) query['salary.min'].$gte = Number(minSalary);
      if (maxSalary) query['salary.min'].$lte = Number(maxSalary);
    }
    if (salaryType) query['salary.type'] = salaryType;

    const sortOptions = {
      relevance: { isFeatured: -1, isUrgent: -1, createdAt: -1 },
      salary_high: { 'salary.max': -1 },
      salary_low: { 'salary.min': 1 },
      newest: { createdAt: -1 },
      popular: { views: -1 },
    };

    const jobs = await Job.find(query)
      .populate('postedBy', 'name phone avatar isVerified verificationBadge rating')
      .sort(sortOptions[sortBy] || sortOptions.relevance)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Job.countDocuments(query);
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), jobs });
  } catch (err) { next(err); }
};

// @GET /api/jobs/:id
export const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id, { $inc: { views: 1 } }, { new: true }
    ).populate('postedBy', 'name phone avatar isVerified verificationBadge rating totalReviews createdAt');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const similar = await Job.find({
      _id: { $ne: job._id },
      category: job.category,
      'location.city': job.location.city,
      isApproved: true, isActive: true,
    }).select('title salary category location isUrgent').limit(5).lean();

    res.json({ success: true, job, similar });
  } catch (err) { next(err); }
};

// @POST /api/jobs/:id/apply
export const applyJob = async (req, res, next) => {
  try {
    const { note } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const alreadyApplied = job.applicants.find(
      (a) => a.user?.toString() === req.user._id.toString()
    );
    if (alreadyApplied) return res.status(400).json({ success: false, message: 'Already applied' });

    job.applicants.push({ user: req.user._id, note });
    job.totalApplicants += 1;
    await job.save();

    await createNotification({
      user: job.postedBy,
      title: 'New Job Application',
      body: `${req.user.name} has applied for "${job.title}"`,
      type: 'job',
      refId: job._id,
    });

    res.json({ success: true, message: 'Applied successfully' });
  } catch (err) { next(err); }
};

// @PUT /api/jobs/:id/applicant/:userId/status
export const updateApplicantStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const applicant = job.applicants.find((a) => a.user?.toString() === req.params.userId);
    if (!applicant) return res.status(404).json({ success: false, message: 'Applicant not found' });

    applicant.status = status;
    await job.save();

    await createNotification({
      user: req.params.userId,
      title: 'Application Update',
      body: `Your application for "${job.title}" has been ${status}`,
      type: 'job',
      refId: job._id,
    });

    res.json({ success: true, message: `Applicant ${status}` });
  } catch (err) { next(err); }
};

// @PUT /api/jobs/:id
export const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, postedBy: req.user._id },
      { ...req.body, isApproved: false },
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (err) { next(err); }
};

// @DELETE /api/jobs/:id
export const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) { next(err); }
};

// @GET /api/jobs/my
export const getMyJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, jobs });
  } catch (err) { next(err); }
};

// @GET /api/jobs/applied  — worker's applied jobs
export const getAppliedJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ 'applicants.user': req.user._id })
      .select('title category salary location status applicants createdAt')
      .lean();

    const result = jobs.map((j) => ({
      ...j,
      myApplication: j.applicants.find((a) => a.user?.toString() === req.user._id.toString()),
    }));

    res.json({ success: true, jobs: result });
  } catch (err) { next(err); }
};
