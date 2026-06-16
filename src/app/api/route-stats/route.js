import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import Route from '@/models/Route';
import mongoose from 'mongoose';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const company_id = session.user.company_id;

        await dbConnect();

        // 1. Fetch route details
        const routes = await Route.find({ company_id }).lean();

        // 2. Aggregate trip statistics grouped by route_id
        const stats = await Trip.aggregate([
            {
                $match: {
                    company_id: new mongoose.Types.ObjectId(company_id),
                    route_id: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$route_id',
                    tripCount: { $sum: 1 },
                    totalIncome: { $sum: '$income' },
                    totalExpenses: { $sum: '$total_expenses' },
                    seatsFilledTotal: { $sum: '$seats_filled' },
                }
            }
        ]);

        // 3. Map statistics to the routes list
        const data = routes.map(route => {
            const routeStats = stats.find(s => s._id.toString() === route._id.toString()) || {
                tripCount: 0,
                totalIncome: 0,
                totalExpenses: 0,
                seatsFilledTotal: 0
            };

            return {
                ...route,
                tripCount: routeStats.tripCount,
                totalIncome: routeStats.totalIncome,
                totalExpenses: routeStats.totalExpenses,
                totalProfit: routeStats.totalIncome - routeStats.totalExpenses,
                averageSeatsFilled: routeStats.tripCount > 0 ? (routeStats.seatsFilledTotal / routeStats.tripCount).toFixed(1) : 0
            };
        });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
