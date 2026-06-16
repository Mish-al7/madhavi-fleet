import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from '@/lib/dbConnect';
import Route from '@/models/Route';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const company_id = session.user.company_id;

        await dbConnect();

        const routes = await Route.find({ company_id }).sort({ name: 1 });

        return NextResponse.json({ success: true, data: routes });
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

        // Strip any client-sent company_id and inject from JWT
        delete body.company_id;

        const route = await Route.create({
            ...body,
            company_id: session.user.company_id,
        });

        return NextResponse.json({ success: true, data: route }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
