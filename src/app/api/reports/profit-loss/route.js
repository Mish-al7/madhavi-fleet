import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import AdminExpense from '@/models/AdminExpense';
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

        // Build trip match — $type:'date' guards against null/string trip_date fields
        const tripMatch = { company_id, trip_date: { $type: 'date' } };
        if (from || to) {
            tripMatch.trip_date = { $type: 'date' };
            if (from) tripMatch.trip_date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                tripMatch.trip_date.$lte = toDate;
            }
        }
        if (vehicle_id) tripMatch.vehicle_id = new mongoose.Types.ObjectId(vehicle_id);
        if (driver_id) tripMatch.driver_id = new mongoose.Types.ObjectId(driver_id);
        if (trip_type) tripMatch.trip_type = trip_type;

        // Build admin expense match — same null guard on start_date
        // Exclude admin expenses if filtering specifically by trip type
        const expenseMatch = trip_type ? { _id: null } : { company_id, start_date: { $type: 'date' } };
        if (from || to) {
            expenseMatch.start_date = { $type: 'date' };
            if (from) expenseMatch.start_date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                expenseMatch.start_date.$lte = toDate;
            }
        }
        if (vehicle_id) expenseMatch.vehicle_id = new mongoose.Types.ObjectId(vehicle_id);

        // Use a single aggregation pipeline for both Trip and AdminExpense data
        const rows = await Trip.aggregate([
            { $match: tripMatch },
            {
                $project: {
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$trip_date' } },
                    income: 1,
                    trip_expenses: '$total_expenses',
                    admin_expenses: { $literal: 0 },
                    trip_count: { $literal: 1 },
                }
            },
            {
                $unionWith: {
                    coll: AdminExpense.collection.name,
                    pipeline: [
                        { $match: expenseMatch },
                        {
                            $project: {
                                date: { $dateToString: { format: '%Y-%m-%d', date: '$start_date' } },
                                income: { $literal: 0 },
                                trip_expenses: { $literal: 0 },
                                admin_expenses: '$amount',
                                trip_count: { $literal: 0 },
                            }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: '$date',
                    income: { $sum: '$income' },
                    trip_expenses: { $sum: '$trip_expenses' },
                    admin_expenses: { $sum: '$admin_expenses' },
                    trip_count: { $sum: '$trip_count' }
                }
            },
            { $match: { _id: { $ne: null } } },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    income: 1,
                    trip_expenses: 1,
                    admin_expenses: 1,
                    trip_count: 1,
                    total_expenses: { $add: ['$trip_expenses', '$admin_expenses'] },
                    net_profit: { $subtract: ['$income', { $add: ['$trip_expenses', '$admin_expenses'] }] }
                }
            },
            { $sort: { date: 1 } }
        ]);

        // Summary totals
        const totals = rows.reduce(
            (acc, r) => ({
                income: acc.income + r.income,
                trip_expenses: acc.trip_expenses + r.trip_expenses,
                admin_expenses: acc.admin_expenses + r.admin_expenses,
                total_expenses: acc.total_expenses + r.total_expenses,
                net_profit: acc.net_profit + r.net_profit,
                trip_count: acc.trip_count + r.trip_count,
            }),
            { income: 0, trip_expenses: 0, admin_expenses: 0, total_expenses: 0, net_profit: 0, trip_count: 0 }
        );

        return NextResponse.json({ success: true, data: rows, totals });
    } catch (err) {
        console.error('[reports/profit-loss]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
