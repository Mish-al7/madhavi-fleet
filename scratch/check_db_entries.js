import mongoose from 'mongoose';
import Trip from '../src/models/Trip.js';
import Booking from '../src/models/Booking.js';

const MONGODB_URI = 'mongodb+srv://mohammednalagath_db_user:Mohammed07@cluster0.n15fuiv.mongodb.net/Dev';

async function main() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n--- LATEST 10 TRIPS BY CREATEDAT ---');
    const trips = await Trip.find({}).sort({ createdAt: -1 }).limit(10).lean();
    trips.forEach(t => {
        console.log(`Trip ID: ${t._id}, Date: ${t.trip_date}, CreatedAt: ${t.createdAt}, Route: ${t.trip_route}, Income: ${t.income}, payment_status: ${t.payment_status}, payment_date: ${t.payment_date}`);
    });

    console.log('\n--- LATEST 10 BOOKINGS BY CREATEDAT ---');
    const bookings = await Booking.find({}).sort({ createdAt: -1 }).limit(10).lean();
    bookings.forEach(b => {
        console.log(`Booking ID: ${b._id}, BookingNo: ${b.booking_no}, CreatedAt: ${b.createdAt}, Customer: ${b.customer_name}, Status: ${b.status}, payment_status: ${b.payment_status}, payment_date: ${b.payment_date}`);
    });

    await mongoose.disconnect();
}

main().catch(console.error);
