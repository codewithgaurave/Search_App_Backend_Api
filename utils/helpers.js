import Notification from '../models/Notification.js';

export const createNotification = async ({ user, title, body, type = 'system', refId }) => {
  await Notification.create({ user, title, body, type, refId });
};

// Geo query helper — $geoWithin use karo (sort ke saath compatible)
export const nearbyQuery = (lng, lat, radiusKm = 10) => ({
  location: {
    $geoWithin: {
      $centerSphere: [
        [parseFloat(lng), parseFloat(lat)],
        radiusKm / 6378.1, // radius in radians
      ],
    },
  },
});
