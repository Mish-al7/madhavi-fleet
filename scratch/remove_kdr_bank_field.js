import mongoose from 'mongoose';
import Trip from '../src/models/Trip.js';

const MONGODB_URI = 'mongodb+srv://mohammednalagath_db_user:Mohammed07@cluster0.n15fuiv.mongodb.net/Dev';

async function main() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove the deposit_to_kdr_bank field from all documents in Trip collection
    const result = await mongoose.connection.collection('trips').updateMany(
        {},
        { $unset: { deposit_to_kdr_bank: "" } }
    );

    console.log(`Updated ${result.modifiedCount} documents (removed deposit_to_kdr_bank).`);
    console.log(`Matched ${result.matchedCount} documents total.`);

    await mongoose.disconnect();
}

main().catch(console.error);
