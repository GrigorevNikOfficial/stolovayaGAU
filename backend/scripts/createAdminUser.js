import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/stolovaya';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Admin user data
    const adminData = {
      first_name: 'Admin',
      last_name: 'User',
      phone: '+79991234567',
      email: 'admin@studmi.ru',
      password: 'admin123', // Will be hashed by the User model
      role: 'admin',
      balance: 10000,
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log({
        email: existingAdmin.email,
        phone: existingAdmin.phone,
        role: existingAdmin.role,
      });
      return;
    }

    // Create admin user
    const admin = await User.create(adminData);
    console.log('Admin user created successfully:');
    console.log({
      id: admin._id,
      email: admin.email,
      phone: admin.phone,
      role: admin.role,
      balance: admin.balance,
    });
    console.log('\nLogin credentials:');
    console.log(`Phone: ${adminData.phone}`);
    console.log(`Password: ${adminData.password}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

createAdminUser();
