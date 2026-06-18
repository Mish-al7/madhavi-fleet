import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import mongoose from 'mongoose';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const company_id = new mongoose.Types.ObjectId(session.user.company_id);
        const { searchParams } = new URL(req.url);

        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const vehicle_id = searchParams.get('vehicle_id');
        const driver_id = searchParams.get('driver_id');
        const trip_type = searchParams.get('trip_type');

        const match = { company_id };
        if (from || to) {
            match.trip_date = {};
            if (from) match.trip_date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                match.trip_date.$lte = toDate;
            }
        }
        if (vehicle_id) match.vehicle_id = new mongoose.Types.ObjectId(vehicle_id);
        if (driver_id) match.driver_id = new mongoose.Types.ObjectId(driver_id);
        if (trip_type) match.trip_type = trip_type;

        const data = await Trip.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'vehicles',
                    localField: 'vehicle_id',
                    foreignField: '_id',
                    as: 'vehicle',
                },
            },
            { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'driver_id',
                    foreignField: '_id',
                    as: 'driver',
                },
            },
            { $unwind: { path: '$driver', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    trip_date: {
                        $dateToString: { format: '%Y-%m-%d', date: '$trip_date' },
                    },
                    trip_type: { $ifNull: ['$trip_type', 'regular'] },
                    trip_route: 1,
                    vehicle_no: { $ifNull: ['$vehicle.vehicle_no', 'N/A'] },
                    driver_name: { $ifNull: ['$actual_driver_name', '$driver.name', 'N/A'] },
                    income: 1,
                    total_expenses: 1,
                    net_profit: { $subtract: ['$income', '$total_expenses'] },
                    notes: 1,
                },
            },
            { $sort: { trip_date: -1 } },
        ]);

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('[reports/trip-summary]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
