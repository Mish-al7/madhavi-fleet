import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js'; // import Company to register its schema
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listUsers() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({}).populate('company_id');
    console.log(JSON.stringify(users.map(u => ({
        email: u.email,
        role: u.role,
        name: u.name,
        company: u.company_id?.name
    })), null, 2));
    await mongoose.disconnect();
}

listUsers().catch(console.error);
