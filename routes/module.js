import express from 'express';
import authRoutes from './authRoutes.js';
import roomRoutes from './roomRoutes.js';
import jobRoutes from './jobRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import chatRoutes from './chatRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import adminRoutes from './adminRoutes.js';
import searchRoutes from './searchRoutes.js';
import reportRoutes from './reportRoutes.js';
import requirementRoutes from './requirementRoutes.js';

const apiRoute = express.Router();

apiRoute.use('/auth', authRoutes);
apiRoute.use('/rooms', roomRoutes);
apiRoute.use('/jobs', jobRoutes);
apiRoute.use('/services', serviceRoutes);
apiRoute.use('/chats', chatRoutes);
apiRoute.use('/reviews', reviewRoutes);
apiRoute.use('/bookings', bookingRoutes);
apiRoute.use('/notifications', notificationRoutes);
apiRoute.use('/admin', adminRoutes);
apiRoute.use('/search', searchRoutes);
apiRoute.use('/reports', reportRoutes);
apiRoute.use('/requirements', requirementRoutes);

export default apiRoute;
