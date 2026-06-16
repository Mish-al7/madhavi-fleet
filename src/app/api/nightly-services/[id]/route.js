import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import Route from '@/models/Route';

export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const company_id = session.user.company_id;

        const trip = await Trip.findOne({ _id: id, company_id, trip_type: 'nightly' })
            .populate('vehicle_id')
            .populate('route_id')
            .populate('driver_id');

        if (!trip) {
            return NextResponse.json({ error: 'Nightly service entry not found' }, { status: 404 });
        }

        return NextResponse.json(trip);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function PUT(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const body = await req.json();
        const company_id = session.user.company_id;

        // Strip client-sent company_id
        delete body.company_id;

        // Verify company ownership and correct type
        const existing = await Trip.findOne({ _id: id, company_id, trip_type: 'nightly' });
        if (!existing) {
            return NextResponse.json({ error: 'Nightly service entry not found' }, { status: 404 });
        }

        // If route has changed, fetch and update trip_route label
        if (body.route_id && body.route_id !== existing.route_id?.toString()) {
            const route = await Route.findById(body.route_id);
            if (route) {
                body.trip_route = route.name;
            }
        }

        // Run validate triggers for auto-calculating total expenses/income
        const updated = await Trip.findOneAndUpdate(
            { _id: id, company_id, trip_type: 'nightly' },
            body,
            { new: true, runValidators: true }
        );

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const company_id = session.user.company_id;

        const deleted = await Trip.findOneAndDelete({ _id: id, company_id, trip_type: 'nightly' });

        if (!deleted) {
            return NextResponse.json({ error: 'Nightly service entry not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Nightly service entry deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
