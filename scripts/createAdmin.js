import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// ✏️ Yahan apni details bharo
const ADMIN = {
  name: 'Super Admin',
  phone: '9999999999',
  password: 'admin@123',
  role: 'admin', // 'admin' ya 'ops'
};

await mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  password: { type: String, select: false },
  role: String,
  isPhoneVerified: Boolean,
  isActive: Boolean,
  referralCode: String,
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const existing = await User.findOne({ phone: ADMIN.phone });
if (existing) {
  console.log('❌ Is phone se admin already exist karta hai:', ADMIN.phone);
  await mongoose.disconnect();
  process.exit(1);
}

const hashedPassword = await bcrypt.hash(ADMIN.password, 10);

await User.create({
  name: ADMIN.name,
  phone: ADMIN.phone,
  password: hashedPassword,
  role: ADMIN.role,
  isPhoneVerified: true,
  isActive: true,
  referralCode: ADMIN.name.slice(0, 3).toUpperCase() + Math.random().toString(36).slice(2, 7).toUpperCase(),
});

console.log('✅ Admin successfully create ho gaya!');
console.log(`   Name  : ${ADMIN.name}`);
console.log(`   Phone : ${ADMIN.phone}`);
console.log(`   Role  : ${ADMIN.role}`);

await mongoose.disconnect();
process.exit(0);
