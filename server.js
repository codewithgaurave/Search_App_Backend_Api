import express from 'express'
import dotenv from 'dotenv'
import apiRoute from './routes/module.js';
import cloudinary from 'cloudinary'
import cookieParser from "cookie-parser";
import cors from 'cors'
import dbConnection from './config/db.js';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


dotenv.config();
const port = process.env.PORT || 3000;

const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use('api/', apiRoute)


app.get('/', (req, res) => {
  res.send('Api Running!')
})

app.listen(port, async () => {
  await dbConnection();
  console.log(`Server running on http://localhost:${port}`);
});