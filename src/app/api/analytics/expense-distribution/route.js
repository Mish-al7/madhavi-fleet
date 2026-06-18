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

        // Trip-level expense categories
        const tripMatch = { company_id };
        if (from || to) {
            tripMatch.trip_date = {};
            if (from) tripMatch.trip_date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                tripMatch.trip_date.$lte = toDate;
            }
        }

        const [tripTotals] = await Trip.aggregate([
            { $match: tripMatch },
            {
                $group: {
                    _id: null,
                    fuel: { $sum: '$fuel' },
                    fasttag: { $sum: '$fasttag' },
                    driver_allowance: { $sum: '$driver_allowance' },
                    service: { $sum: '$service' },
                    adblue: { $sum: '$adblue' },
                    grease: { $sum: '$grease' },
                    air: { $sum: '$air' },
                    other_expense: { $sum: '$other_expense' },
                },
            },
        ]);

        const tripSlices = tripTotals
            ? [
                { name: 'Fuel', value: tripTotals.fuel || 0 },
                { name: 'FASTag', value: tripTotals.fasttag || 0 },
                { name: 'Driver Allowance', value: tripTotals.driver_allowance || 0 },
                { name: 'Service', value: tripTotals.service || 0 },
                { name: 'AdBlue', value: tripTotals.adblue || 0 },
                { name: 'Grease', value: tripTotals.grease || 0 },
                { name: 'Air', value: tripTotals.air || 0 },
                { name: 'Other (Trip)', value: tripTotals.other_expense || 0 },
            ].filter(s => s.value > 0)
            : [];

        // Admin expense types
        const adminMatch = { company_id };
        if (from || to) {
            adminMatch.start_date = {};
            if (from) adminMatch.start_date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                adminMatch.start_date.$lte = toDate;
            }
        }

        const adminSlices = await AdminExpense.aggregate([
            { $match: adminMatch },
            { $group: { _id: '$expense_type', value: { $sum: '$amount' } } },
            { $project: { _id: 0, name: '$_id', value: 1 } },
            { $sort: { value: -1 } },
        ]);

        // Merge — if same name exists in both, combine
        const merged = {};
        for (const s of [...tripSlices, ...adminSlices]) {
            merged[s.name] = (merged[s.name] || 0) + s.value;
        }

        const data = Object.entries(merged)
            .map(([name, value]) => ({ name, value }))
            .filter(s => s.value > 0)
            .sort((a, b) => b.value - a.value);

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('[analytics/expense-distribution]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
