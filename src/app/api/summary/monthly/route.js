import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
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

        const company_id = session.user.company_id;
        const { searchParams } = new URL(req.url);
        const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
        const selectedMonth = searchParams.get('month'); // e.g. "2026-01"
        const tripType = searchParams.get('trip_type') || 'all';

        // Build match filter
        const matchFilter = {
            company_id: new mongoose.Types.ObjectId(company_id),
        };

        if (selectedMonth && selectedMonth !== 'all') {
            matchFilter.month = selectedMonth;
        } else {
            matchFilter.month = { $regex: `^${year}-` };
        }

        if (tripType !== 'all') {
            matchFilter.trip_type = tripType;
        }

        const summary = await Trip.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: {
                        month: '$month',
                        vehicle_id: '$vehicle_id',
                    },
                    total_income: { $sum: '$income' },
                    total_expenses: { $sum: '$total_expenses' },
                    tripCount: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'vehicles',
                    localField: '_id.vehicle_id',
                    foreignField: '_id',
                    as: 'vehicle',
                },
            },
            { $unwind: '$vehicle' },
            {
                $project: {
                    _id: 0,
                    month: '$_id.month',
                    vehicle_id: '$_id.vehicle_id',
                    vehicle_no: '$vehicle.vehicle_no',
                    total_income: 1,
                    total_expenses: 1,
                    tripCount: 1,
                    profit: { $subtract: ['$total_income', '$total_expenses'] },
                },
            },
            {
                $sort: { month: 1, vehicle_no: 1 },
            },
        ]);

        // Get available months for filter pills
        const distinctFilter = {
            company_id: new mongoose.Types.ObjectId(company_id),
            month: { $regex: `^${year}-` },
        };
        if (tripType !== 'all') {
            distinctFilter.trip_type = tripType;
        }
        const availableMonths = await Trip.distinct('month', distinctFilter);

        // Sort months descending (most recent first)
        availableMonths.sort((a, b) => b.localeCompare(a));

        return NextResponse.json({ success: true, data: summary, availableMonths });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
