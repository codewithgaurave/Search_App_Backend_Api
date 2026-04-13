import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { sendToken } from '../utils/token.js';
import { sendOTPSms, generateOTP } from '../utils/sms.js';

const generateReferralCode = (name) =>
  name.slice(0, 3).toUpperCase() + Math.random().toString(36).slice(2, 7).toUpperCase();

const OTP_EXPIRE_MS = (parseInt(process.env.OTP_EXPIRE_MINUTES) || 10) * 60 * 1000;

// ─────────────────────────────────────────────
// @POST /api/auth/send-otp
// New user → register karo
// Existing user → login karo
// Dono ke liye ek hi endpoint
// ─────────────────────────────────────────────
export const sendOtp = async (req, res, next) => {
  try {
    const { phone, name, role, referralCode } = req.body;

    if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });

    let user = await User.findOne({ phone });
    const isNewUser = !user;

    // New user — register karo
    if (isNewUser) {
      if (!name) return res.status(400).json({ success: false, message: 'Name required for new user' });

      const newUserData = {
        name,
        phone,
        role: role || 'user',
        referralCode: generateReferralCode(name),
      };

      // Referral bonus
      if (referralCode) {
        const referrer = await User.findOne({ referralCode });
        if (referrer) {
          newUserData.referredBy = referrer._id;
          referrer.wallet += 50;
          referrer.referralCount += 1;
          referrer.referralEarnings += 50;
          await referrer.save();
          await WalletTransaction.create({
            user: referrer._id,
            type: 'credit',
            category: 'referral',
            amount: 50,
            description: `Referral bonus for inviting ${name}`,
          });
        }
      }

      user = await User.create(newUserData);
    }

    if (user.isBanned)
      return res.status(403).json({ success: false, message: `Account banned: ${user.banReason}` });

    // OTP generate karo
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRE_MS);

    await User.findByIdAndUpdate(user._id, { otp, otpExpiry });

    // SMS bhejo
    await sendOTPSms(phone, otp);

    res.json({
      success: true,
      message: isNewUser ? 'Account created. OTP sent.' : 'OTP sent successfully.',
      isNewUser,
      // Development me OTP response me bhi bhejo
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// @POST /api/auth/verify-otp
// ─────────────────────────────────────────────
export const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp)
      return res.status(400).json({ success: false, message: 'Phone and OTP required' });

    const user = await User.findOne({ phone }).select('+otp +otpExpiry');

    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.otp || !user.otpExpiry)
      return res.status(400).json({ success: false, message: 'OTP not requested. Please send OTP first.' });

    if (new Date() > user.otpExpiry)
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });

    if (user.otp !== otp.toString())
      return res.status(400).json({ success: false, message: 'Invalid OTP' });

    // OTP clear karo + phone verify karo
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isPhoneVerified = true;
    user.lastSeen = new Date();
    await user.save();

    sendToken(res, user, 200, 'Login successful');
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// @POST /api/auth/resend-otp
// ─────────────────────────────────────────────
export const resendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone }).select('+otpExpiry');

    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    // 1 minute ke andar dobara nahi bhej sakte
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (user.otpExpiry && user.otpExpiry > new Date(Date.now() + (OTP_EXPIRE_MS - 60000)))
      return res.status(429).json({ success: false, message: 'Please wait 1 minute before resending OTP' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRE_MS);

    await User.findByIdAndUpdate(user._id, { otp, otpExpiry });
    await sendOTPSms(phone, otp);

    res.json({
      success: true,
      message: 'OTP resent successfully',
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// @POST /api/auth/admin-login  (admin/ops ke liye password login)
// ─────────────────────────────────────────────
export const adminLogin = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone, role: { $in: ['admin', 'ops'] } }).select('+password');

    if (!user || !user.password)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (user.isBanned)
      return res.status(403).json({ success: false, message: 'Account banned' });

    user.lastSeen = new Date();
    await user.save();

    sendToken(res, user, 200, 'Admin login successful');
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// @POST /api/auth/logout
// ─────────────────────────────────────────────
export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
};

// ─────────────────────────────────────────────
// @GET /api/auth/me
// ─────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('referredBy', 'name phone');
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// @PUT /api/auth/update-profile
// ─────────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      'name', 'email', 'bio', 'skills', 'location', 'languages',
      'gender', 'dateOfBirth', 'workExperience', 'availabilitySlots',
      'serviceRadius', 'businessName', 'businessType', 'fcmToken', 'deviceType',
    ];
    const update = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    if (req.file) update.avatar = req.file.path;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// @PUT /api/auth/toggle-availability
// ─────────────────────────────────────────────
export const toggleAvailability = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.isAvailable = !user.isAvailable;
    await user.save();
    res.json({ success: true, isAvailable: user.isAvailable });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// @GET /api/auth/wallet
// ─────────────────────────────────────────────
export const getWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('wallet totalEarnings totalSpent');
    const transactions = await WalletTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, wallet: user.wallet, totalEarnings: user.totalEarnings, totalSpent: user.totalSpent, transactions });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// @GET /api/auth/profile/:id  — public profile
// ─────────────────────────────────────────────
export const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name avatar coverImage role bio skills rating totalReviews isVerified verificationBadge location totalJobsDone completionRate responseTime workExperience languages isAvailable plan businessName createdAt');
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};
