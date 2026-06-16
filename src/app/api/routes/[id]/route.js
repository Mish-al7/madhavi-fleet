import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import Route from '@/models/Route';
import Trip from '@/models/Trip';
import { authOptions } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const company_id = session.user.company_id;

        const route = await Route.findOne({ _id: id, company_id });
        if (!route) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 });
        }

        return NextResponse.json(route);
    } catch (error) {
        console.error('Error fetching route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const data = await request.json();
        const company_id = session.user.company_id;

        // Strip client-sent company_id
        delete data.company_id;

        // Verify company ownership
        const existing = await Route.findOne({ _id: id, company_id });
        if (!existing) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 });
        }

        // Check if route name already exists within the same company (if changing)
        if (data.name) {
            const duplicate = await Route.findOne({
                name: data.name,
                company_id,
                _id: { $ne: id }
            });
            if (duplicate) {
                return NextResponse.json({ error: 'Route name already exists' }, { status: 400 });
            }
        }

        const route = await Route.findOneAndUpdate(
            { _id: id, company_id },
            data,
            { new: true, runValidators: true }
        );

        return NextResponse.json(route);
    } catch (error) {
        console.error('Error updating route:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const company_id = session.user.company_id;

        // Verify company ownership
        const route = await Route.findOne({ _id: id, company_id });
        if (!route) {
            return NextResponse.json({ error: 'Route not found' }, { status: 404 });
        }

        // Check for dependencies: are there trips utilizing this route?
        const tripCount = await Trip.countDocuments({ route_id: id, company_id });
        if (tripCount > 0) {
            return NextResponse.json({
                error: `Cannot delete route. It has ${tripCount} associated service logs.`
            }, { status: 400 });
        }

        await Route.findOneAndDelete({ _id: id, company_id });

        return NextResponse.json({ message: 'Route deleted successfully' });
    } catch (error) {
        console.error('Error deleting route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
