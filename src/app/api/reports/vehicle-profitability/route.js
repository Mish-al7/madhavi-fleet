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
                $group: {
                    _id: '$vehicle_id',
                    income: { $sum: '$income' },
                    total_expenses: { $sum: '$total_expenses' },
                    trip_count: { $sum: 1 },
                    fuel: { $sum: '$fuel' },
                    fasttag: { $sum: '$fasttag' },
                    driver_allowance: { $sum: '$driver_allowance' },
                    service: { $sum: '$service' },
                    other_expense: { $sum: '$other_expense' },
                },
            },
            {
                $lookup: {
                    from: 'vehicles',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'vehicle',
                },
            },
            { $unwind: '$vehicle' },
            {
                $project: {
                    _id: 0,
                    vehicle_id: '$_id',
                    vehicle_no: '$vehicle.vehicle_no',
                    income: 1,
                    total_expenses: 1,
                    net_profit: { $subtract: ['$income', '$total_expenses'] },
                    profit_margin: {
                        $cond: [
                            { $gt: ['$income', 0] },
                            {
                                $multiply: [
                                    { $divide: [{ $subtract: ['$income', '$total_expenses'] }, '$income'] },
                                    100,
                                ],
                            },
                            0,
                        ],
                    },
                    trip_count: 1,
                    fuel: 1,
                    fasttag: 1,
                    driver_allowance: 1,
                    service: 1,
                    other_expense: 1,
                },
            },
            { $sort: { net_profit: -1 } },
        ]);

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('[reports/vehicle-profitability]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
