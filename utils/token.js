import jwt from 'jsonwebtoken';

export const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

export const sendToken = (res, user, statusCode = 200, message = 'Success') => {
  const token = generateToken(user._id);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  const userData = user.toObject();
  delete userData.password;
  res.status(statusCode).json({ success: true, message, token, user: userData });
};
