
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    if (!process.env.MONGO_URI || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error('MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD must be configured in .env');
    }

    await mongoose.connect(process.env.MONGO_URI);

    const adminEmail = process.env.ADMIN_EMAIL.toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin account already exists!');
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = new User({
      fullName: 'CiviSynq Admin',
      email: adminEmail,
      phone: '9999999999',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();

    console.log('Admin account created successfully!');
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
