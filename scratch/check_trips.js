import mongoose from 'mongoose';
import Trip from '../src/models/Trip.js';

const MONGODB_URI = 'mongodb+srv://mohammednalagath_db_user:Mohammed07@cluster0.n15fuiv.mongodb.net/Dev';

async function main() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a mock trip
    const testTrip = new Trip({
        trip_date: new Date(),
        vehicle_id: new mongoose.Types.ObjectId(),
        company_id: new mongoose.Types.ObjectId(),
        trip_route: 'Test Route',
        income: 5000,
        payment_status: 'pay_later',
        payment_date: null
    });

    await testTrip.save();
    console.log('Saved Trip ID:', testTrip._id);
    console.log('Saved Trip payment_status:', testTrip.payment_status);
    console.log('Saved Trip payment_date:', testTrip.payment_date);

    // Read it back
    const readTrip = await Trip.findById(testTrip._id);
    console.log('Read Trip payment_status:', readTrip.payment_status);
    console.log('Read Trip payment_date:', readTrip.payment_date);
    console.log('Read Trip income:', readTrip.income);

    // Clean up
    await Trip.findByIdAndDelete(testTrip._id);
    console.log('Deleted Test Trip');

    await mongoose.disconnect();
}

main().catch(console.error);
