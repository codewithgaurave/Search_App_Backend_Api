import { upload } from '../config/cloudinary.js';

export const uploadImages = (folder) => (req, res, next) => {
  req.uploadFolder = folder;
  upload.array('images', 5)(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

export const uploadAvatar = (folder) => (req, res, next) => {
  req.uploadFolder = folder;
  upload.single('avatar')(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};
