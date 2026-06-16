import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const company_id = session.user.company_id;

        await dbConnect();

        // Fetch regular trips scoped to company
        const trips = await Trip.find({
            company_id,
            trip_type: 'regular'
        })
        .populate('vehicle_id', 'vehicle_no vehicle_name')
        .populate('driver_id', 'name email')
        .sort({ trip_date: -1, createdAt: -1 });

        return NextResponse.json({ success: true, data: trips });
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

        // Force trip_type to regular
        body.trip_type = 'regular';

        const trip = await Trip.create({
            ...body,
            company_id: session.user.company_id
        });

        return NextResponse.json({ success: true, data: trip }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
