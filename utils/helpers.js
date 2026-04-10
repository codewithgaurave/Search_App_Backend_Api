import Notification from '../models/Notification.js';

export const createNotification = async ({ user, title, body, type = 'system', refId }) => {
  await Notification.create({ user, title, body, type, refId });
};

// Geo query helper
export const nearbyQuery = (lng, lat, radiusKm = 10) => ({
  location: {
    $near: {
      $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      $maxDistance: radiusKm * 1000,
    },
  },
});
