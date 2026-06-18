import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Trip from '@/models/Trip';
import Booking from '@/models/Booking';

export async function GET(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const company_id = session.user.company_id;

        const trip = await Trip.findOne({ _id: id, company_id, trip_type: 'regular' })
            .populate('vehicle_id')
            .populate('driver_id');

        if (!trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
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

        const trip = await Trip.findOne({ _id: id, company_id, trip_type: 'regular' });
        if (!trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        // Update fields
        Object.keys(body).forEach(key => {
            if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'company_id') {
                trip[key] = body[key];
            }
        });

        await trip.save();

        return NextResponse.json(trip);
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

        const trip = await Trip.findOne({ _id: id, company_id, trip_type: 'regular' });
        if (!trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        // If trip was linked to a booking, restore booking status to approved
        if (trip.bookingId) {
            await Booking.findByIdAndUpdate(trip.bookingId, { status: 'approved' });
        }

        await Trip.findOneAndDelete({ _id: id, company_id, trip_type: 'regular' });

        return NextResponse.json({ message: 'Trip deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
