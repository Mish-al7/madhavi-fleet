import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import Route from '@/models/Route';
import Vehicle from '@/models/Vehicle';
import User from '@/models/User';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const company_id = session.user.company_id;

        await dbConnect();

        const nightlyServices = await Trip.find({
            company_id,
            trip_type: 'nightly'
        })
        .populate('vehicle_id', 'vehicle_no vehicle_name seats ac_type bus_type')
        .populate('route_id')
        .populate('driver_id', 'name email')
        .sort({ trip_date: -1, createdAt: -1 });

        return NextResponse.json({ success: true, data: nightlyServices });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        // Strip client-sent company_id
        delete body.company_id;

        // Force trip_type and auto-fill route name in trip_route if route selected
        body.trip_type = 'nightly';
        if (body.route_id && !body.trip_route) {
            const route = await Route.findById(body.route_id);
            if (route) {
                body.trip_route = route.name;
            }
        }

        const trip = await Trip.create({
            ...body,
            company_id: session.user.company_id
        });

        return NextResponse.json({ success: true, data: trip }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
