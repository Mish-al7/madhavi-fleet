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
        if (vehicle_id) tripMatch.vehicle_id = new mongoose.Types.ObjectId(vehicle_id);
        if (driver_id) tripMatch.driver_id = new mongoose.Types.ObjectId(driver_id);
        if (trip_type) tripMatch.trip_type = trip_type;

        // Aggregate trip-level expense categories
        const tripExpenses = await Trip.aggregate([
            { $match: tripMatch },
            {
                $group: {
                    _id: null,
                    fuel: { $sum: '$fuel' },
                    fasttag: { $sum: '$fasttag' },
                    driver_allowance: { $sum: '$driver_allowance' },
                    cleaner_payment: { $sum: '$cleaner_payment' },
                    driver_payment: { $sum: '$driver_payment' },
                    toll: { $sum: '$toll' },
                    service: { $sum: '$service' },
                    adblue: { $sum: '$adblue' },
                    grease: { $sum: '$grease' },
                    air: { $sum: '$air' },
                    other_expense: { $sum: '$other_expense' },
                },
            },
        ]);

        const te = tripExpenses[0] || {};

        const tripBreakdown = [
            { category: 'Fuel', type: 'trip', amount: te.fuel || 0 },
            { category: 'FASTag', type: 'trip', amount: te.fasttag || 0 },
            { category: 'Driver Allowance', type: 'trip', amount: te.driver_allowance || 0 },
            { category: 'Cleaner Bata', type: 'trip', amount: te.cleaner_payment || 0 },
            { category: 'Driver Payment (Nightly)', type: 'trip', amount: te.driver_payment || 0 },
            { category: 'Toll', type: 'trip', amount: te.toll || 0 },
            { category: 'Service', type: 'trip', amount: te.service || 0 },
            { category: 'AdBlue', type: 'trip', amount: te.adblue || 0 },
            { category: 'Grease', type: 'trip', amount: te.grease || 0 },
            { category: 'Air', type: 'trip', amount: te.air || 0 },
            { category: 'Other (Trip)', type: 'trip', amount: te.other_expense || 0 },
        ].filter(r => r.amount > 0);

        // Admin expenses by type — exclude if filtering by trip_type
        const adminExpMatch = trip_type ? { _id: null } : { company_id };
        if (!trip_type && (from || to)) {
            adminExpMatch.start_date = {};
            if (from) adminExpMatch.start_date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                adminExpMatch.start_date.$lte = toDate;
            }
        }
        if (!trip_type && vehicle_id) adminExpMatch.vehicle_id = new mongoose.Types.ObjectId(vehicle_id);

        const adminExpenses = await AdminExpense.aggregate([
            { $match: adminExpMatch },
            {
                $group: {
                    _id: '$expense_type',
                    amount: { $sum: '$amount' },
                },
            },
            {
                $project: {
                    _id: 0,
                    category: '$_id',
                    type: { $literal: 'admin' },
                    amount: 1,
                },
            },
            { $sort: { amount: -1 } },
        ]);

        const data = [
            ...tripBreakdown,
            ...adminExpenses,
        ].sort((a, b) => b.amount - a.amount);

        const total = data.reduce((sum, r) => sum + r.amount, 0);

        return NextResponse.json({ success: true, data, total });
    } catch (err) {
        console.error('[reports/expense-breakdown]', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
