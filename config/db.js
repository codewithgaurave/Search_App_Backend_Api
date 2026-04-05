import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const db_url = process.env.MONGO_URI
const dbConnection = async () => {
    try {
        await mongoose.connect(db_url);
        console.log(`DB Connected Successfully: ${db_url}`);
    } catch (err) {
        console.error(`DB Connection Error: ${err.message}`);
        process.exit(1);
    }
};

export default dbConnection;
