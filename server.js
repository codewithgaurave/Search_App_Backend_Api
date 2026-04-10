import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import dbConnection from './config/db.js';
import apiRoute from './routes/module.js';
import { errorHandler, notFound } from './middlewares/error.js';
import { initSocket } from './utils/socket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io
initSocket(server);

// Security
app.use(helmet());

// Core middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));

// Routes
app.use('/api', apiRoute);

app.get('/', (req, res) => res.json({ success: true, message: 'SEARCH API Running 🚀' }));

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3600;

server.listen(PORT, async () => {
  await dbConnection();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
