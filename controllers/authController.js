import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { sendToken } from '../utils/token.js';
import crypto from 'crypto';

const generateReferralCode = (name) =>
  name.slice(0, 3).toUpperCase() + Math.random().toString(36).slice(2, 7).toUpperCase();

// @POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, phone, email, password, role, referralCode } = req.body;

    const exists = await User.findOne({ phone });
    if (exists) return res.status(400).json({ success: false, message: 'Phone already registered' });

    const newUser = { name, phone, email, password, role };
    newUser.referralCode = generateReferralCode(name);

    // Referral bonus
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        newUser.referredBy = referrer._id;
        referrer.wallet += 50;
        referrer.referralCount += 1;
        referrer.referralEarnings += 50;
        await referrer.save();
        await WalletTransaction.create({
          user: referrer._id, type: 'credit', category: 'referral',
          amount: 50, description: `Referral bonus for inviting ${name}`,
        });
      }
    }

    const user = await User.create(newUser);
    sendToken(res, user, 201, 'Registered successfully');
  } catch (err) { next(err); }
};

// @POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (user.isBanned)
      return res.status(403).json({ success: false, message: `Account banned: ${user.banReason}` });

    user.lastSeen = new Date();
    await user.save();

    sendToken(res, user, 200, 'Login successful');
  } catch (err) { next(err); }
};

// @POST /api/auth/logout
export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
};

// @GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('referredBy', 'name phone');
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// @PUT /api/auth/update-profile
export const updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'email', 'bio', 'skills', 'location', 'languages',
      'gender', 'dateOfBirth', 'workExperience', 'availabilitySlots',
      'serviceRadius', 'businessName', 'businessType', 'fcmToken', 'deviceType'];

    const update = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    if (req.file) update.avatar = req.file.path;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// @PUT /api/auth/toggle-availability
export const toggleAvailability = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.isAvailable = !user.isAvailable;
    await user.save();
    res.json({ success: true, isAvailable: user.isAvailable });
  } catch (err) { next(err); }
};

// @PUT /api/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
};

// @GET /api/auth/wallet
export const getWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('wallet totalEarnings totalSpent');
    const transactions = await WalletTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, wallet: user.wallet, totalEarnings: user.totalEarnings, totalSpent: user.totalSpent, transactions });
  } catch (err) { next(err); }
};

// @GET /api/auth/public/:id  — public profile
export const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name avatar coverImage role bio skills rating totalReviews isVerified verificationBadge location totalJobsDone completionRate responseTime workExperience languages isAvailable plan businessName createdAt');
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};
