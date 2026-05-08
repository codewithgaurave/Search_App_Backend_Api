import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// ✏️ Jis admin ko update karna hai uska phone
const PHONE = '9000000000';

// ✏️ Jo fields update karni hain woh yahan likho, baaki hata do
const UPDATES = {
  // name: 'Super Admin',
  // phone: '8888888888',
  password: 'admin123',
  // role: 'ops',
};

await mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  password: { type: String, select: false },
  role: String,
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const admin = await User.findOne({ phone: PHONE, role: { $in: ['admin', 'ops'] } });
if (!admin) {
  console.log('❌ Admin nahi mila phone:', PHONE);
  await mongoose.disconnect();
  process.exit(1);
}

if (UPDATES.password) {
  UPDATES.password = await bcrypt.hash(UPDATES.password, 10);
}

await User.findByIdAndUpdate(admin._id, UPDATES);

console.log('✅ Admin successfully update ho gaya!');
console.log('   Updated fields:', Object.keys(UPDATES).join(', '));

await mongoose.disconnect();
process.exit(0);
