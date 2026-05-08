import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// ✏️ Apna phone number yahan likho
const PHONE = '9999999999';

await mongoose.connect(process.env.MONGO_URI);

const result = await mongoose.connection.collection('users').updateOne(
  { phone: PHONE },
  { $set: { isActive: true, 'banned.isBanned': false, 'banned.reason': null } }
);

console.log(result.modifiedCount ? `✅ Admin (${PHONE}) fixed!` : `❌ User not found: ${PHONE}`);

await mongoose.disconnect();
process.exit(0);
